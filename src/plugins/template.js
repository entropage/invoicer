// @flow
import {createPlugin} from 'fusion-core';
import {v4 as uuidv4} from 'uuid';

// Error types
const ErrorTypes = {
  TEMPLATE_SYNTAX: 'TEMPLATE_SYNTAX_ERROR',
  EXECUTION: 'EXECUTION_ERROR',
  NETWORK: 'NETWORK_ERROR',
  FILE_SYSTEM: 'FILE_SYSTEM_ERROR',
  TIMEOUT: 'TIMEOUT_ERROR',
};

// Temporary in-memory storage for templates
const templates = new Map();

// Helper function to handle async operations with timeout
async function withTimeout(promise, timeoutMs = 5000) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    return `Error: ${error.message}`;
  }
}

// Helper function to handle template evaluation
async function evaluateTemplate(template, data) {
  const fn = new Function('data', `
    const require = global.require || module.require;
    return (async () => {
      try {
        with (data) {
          const result = eval(\`${template}\`);
          if (result && typeof result.then === 'function') {
            return await Promise.resolve(result).then(async value => {
              if (value && typeof value.then === 'function') {
                return await value;
              }
              return value;
            });
          }
          return result;
        }
      } catch (e) {
        console.error('Template evaluation error:', e);
        return \`Error: \${e.message}\`;
      }
    })();
  `);

  try {
    const result = await withTimeout(Promise.resolve().then(() => fn(data)));
    if (result && typeof result.then === 'function') {
      return await withTimeout(result);
    }
    return result;
  } catch (e) {
    console.error('Template timeout error:', e);
    return `Error: Operation timed out`;
  }
}

// Vulnerable template engine that allows arbitrary code execution
async function processTemplate(template, data) {
  try {
    // Input validation
    if (!template || typeof template !== 'string') {
      return 'Error: Template must be a non-empty string';
    }

    // Log template processing attempt
    console.debug('Processing template:', {
      templateLength: template.length,
      hasData: !!data,
      timestamp: new Date().toISOString(),
    });

    // Process template
    const result = await evaluateTemplate(template, data);

    // Log successful processing
    console.debug('Template processed successfully:', {
      resultType: typeof result,
      result: result?.toString?.(),
      timestamp: new Date().toISOString(),
    });

    return result;
  } catch (error) {
    // Log error with context
    console.error('Template processing error:', {
      message: error.message,
      stack: error.stack,
      template: template.substring(0, 100) + (template.length > 100 ? '...' : ''),
      timestamp: new Date().toISOString(),
    });

    return `Error: ${error.message}`;
  }
}

export default createPlugin({
  deps: {},
  middleware: () => {
    return async (ctx, next) => {
      if (ctx.path.startsWith('/api/template')) {
        const startTime = Date.now();
        const requestId = uuidv4();

        // Log request
        console.debug('Template request received:', {
          method: ctx.method,
          path: ctx.path,
          requestId,
          timestamp: new Date().toISOString(),
        });

        try {
          if (ctx.method === 'POST' && ctx.path === '/api/template') {
            const {name, content} = ctx.request.body;
            if (!name || !content) {
              ctx.status = 400;
              ctx.body = {error: 'Name and content are required'};
              return;
            }
            const id = uuidv4();
            templates.set(id, {name, content});
            ctx.body = {id};
            return;
          }

          if (ctx.method === 'GET' && ctx.path.startsWith('/api/template/')) {
            const id = ctx.path.split('/')[3];
            const template = templates.get(id);
            if (!template) {
              ctx.status = 404;
              ctx.body = {error: 'Template not found'};
              return;
            }
            ctx.body = template;
            return;
          }

          if (ctx.method === 'POST' && ctx.path === '/api/template/render') {
            const {template, data} = ctx.request.body;
            if (!template) {
              ctx.status = 400;
              ctx.body = {error: 'Template is required'};
              return;
            }
            try {
              const result = await processTemplate(template, data || {});
              ctx.body = {result: result?.toString() || ''};
            } catch (error) {
              console.error('Template rendering error:', {
                error: error.message,
                requestId,
                timestamp: new Date().toISOString(),
              });
              ctx.status = 500;
              ctx.body = {error: error.message};
            }
            return;
          }

          // If no route matches
          ctx.status = 404;
          ctx.body = {error: 'Not found'};
        } catch (error) {
          console.error('Unexpected error:', {
            error: error.message,
            requestId,
            timestamp: new Date().toISOString(),
          });
          ctx.status = 500;
          ctx.body = {error: 'Internal server error'};
        } finally {
          // Log response time
          const duration = Date.now() - startTime;
          console.debug('Template request completed:', {
            method: ctx.method,
            path: ctx.path,
            status: ctx.status,
            duration,
            requestId,
            timestamp: new Date().toISOString(),
          });
        }
      }
      await next();
    };
  },
});