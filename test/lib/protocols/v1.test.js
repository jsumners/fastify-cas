'use strict'

const test = require('tap').test
const validator = require('../../../lib/protocols/v1').validator

test('v1 validates response without a line feed', (t) => {
  t.plan(2)
  validator('yes', (err, result) => {
    t.type(err, Error)
    t.match(err.message, /invalid CAS 1.0/)
  })
})

test('v1 validates negative authorizations', (t) => {
  t.plan(3)
  validator('no\n', (err, result) => {
    if (err) t.threw(err)
    t.type(result, Object)
    t.is(result.response, false)
    t.is(result.authenticated, false)
  })
})

test('v1 validates positive authorizations', (t) => {
  t.plan(3)
  validator('yes\n', (err, result) => {
    if (err) t.threw(err)
    t.type(result, Object)
    t.is(result.response, true)
    t.is(result.authenticated, true)
  })
})
