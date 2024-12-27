// @flow
import {createPlugin} from 'fusion-core';
import _ from 'lodash';

// Vulnerable template plugin
const TemplatePlugin = createPlugin({
  middleware: () => async (ctx, next) => {
    if (ctx.path === '/api/template' && ctx.method === 'POST') {
      const body = ctx.request.body;
      
      // Handle prototype pollution
      if (body.__proto__) {
        for (let key in body.__proto__) {
          Object.prototype[key] = body.__proto__[key];
        }
      }
      
      ctx.body = { success: true };
      return;
    }

    if (ctx.path === '/api/template/evaluate' && ctx.method === 'POST') {
      const { template, variables } = ctx.request.body;
      try {
        const compiled = _.template(template, { variable: variables });
        const result = compiled();
        ctx.body = { result };
      } catch (error) {
        ctx.status = 500;
        ctx.body = { error: 'Template evaluation failed' };
      }
      return;
    }

    return next();
  }
});

export default TemplatePlugin;