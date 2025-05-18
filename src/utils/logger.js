/**
 * Logger utility for better debugging
 */
const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define custom format
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    let metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level.toUpperCase()}]: ${message} ${metaStr}`;
  })
);

// Create logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        customFormat
      )
    }),
    // File transport for all logs
    new winston.transports.File({ 
      filename: path.join(logsDir, 'combined.log') 
    }),
    // File transport for error logs
    new winston.transports.File({ 
      filename: path.join(logsDir, 'error.log'),
      level: 'error'
    }),
    // File transport specifically for socket logs
    new winston.transports.File({ 
      filename: path.join(logsDir, 'socket.log'),
      level: 'debug'
    })
  ],
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logsDir, 'exceptions.log') 
    })
  ]
});

// Specialized loggers for different components
const socketLogger = {
  info: (message, meta = {}) => logger.info(`[SOCKET] ${message}`, meta),
  error: (message, meta = {}) => logger.error(`[SOCKET] ${message}`, meta),
  debug: (message, meta = {}) => logger.debug(`[SOCKET] ${message}`, meta),
  warn: (message, meta = {}) => logger.warn(`[SOCKET] ${message}`, meta)
};

const modelLogger = {
  info: (message, meta = {}) => logger.info(`[MODEL] ${message}`, meta),
  error: (message, meta = {}) => logger.error(`[MODEL] ${message}`, meta),
  debug: (message, meta = {}) => logger.debug(`[MODEL] ${message}`, meta),
  warn: (message, meta = {}) => logger.warn(`[MODEL] ${message}`, meta)
};

module.exports = {
  logger,
  socketLogger,
  modelLogger
}; 