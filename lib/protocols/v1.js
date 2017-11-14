'use strict'

const log = require('../logger')().child({cas: 'protocol1'})

module.exports.serviceValidate = '/validate'

module.exports.validator = function casProtocol1Validator (payload, done) {
  const parts = payload.toLowerCase().split('\n')
  if (parts.length < 2) {
    log.trace('invalid cas 1.0 payload: %s', payload)
    return done(Error('invalid CAS 1.0 validation payload'))
  }
  switch (parts[0]) {
    case 'yes':
      log.trace('cas 1.0 authorization success')
      done(null, {response: true, authenticated: true})
      break
    case 'no':
      log.trace('cas 1.0 authorization failure')
      done(null, {response: false, authenticated: false})
      break
    default:
      log.trace('cas 1.0 unrecognized authorization response')
      done(Error('unrecognized CAS 1.0 payload'))
  }
}
