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
      .reply(303, '', {
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

test('handles broken sessions due to missing cookie on ticket validate', (t) => {
  t.plan(3)

  freeport((err, port) => {
    if (err) t.threw(err)
    const url = `http://127.0.0.1:${port}`
    const server = fastify()
    // We need the real plugins in this test because we must be sure the
    // session is handled correctly.
    server
      .register(require('fastify-cookie'), {
        domain: '127.0.0.1',
        path: '/'
      })
      .register(require('fastify-caching'))
      .register(require('fastify-server-session'), {
        secretKey: '12345678901234567890123456789012',
        cookie: {
          domain: '127.0.0.1',
          path: '/'
        }
      })
      .register(plugin, {
        appBaseUrl: url,
        casServer: {
          baseUrl: 'http://cas.example.com',
          version: 1
        }
      })

    nock('http://cas.example.com')
      .get('/login')
      .query(true)
      .reply(303, '', {
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

      // Weeeeeee! The CAS protocol is fun!
      // We're using `http.get` here so because it is a _little_ less verbose.
      http
        .get(`${url}/foo`, (res) => {
          t.is(res.headers.location, 'http://cas.example.com/login?service=' + encodeURIComponent(`${url}/casauth`))
          http
            .get(res.headers.location, (res) => {
              t.is(res.headers.location, `${url}/casauth?ticket=ST-123456`)
              http
                .get(res.headers.location, (res) => {
                  t.is(res.headers.location, '/oops')
                })
                .on('error', t.threw)
            })
            .on('error', t.threw)
        })
        .on('error', t.threw)
    })
  })
})
