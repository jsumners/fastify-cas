'use strict'

const abstractLogging = require('abstract-logging')

let log
module.exports = function fastifyCasLoggerFactory (instance) {
  if (log && !instance) return log
  if (instance) log = instance
  if (!log) {
    log = Object.create(abstractLogging)
    log.child = () => log
  }
  return log
}
