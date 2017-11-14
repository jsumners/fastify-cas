'use strict'

const test = require('tap').test
const clear = require('clear-require')
const proxyquire = require('proxyquire')
const factoryPath = require.resolve('../../lib/ticketValidator')

test('validates protocol v1', (t) => {
  t.plan(3)
  clear.match(/fastify-cas/)
  proxyquire(factoryPath, {
    request (opts, cb) {
      cb(null, {statusCode: 200}, 'yes\n')
    }
  })
  const cas = {
    baseUrl: 'http://cas.example.com',
    queryParameters: {
      service: 'http://app.example.com/casauth'
    }
  }
  const validator = require(factoryPath)(1)
  validator('ST-123456', cas, (err, result) => {
    if (err) t.threw(err)
    t.type(result, Object)
    t.is(result.authenticated, true)
    t.is(result.response, true)
  })
})
