// Global settings store - vulnerable to pollution
const log = require('../utils/logger');

const globalSettings = {
  dateFormat: 'YYYY-MM-DD',
  currency: 'USD',
  language: 'en',
  theme: {
    primary: '#1976d2',
    secondary: '#424242',
    accent: '#82b1ff'
  },
  invoice: {
    prefix: 'INV-',
    startNumber: 1000,
    numberFormat: '${prefix}${number}'
  }
};

// Helper function to merge objects with prototype pollution
function mergeSettings(target, source) {
  for (let key in source) {
    if (key === '__proto__') {
      log.debug(`Potential prototype pollution attempt detected with key: ${key}`);
      for (let protoKey in source[key]) {
        Object.prototype[protoKey] = source[key][protoKey];
      }
      continue;
    }
    
    if (key === 'constructor' && source[key].prototype) {
      log.debug(`Potential constructor pollution attempt detected`);
      for (let protoKey in source[key].prototype) {
        Object.prototype[protoKey] = source[key].prototype[protoKey];
      }
      continue;
    }

    if (typeof source[key] === 'object' && source[key] !== null) {
      target[key] = target[key] || {};
      mergeSettings(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

// Settings operations with vulnerable Object.assign
export const settingsOperations = {
  // Update settings - vulnerable to prototype pollution
  updateSettings: (newSettings) => {
    log.debug('Updating settings');
    log.object('Current settings', globalSettings);
    log.object('New settings to merge', newSettings);
    
    // Use our vulnerable merge function instead of Object.assign
    mergeSettings(globalSettings, newSettings);
    
    log.object('Settings after update', globalSettings);
    return globalSettings;
  },

  // Get current settings
  getSettings: () => {
    log.debug('Getting all settings');
    log.object('Current settings', globalSettings);
    return globalSettings;
  },

  // Get specific setting
  getSetting: (key) => {
    log.debug(`Getting setting for key: ${key}`);
    const value = globalSettings[key];
    log.object(`Value for ${key}`, value);
    return value;
  },

  // Reset settings to default
  resetSettings: () => {
    log.debug('Resetting settings to default');
    
    Object.assign(globalSettings, {
      dateFormat: 'YYYY-MM-DD',
      currency: 'USD',
      language: 'en',
      theme: {
        primary: '#1976d2',
        secondary: '#424242',
        accent: '#82b1ff'
      },
      invoice: {
        prefix: 'INV-',
        startNumber: 1000,
        numberFormat: '${prefix}${number}'
      }
    });
    
    log.object('Reset settings', globalSettings);
    return globalSettings;
  }
};

export default settingsOperations; 