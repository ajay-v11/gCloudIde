import winston from 'winston';
// Determine log level from environment variables, defaulting to 'info'
const level = process.env.LOG_LEVEL || 'info';
// Define a format for console logs in development for better readability
const consoleFormat = winston.format.printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level}] : ${message} `;
    if (Object.keys(metadata).length) {
        // A simple way to stringify metadata for console view
        const metaString = Object.entries(metadata)
            .map(([key, value]) => `${key}=${value instanceof Object ? JSON.stringify(value) : value}`)
            .join(' ');
        if (metaString) {
            msg += `| ${metaString}`;
        }
    }
    return msg;
});
const logger = winston.createLogger({
    level: level,
    format: winston.format.combine(winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston.format.errors({ stack: true }), // Log stack traces
    winston.format.splat()),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(winston.format.colorize(), // Add colors to the output
            consoleFormat),
        }),
    ],
});
// For production environments, you might want JSON logs
if (process.env.NODE_ENV === 'production') {
    logger.clear().add(new winston.transports.Console({
        format: winston.format.combine(winston.format.timestamp(), winston.format.json() // Structured JSON logs
        ),
    }));
}
export default logger;
