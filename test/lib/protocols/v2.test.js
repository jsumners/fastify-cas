'use strict'

const test = require('tap').test
const fixtures = require('./fixtures')
const validator = require('../../../lib/protocols/v2').validator

test('v2 validates positive authorizations', (t) => {
  t.plan(7)
  validator(fixtures.protocol2.success, (err, result) => {
    if (err) t.threw(err)
    t.type(result, Object)
    t.is(result.authenticated, true)
    t.ok(result.response)
    t.ok(result.response.user)
    t.is(result.response.user, 'username')
    t.ok(result.response.proxyGrantingTicket)
    t.match(result.response.proxyGrantingTicket, /84678/)
  })
})

test('v2 validates negative authorizations', (t) => {
  t.plan(8)
  validator(fixtures.protocol2.failure, (err, result) => {
    if (err) t.threw(err)
    t.type(result, Object)
    t.is(result.authenticated, false)
    t.ok(result.response)
    t.ok(result.response.$)
    t.ok(result.response.$.code)
    t.is(result.response.$.code, 'INVALID_TICKET')
    t.ok(result.response._)
    t.match(result.response._, /1856339/)
  })
})

test('v2 validates malformed responses', (t) => {
  t.plan(2)
  const xml = '<dsiafl,'
  validator(xml, (err, result) => {
    t.type(err, Error)
    t.match(err.message, /Invalid character/)
  })
})
