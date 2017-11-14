'use strict'

const http = require('http')
const test = require('tap').test
const fastify = require('fastify')
const request = require('request')
const nock = require('nock')
const freeport = require('freeport')
const mockPlugins = require('./mocks/plugins')
const plugin = require('../')

test('redirects to remote server', (t) => {
  t.plan(2)

  const server = fastify()
  server
    .register(mockPlugins.cookiePlugin)
    .register(mockPlugins.cachingPlugin)
    .register(mockPlugins.sessionPlugin)
    .register(plugin, {
      appBaseUrl: 'http://app.example.com',
      casServer: {
        baseUrl: 'https://cas.example.com'
      }
    })

  server.get('/foo', (req, reply) => {
    reply.send()
  })

  server.listen(0, (err) => {
    server.server.unref()
    if (err) t.threw(err)

    const port = server.server.address().port
    http.get(`http://127.0.0.1:${port}/foo`, (res) => {
      t.ok(res.headers['location'])

      const url = 'https://cas.example.com/login?service=' +
        encodeURIComponent('http://app.example.com/casauth')
      t.is(res.headers['location'], url)
    })
  })
})

test('handles authorization', (t) => {
  t.plan(1)

  const server = fastify()
  server
    .register(mockPlugins.cookiePlugin)
    .register(mockPlugins.cachingPlugin)
    .register(mockPlugins.sessionPlugin)

  freeport((err, port) => {
    if (err) t.threw(err)
    const url = `http://127.0.0.1:${port}`
    server.register(plugin, {
      appBaseUrl: url,
      casServer: {
        baseUrl: 'http://cas.example.com',
        version: 1
      }
    })

    nock('http://cas.example.com')
      .get('/login')
      .query(true)
      .reply(302, '', {
        location: `${url}/casauth?ticket=ST-123456`
      })

    nock('http://cas.example.com')
      .get('/validate')
      .query(true)
      .reply(200, 'yes\n')

    server.listen(port, (err) => {
      server.server.unref()
      if (err) t.threw(err)

      server.get('/foo', (req, reply) => {
        reply.send({hello: 'world'})
      })

      request(`${url}/foo`, (err, res, body) => {
        if (err) t.threw(err)
        t.deepEqual(JSON.parse(body), {hello: 'world'})
      })
    })
  })
})
