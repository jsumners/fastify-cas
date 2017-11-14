'use strict'

const qs = require('query-string')

module.exports = function casFactory (options) {
  const serviceUrl = options.appBaseUrl + options.endpointPath
  // TODO: add support for things like `gateway` and `method`
  const queryParameters = {
    service: serviceUrl
  }

  const baseUrl = options.casServer.baseUrl
  const loginUrl = `${baseUrl}/login?${qs.stringify(queryParameters)}`
  const logoutUrl = `${baseUrl}/logout?${qs.stringify(queryParameters)}`

  const validator = require('./ticketValidator')(options.casServer.version, options.strictSSL)

  return {
    baseUrl,
    loginUrl,
    logoutUrl,
    queryParameters,
    serviceUrl,
    validator
  }
}
