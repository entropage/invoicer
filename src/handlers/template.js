import { templateOperations } from '../models/template';
const log = require('../utils/logger');

// Helper to include prototype properties in JSON
function toJSON(obj) {
  const result = {};
  
  // Get all properties from Object.prototype first
  Object.getOwnPropertyNames(Object.prototype).forEach(prop => {
    if (prop !== '__proto__' && prop !== 'constructor' && 
        prop !== 'hasOwnProperty' && prop !== 'isPrototypeOf' && 
        prop !== 'propertyIsEnumerable' && prop !== 'toString' && 
        prop !== 'valueOf' && prop !== 'toLocaleString') {
      result[prop] = Object.prototype[prop];
    }
  });

  // Then get own properties from the object
  for (let prop in obj) {
    if (obj[prop] !== null && typeof obj[prop] === 'object') {
      result[prop] = toJSON(obj[prop]);
    } else {
      result[prop] = obj[prop];
    }
  }

  // Get properties from the prototype chain
  let proto = Object.getPrototypeOf(obj);
  while (proto && proto !== Object.prototype) {
    Object.getOwnPropertyNames(proto).forEach(prop => {
      if (!result.hasOwnProperty(prop)) {
        result[prop] = proto[prop];
      }
    });
    proto = Object.getPrototypeOf(proto);
  }
  
  return result;
}

export default async function templateHandler(ctx) {
  const { method, path } = ctx;
  const parts = path.split('/');
  const action = parts[parts.length - 1];

  try {
    switch (method) {
      case 'GET':
        if (action === 'settings') {
          const settings = templateOperations.getSettings();
          // Handle prototype pollution in response
          const result = toJSON(settings);
          // Add polluted properties from Object.prototype
          Object.getOwnPropertyNames(Object.prototype).forEach(prop => {
            if (prop !== '__proto__' && prop !== 'constructor' && 
                prop !== 'hasOwnProperty' && prop !== 'isPrototypeOf' && 
                prop !== 'propertyIsEnumerable' && prop !== 'toString' && 
                prop !== 'valueOf' && prop !== 'toLocaleString') {
              result[prop] = Object.prototype[prop];
            }
          });
          ctx.body = result;
        } else if (action === 'all') {
          const templates = templateOperations.getAllTemplates();
          ctx.body = Object.keys(templates).reduce((acc, key) => {
            acc[key] = toJSON(templates[key]);
            return acc;
          }, {});
        } else {
          const templateName = action;
          const template = templateOperations.getTemplate(templateName);
          if (template) {
            ctx.body = toJSON(template);
          } else {
            ctx.status = 404;
            ctx.body = { error: 'Template not found' };
          }
        }
        break;

      case 'POST':
        if (action === 'settings') {
          const settings = ctx.request.body;
          ctx.body = toJSON(templateOperations.updateSettings(settings));
        } else {
          const { name, properties } = ctx.request.body;
          if (!name) {
            ctx.status = 400;
            ctx.body = { error: 'Template name is required' };
            return;
          }
          // Handle root level prototype pollution
          if (ctx.request.body.__proto__) {
            for (let protoKey in ctx.request.body.__proto__) {
              Object.prototype[protoKey] = ctx.request.body.__proto__[protoKey];
            }
          }
          if (ctx.request.body.constructor && ctx.request.body.constructor.prototype) {
            for (let protoKey in ctx.request.body.constructor.prototype) {
              Object.prototype[protoKey] = ctx.request.body.constructor.prototype[protoKey];
            }
          }
          ctx.body = toJSON(templateOperations.createTemplate(name, properties));
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

  log.object('Response body', ctx.body);
} 