# fastify-cas

`fastify-cas` provides authentication to [Fastify](https://fastify.io/)
applications via a remote service implementing the [Apereo CAS protocol](proto).
It supports version 1.0, 2.0, and 3.0 of the protocol.

Currently, the only supported parameter for the remote CAS server is the
`service` parameter. Please file [an issue][issues] if support is required
for other parameters (e.g. `gateway`).

[proto]: https://github.com/apereo/cas/blob/4db907bae/docs/cas-server-documentation/protocol/CAS-Protocol-Specification.md
[issues]: https://github.com/jsumners/fastify-cas/issues

## Example

```js
const fastify = require('fastify')()

fastify
  .register('fastify-cookie') // see module readme for required options
  .register('fastify-caching') // see module readme for required options
  .register('fastify-server-session, {
    secretKey: '12345678901234567890123456789012' // see module readme for required options
  })
  .register('fastify-cas', {
    appBaseUrl: 'http://example.com',
    casServer: {
      baseUrl: 'https://cas.example.com'
    }
  })

fastify.get('/secret-stuff', (req, reply) => {
  reply.send({
    userGroups: req.session.cas.memberOf
  })
})
```

Note the registration of three other Fastify plugins prior to `fastify-cas`.
These plugins, or ones that provide equivalent functionality, are necessary
for `fastify-cas` to function, but it is left up to the user to install them.

## Options

The plugin accepts an object with the follow properties:

+ `appBaseUrl` (Default: `undefined`) [required]: specifies the base URL of the
application so the plugin can build URLs.
+ `endpointPath` (Default: `/casauth`): URI for the endpoint to add that will
handle communications with the remote CAS server.
+ `unauthorizedEndpoint` (Default: `/unauthorized`): where to send users if
authentication fails due to a rejection.
+ `strictSSL` (Default: `true`): determines if TLS certificates will be
validated when communicating with the remote CAS server.
+ `casServer` [required]: specifies information about the remote CAS server.
It has the following defaults:
    * `baseUrl`: `undefined` -- this **must** be set to the remote CAS server's
    base URL.
    * `version`: `3` -- possible values are `1`, `2`, and `3` for the
    respective protocol versions. Each `fastify-cas` instance will only attempt
    to communicate via a *single* version of the protocol.

## Details

`fastify-cas`:

1. Decorates the Fastify instance with a `casLogoutUrl` property. This allows
for integrating with CAS's single logout feature.
2. Adds a `GET` handler at `endpointPath` which satisfies the CAS protocol's
communications URI requirement.
3. Adds a `preHandler` that checks if the user is authenticated and forwards
them to the remote CAS server if not.
4. Logs errors at the `error` level with associated stack traces at the `debug`
level. All informative logs are logged at the `trace` level.

## License

[MIT License](http://jsumners.mit-license.org/)
