// next-logger.config.js
const pino = require('pino')

const logger = defaultConfig =>
  pino({
    ...defaultConfig,
    messageKey: 'message',
    mixin: () => ({ name: 'nurse-schedule-instance' }),
  })

module.exports = {
  logger,
}