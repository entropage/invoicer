import { settingsOperations } from '../models/settings';

export default async function settingsHandler(ctx) {
  const { method, path } = ctx;
  const parts = path.split('/');
  const action = parts[parts.length - 1];

  try {
    switch (method) {
      case 'GET':
        if (action === 'all') {
          ctx.body = settingsOperations.getSettings();
        } else {
          const setting = settingsOperations.getSetting(action);
          if (setting !== undefined) {
            ctx.body = { [action]: setting };
          } else {
            ctx.status = 404;
            ctx.body = { error: 'Setting not found' };
          }
        }
        break;

      case 'POST':
        if (action === 'update') {
          const newSettings = ctx.request.body;
          ctx.body = settingsOperations.updateSettings(newSettings);
        } else if (action === 'reset') {
          ctx.body = settingsOperations.resetSettings();
        } else {
          ctx.status = 400;
          ctx.body = { error: 'Invalid action' };
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