// Template model with vulnerable merge function
const log = require('../utils/logger');

const defaultTemplate = {
  header: 'Default Invoice',
  footer: 'Thank you for your business',
  styles: {
    font: 'Arial',
    fontSize: '12px',
    color: '#000000'
  }
};

// Vulnerable deep merge function - no prototype chain protection
function mergeTemplates(target, source) {
  log.debug('Merging templates');
  log.object('Target before merge', target);
  log.object('Source to merge', source);

  for (let key in source) {
    log.debug(`Processing key: ${key}`);
    
    // Intentionally vulnerable: allow prototype pollution
    if (key === '__proto__') {
      log.debug(`Potential prototype pollution attempt detected with key: ${key}`);
      for (let protoKey in source[key]) {
        Object.prototype[protoKey] = source[key][protoKey];
      }
      continue;
    }
    
    // Intentionally vulnerable: allow constructor prototype pollution
    if (key === 'constructor' && source[key].prototype) {
      log.debug(`Potential constructor pollution attempt detected`);
      for (let protoKey in source[key].prototype) {
        Object.prototype[protoKey] = source[key].prototype[protoKey];
      }
      continue;
    }

    if (typeof source[key] === 'object' && source[key] !== null) {
      if (!target[key]) {
        target[key] = {};
      }
      mergeTemplates(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  
  log.object('Result after merge', target);
  return target;
}

// Template store with global state - makes pollution more impactful
const templateStore = {
  templates: {},
  settings: defaultTemplate
};

// Template operations
export const templateOperations = {
  // Create/Update template with user input
  createTemplate: (name, properties) => {
    log.debug(`Creating template: ${name}`);
    log.object('Template properties', properties);
    
    // Handle root level prototype pollution
    if (properties && properties.__proto__) {
      log.debug(`Potential root level prototype pollution attempt detected`);
      for (let protoKey in properties.__proto__) {
        Object.prototype[protoKey] = properties.__proto__[protoKey];
      }
    }
    
    // Handle root level constructor pollution
    if (properties && properties.constructor && properties.constructor.prototype) {
      log.debug(`Potential root level constructor pollution attempt detected`);
      for (let protoKey in properties.constructor.prototype) {
        Object.prototype[protoKey] = properties.constructor.prototype[protoKey];
      }
    }
    
    const template = mergeTemplates({}, defaultTemplate);
    templateStore.templates[name] = mergeTemplates(template, properties);
    
    log.object('Created template', templateStore.templates[name]);
    return templateStore.templates[name];
  },

  // Get template by name
  getTemplate: (name) => {
    log.debug(`Getting template: ${name}`);
    const template = templateStore.templates[name] || null;
    log.object('Retrieved template', template);
    return template;
  },

  // Update global template settings - vulnerable to pollution
  updateSettings: (settings) => {
    log.debug('Updating template settings');
    log.object('New settings', settings);
    
    mergeTemplates(templateStore.settings, settings);
    
    log.object('Updated settings', templateStore.settings);
    return templateStore.settings;
  },

  // Get all templates
  getAllTemplates: () => {
    log.debug('Getting all templates');
    log.object('Templates', templateStore.templates);
    return templateStore.templates;
  },

  // Get global settings
  getSettings: () => {
    log.debug('Getting template settings');
    log.object('Settings', templateStore.settings);
    return templateStore.settings;
  }
};

export default templateOperations; 