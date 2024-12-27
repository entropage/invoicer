const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Create a new log file with timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const logFile = path.join(logsDir, `app-${timestamp}.log`);

// Helper to write to both console and file
function writeLog(level, message, data = null) {
  const timestamp = new Date().toISOString();
  let logMessage = `[${timestamp}] [${level}] ${message}`;
  
  if (data) {
    logMessage += '\n' + JSON.stringify(data, null, 2);
  }
  logMessage += '\n';

  // Write to console
  console.log(logMessage);

  // Write to file
  fs.appendFileSync(logFile, logMessage);
}

module.exports = {
  debug: (message) => writeLog('DEBUG', message),
  info: (message) => writeLog('INFO', message),
  warn: (message) => writeLog('WARN', message),
  error: (message) => writeLog('ERROR', message),
  object: (label, obj) => writeLog('OBJECT', label, obj)
}; 