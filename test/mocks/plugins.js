'use strict'

module.exports = {
  cookiePlugin,
  cachingPlugin,
  sessionPlugin
}

function cookiePlugin (instance, opts, next) {
  instance.decorateRequest('cookies', [])
  instance.decorateReply('setCookie', () => {})
  next()
}
cookiePlugin[Symbol.for('skip-override')] = true

function cachingPlugin (instance, opts, next) {
  instance.decorate('cache', {
    set (key, value, life, cb) {
      cb()
    },
    get (key, cb) {
      cb()
    }
  })
  next()
}
cachingPlugin[Symbol.for('skip-override')] = true

function sessionPlugin (instance, opts, next) {
  instance.decorateRequest('session', {})
  next()
}
sessionPlugin[Symbol.for('skip-override')] = true
