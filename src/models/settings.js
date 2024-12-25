// Global settings store - vulnerable to pollution
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

// Settings operations with vulnerable Object.assign
export const settingsOperations = {
  // Update settings - vulnerable to prototype pollution
  updateSettings: (newSettings) => {
    // Vulnerable: directly assigns without checking prototype chain
    Object.assign(globalSettings, newSettings);
    return globalSettings;
  },

  // Get current settings
  getSettings: () => {
    return globalSettings;
  },

  // Get specific setting
  getSetting: (key) => {
    return globalSettings[key];
  },

  // Reset settings to default
  resetSettings: () => {
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
    return globalSettings;
  }
};

export default settingsOperations; 