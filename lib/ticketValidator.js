'use strict'

const log = require('./logger')().child({cas: 'casTicketValidator'})
const request = require('request')

module.exports = function casTicketValidatorFactory (version, strictSSL) {
  const protocol = require('./protocols')[`v${version}`]
  return function casTicketValidator (ticket, cas, done) {
    log.trace('validating v%s ticket: %s', version, ticket)
    const reqOptions = {
      url: cas.baseUrl + protocol.serviceValidate,
      qs: Object.assign({ticket}, cas.queryParameters),
      strictSSL
    }
    request(reqOptions, function reqCB (err, response, body) {
      if (err) {
        log.error('failed to query remote cas server: %s', err.message)
        log.debug(err.stack)
        return done(err)
      }

      if (response.statusCode !== 200) {
        log.trace('received invalid status code %s from remote cas server', response.statusCode)
        return done(Error(`CAS server returned status: ${response.statusCode}`))
      }

      log.trace('received payload: `%s`', Buffer.from(body, 'utf8').toString('hex'))
      protocol.validator(body, done)
    })
  }
}
