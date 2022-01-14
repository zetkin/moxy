import bodyParser from 'body-parser'
import cors from 'cors'
import express from 'express'
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware'
import { Server } from 'node:http'
import { Mock, LoggedRequest, Moxy, HTTPMethod, MockResponse } from './types'

declare global {
  namespace Express {
    interface Request {
      logEntry?: LoggedRequest
    }
  }
}

const RES_MOCK_REGEX = /(\/.+)\/_mocks\/([a-z]+)$/
const RES_MOCKS_REGEX = /(\/.+)\/_mocks$/

export default function moxy(config?: {
  port?: number
  forward?: string
}): Moxy {
  const forward = config?.forward
  const port = config?.port ?? 8001

  const app = express()

  app.use(bodyParser.json())
  app.use(cors())

  let mocks: Mock[] = []
  let requestLog: LoggedRequest[] = []

  function findMock(path: string, method: string): Mock | null {
    const mock = mocks.find(
      (m) => m.path === path && m.method === method.toLowerCase()
    )
    return mock || null
  }

  app.get('/_log', (req, res) => {
    res.json({ log: requestLog })
  })

  app.get(/(\/.+)\/_log$/, (req, res) => {
    const path = req.params[0]
    res.json({
      path,
      log: requestLog.filter((entry) => entry.path === path),
    })
  })

  app.delete('/_log', (req, res) => {
    requestLog = []
    res.status(204).end()
  })

  app.put(RES_MOCK_REGEX, (req, res) => {
    const mock: Mock = {
      method: req.params[1].toLowerCase(),
      path: req.params[0],
      response: {
        status: req.body.response?.status ?? 200,
        headers: req.body.response?.headers ?? [],
        data: req.body.response?.data ?? null,
      },
    }

    const existing = findMock(mock.path, mock.method)
    if (existing) {
      res.status(409).end()
    } else {
      mocks.push(mock)
      res.status(201).end()
    }
  })

  // Delete single path-method mock
  app.delete(RES_MOCK_REGEX, (req, res) => {
    const existing = findMock(req.params[0], req.params[1])
    if (existing) {
      mocks = mocks.filter((m) => m !== existing)
      res.status(204).end()
    } else {
      res.status(404).end()
    }
  })

  // Delete all mocks from a path
  app.delete(RES_MOCKS_REGEX, (req, res) => {
    mocks = mocks.filter((m) => m.path !== req.path)
    res.status(204).end()
  })

  // Delete all mocks
  app.delete('/_mocks', (req, res) => {
    mocks = []
    res.status(204).end()
  })

  // Create logEntry and attach to request
  app.use((req, res, next) => {
    req.logEntry = {
      timestamp: new Date(),
      method: req.method,
      path: req.path,
      mocked: false,
      headers: {},
      response: {
        status: 0,
        headers: {},
      },
    }

    requestLog.push(req.logEntry)

    if (Object.keys(req.body).length) {
      req.logEntry.data = req.body
    }

    next()
  })

  app.use((req, res, next) => {
    const mock = findMock(req.path, req.method)
    if (mock) {
      if (req.logEntry) {
        req.logEntry.mocked = true
        req.logEntry.response.status = mock.response.status
        req.logEntry.response.data = mock.response.data
      }
      res.status(mock.response.status)
      res.json(mock.response.data)
    } else {
      next()
    }
  })

  if (forward) {
    app.use(
      createProxyMiddleware({
        target: forward,
        changeOrigin: true,
        onProxyReq: fixRequestBody,
        onProxyRes: (proxyRes, req, res) => {
          const logEntry = req.logEntry
          if (logEntry) {
            logEntry.response.status = proxyRes.statusCode!
            logEntry.response.headers = proxyRes.headers

            if (
              proxyRes.headers['content-type']?.startsWith('application/json')
            ) {
              let data = ''
              proxyRes.on('data', (chunk) => {
                data += chunk
              })

              proxyRes.on('end', () => {
                try {
                  logEntry.response.data = JSON.parse(data)
                } catch (err) {
                  // Do nothing
                }
              })
            }
          }
        },
      })
    )
  }

  let server: Server

  return {
    start: () => {
      server = app.listen(port)
      return server
    },
    stop: () => {
      server.close()
    },
    clearLog: () => {
      requestLog = []
    },
    requestLog: (path?: string) => {
      if (path) {
        return {
          path,
          log: requestLog.filter((entry) => entry.path === path),
        }
      }
      return { log: requestLog }
    },
  }
}
