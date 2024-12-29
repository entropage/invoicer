import { settingsOperations } from '../models/settings';
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

export default async function settingsHandler(ctx) {
  const { method, path } = ctx;
  const parts = path.split('/');
  const action = parts[parts.length - 1];

  try {
    switch (method) {
      case 'GET':
        if (action === 'all') {
          ctx.body = toJSON(settingsOperations.getSettings());
        } else {
          const setting = settingsOperations.getSetting(action);
          if (setting !== undefined) {
            ctx.body = toJSON({ [action]: setting });
          } else {
            ctx.status = 404;
            ctx.body = { error: 'Setting not found' };
          }
        }
        break;

      case 'POST':
        if (action === 'update') {
          const newSettings = ctx.request.body;
          ctx.body = toJSON(settingsOperations.updateSettings(newSettings));
        } else if (action === 'reset') {
          ctx.body = toJSON(settingsOperations.resetSettings());
        } else if (action === 'import-xml') {
          try {
            console.log('Received XML settings import request');
            const xmlString = ctx.request.body;
            
            if (!xmlString) {
              throw new Error('No XML data provided');
            }

            // Vulnerable: Parse XML with dangerous options
            const xmlDoc = ctx.xmlParser.parseXML(xmlString);
            console.log('Settings XML parsed successfully');

            // Vulnerable: Extract all settings including external entities
            const settingsNode = xmlDoc.root();
            const newSettings = {};

            // Vulnerable: Process all child nodes recursively
            function processNode(node, target) {
              node.childNodes().forEach(child => {
                if (child.type() === 'element') {
                  if (child.childNodes().length > 1) {
                    target[child.name()] = {};
                    processNode(child, target[child.name()]);
                  } else {
                    // Vulnerable: Store all text content including external entities
                    target[child.name()] = child.text();
                  }
                }
              });
            }

            processNode(settingsNode, newSettings);
            console.log('Extracted settings:', newSettings);

            // Update settings with extracted data
            ctx.body = toJSON(settingsOperations.updateSettings(newSettings));
            
            // Vulnerable: Include debug information in response
            ctx.body.debug = {
              xmlString,
              parsedXml: xmlDoc.toString()
            };
          } catch (error) {
            // Vulnerable: Return detailed error information
            console.error('XML parsing error:', error);
            ctx.status = 500;
            ctx.body = {
              error: error.message,
              stack: error.stack,
              xmlString: ctx.request.body
            };
          }
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

  log.debug('Settings request completed');
  log.object('Response body', ctx.body);
} 