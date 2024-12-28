// @flow
import { createPlugin } from 'fusion-core';
import _ from 'lodash';

// Temporary in-memory storage for templates
const templates = new Map();

// Vulnerable template engine that allows arbitrary code execution
function processTemplate(template, data = {}) {
  // SSTI vulnerability: Direct template string evaluation
  // This is intentionally vulnerable for educational purposes
  return new Function('data', `with(data) { return \`${template}\`; }`)(data);
}

// Template handler with vulnerable template processing
export default async function templateHandler(ctx) {
  const { method, path } = ctx;
  const parts = path.split('/');
  const action = parts[parts.length - 1];

  try {
    switch (method) {
      case 'POST':
        if (action === 'render') {
          // Vulnerable template rendering
          const { template, data } = ctx.request.body;
          if (!template) {
            ctx.status = 400;
            ctx.body = { error: 'Template string is required' };
            return;
          }
          try {
            const result = processTemplate(template, data);
            ctx.body = { result };
          } catch (error) {
            ctx.status = 500;
            ctx.body = { error: error.message };
          }
        } else {
          // Template creation
          const { name, content } = ctx.request.body;
          if (!name) {
            ctx.status = 400;
            ctx.body = { error: 'Template name is required' };
            return;
          }
          const id = Math.random().toString(36).substring(7);
          templates.set(id, { name, content });
          ctx.body = { id };
        }
        break;

      case 'GET':
        // Template retrieval
        const templateId = action;
        const template = templates.get(templateId);
        if (template) {
          ctx.body = template;
        } else {
          ctx.status = 404;
          ctx.body = { error: 'Template not found' };
        }
        break;

      default:
        ctx.status = 405;
        ctx.body = { error: 'Method not allowed' };
    }
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
} 