'use strict'

const log = require('../logger')().child({cas: 'protocol3'})
const xml2js = require('xml2js')
const utils = require('./utils')

module.exports.serviceValidate = '/p3/serviceValidate'

module.exports.validator = function casProtocol3Validator (payload, done) {
  log.trace('processing cas 3.0 xml payload')
  const parseStringOptions = {
    explicitArray: false,
    tagNameProcessors: [function (name) {
      return name.replace('cas:', '')
    }]
  }

  return xml2js.parseString(payload, parseStringOptions, function cb (err, jsxml) {
    if (err) {
      log.trace('xml2js parsing failed: %s', err.message)
      return done(err)
    }
    if (utils.hasServiceResponse(jsxml) === false) return done(Error('invalid CAS 2.0 payload'))
    if (utils.isAuthenticationFailure(jsxml)) {
      return done(null, {
        response: jsxml.serviceResponse.authenticationFailure,
        authenticated: false
      })
    }
    const authPayload = jsxml.serviceResponse.authenticationSuccess
    if (
      authPayload.attributes &&
      authPayload.attributes.memberOf &&
      Array.isArray(authPayload.attributes.memberOf) === false
    ) {
      authPayload.attributes.memberOf = [authPayload.attributes.memberOf]
    }
    done(null, {
      response: jsxml.serviceResponse.authenticationSuccess,
      authenticated: true
    })
  })
}
