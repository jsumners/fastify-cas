'use strict'

const fp = require('fastify-plugin')
const merge = require('merge-options')
const casFactory = require('./lib/cas')
const defaultOptions = {
  appBaseUrl: undefined,
  endpointPath: '/casauth',
  unauthorizedEndpoint: '/unauthorized',
  defaultRedirect: '/oops',
  strictSSL: true,
  casServer: {
    baseUrl: undefined,
    version: 3
  }
}

function casAuthPlugin (fastify, options, next) {
  const _options = (Function.prototype.isPrototypeOf(options)) ? {} : options
  const opts = merge({}, defaultOptions, _options)
  const cas = casFactory(opts)

  require('./lib/logger')(fastify.logger)
  fastify.register(require('fastify-url-data'))

  fastify.decorate('casLogoutUrl', cas.logoutUrl)

  // This preHandler is used to determine if the current request is
  // authenticated or not. If not, it ships the client over to the remote CAS
  // server for authentication.
  fastify.addHook('preHandler', function fastifyCasPreHandler (req, reply, next) {
    const session = req.session
    if (!session.cas) {
      session.cas = {
        authenticated: false,
        user: undefined,
        attributes: undefined
      }
    }

    if (req.query && req.query.ticket) return next()

    if (session.cas.authenticated) {
      req.log.trace('cas authenticated via session')
      return next()
    }

    req.log.trace('cas authentication required')
    session.cas.requestPath = req.urlData('path')
    reply.redirect(cas.loginUrl)
  })

  // This defines the CAS authentication handler endpoint. It coordinates
  // with the remote CAS server to determine if the user is authenticated.
  fastify.get(opts.endpointPath, function (req, reply) {
    const ticket = req.query.ticket
    if (!ticket) {
      req.log.trace('no ticket presented to cas handler')
      return reply.send(Error('missing cas ticket'))
    }

    cas.validator(ticket, cas, (err, result) => {
      if (err) {
        req.log.error('failed to validate cas ticket: %s', err.message)
        req.log.debug(err.stack)
        return reply.send(err)
      }

      const session = req.session.cas
      session.raw = result.response

      if (!result.authenticated) {
        session.failedRespone = result.response
        return reply.code(401).redirect(opts.unauthorizedEnpoint)
      }

      if (opts.casServer.version > 1) {
        session.user = result.response.user
      }

      if (opts.casServer.version > 2) {
        session.attributes = result.response.attributes
        session.memberOf = result.response.memberOf || []
      }

      session.authenticated = true

      const redirectPath = req.session.cas.requestPath || opts.defaultRedirect
      session.requestPath = undefined
      reply.code(303).redirect(redirectPath)
    })
  })

  next()
}

module.exports = fp(casAuthPlugin, '>=0.33.0')
