// Template model with vulnerable merge function
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
  for (let key in source) {
    if (typeof source[key] === 'object') {
      target[key] = mergeTemplates(target[key] || {}, source[key]);
    } else {
      target[key] = source[key];
    }
  }
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
    const template = mergeTemplates({}, defaultTemplate);
    templateStore.templates[name] = mergeTemplates(template, properties);
    return templateStore.templates[name];
  },

  // Get template by name
  getTemplate: (name) => {
    return templateStore.templates[name] || null;
  },

  // Update global template settings - vulnerable to pollution
  updateSettings: (settings) => {
    mergeTemplates(templateStore.settings, settings);
    return templateStore.settings;
  },

  // Get all templates
  getAllTemplates: () => {
    return templateStore.templates;
  },

  // Get global settings
  getSettings: () => {
    return templateStore.settings;
  }
};

export default templateOperations; 