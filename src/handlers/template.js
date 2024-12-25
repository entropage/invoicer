import { templateOperations } from '../models/template';

export default async function templateHandler(ctx) {
  const { method, path } = ctx;
  const parts = path.split('/');
  const action = parts[parts.length - 1];

  try {
    switch (method) {
      case 'GET':
        if (action === 'settings') {
          ctx.body = templateOperations.getSettings();
        } else if (action === 'all') {
          ctx.body = templateOperations.getAllTemplates();
        } else {
          const templateName = action;
          const template = templateOperations.getTemplate(templateName);
          if (template) {
            ctx.body = template;
          } else {
            ctx.status = 404;
            ctx.body = { error: 'Template not found' };
          }
        }
        break;

      case 'POST':
        if (action === 'settings') {
          const settings = ctx.request.body;
          ctx.body = templateOperations.updateSettings(settings);
        } else {
          const { name, properties } = ctx.request.body;
          if (!name) {
            ctx.status = 400;
            ctx.body = { error: 'Template name is required' };
            return;
          }
          ctx.body = templateOperations.createTemplate(name, properties);
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