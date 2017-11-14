'use strict'

module.exports = {
  hasServiceResponse (jsxml) {
    return jsxml.hasOwnProperty('serviceResponse')
  },

  isAuthenticationFailure (jsxml) {
    return this.hasServiceResponse(jsxml) && jsxml.serviceResponse.hasOwnProperty('authenticationFailure')
  },

  isAuthenticationSuccess (jsxml) {
    return !this.isAuthenticationFailure(jsxml) && jsxml.serviceResponse.hasOwnProperty('authenticationSuccess')
  }
}
