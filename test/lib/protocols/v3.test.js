'use strict'

const test = require('tap').test
const fixtures = require('./fixtures')
const validator = require('../../../lib/protocols/v3').validator

test('v3 validates negative authorizations', (t) => {
  t.plan(8)
  validator(fixtures.protocol3.failure, (err, result) => {
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

test('v3 validates malformed responses', (t) => {
  t.plan(2)
  const xml = '<dsiafl,'
  validator(xml, (err, result) => {
    t.type(err, Error)
    t.match(err.message, /Invalid character/)
  })
})

test('v3 validates positive authorizations', (t) => {
  t.plan(11)
  validator(fixtures.protocol3.success, (err, result) => {
    if (err) t.threw(err)
    t.type(result, Object)
    t.is(result.authenticated, true)
    t.ok(result.response)
    const response = result.response
    t.is(response.hasOwnProperty('user'), true)
    t.is(response.user, 'username')
    t.is(response.hasOwnProperty('proxyGrantingTicket'), true)
    t.match(response.proxyGrantingTicket, /84678/)
    t.is(response.hasOwnProperty('attributes'), true)
    t.type(response.attributes, Object)
    t.is(response.attributes.hasOwnProperty('lastname'), true)
    t.is(response.attributes.lastname, 'Doe')
  })
})

test('v3 returns authorizations with single groups as a list of groups', (t) => {
  t.plan(5)
  validator(fixtures.protocol3.successWithSingleGroup, (err, result) => {
    if (err) t.threw(err)
    const response = result.response
    t.is(response.hasOwnProperty('attributes'), true)
    t.is(response.attributes.hasOwnProperty('memberOf'), true)
    t.type(response.attributes.memberOf, Array)
    t.is(response.attributes.memberOf.length, 1)
    t.is(response.attributes.memberOf[0], 'foo')
  })
})
