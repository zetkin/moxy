import bodyParser from 'body-parser'
import cors from 'cors'
import express from 'express'
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware'
import { Server } from 'node:http'
import {
  Moxy,
  Mock,
  LoggedRequest,
  HTTPMethod,
  MockResponseSetter,
  HTTP_METHODS,
} from './types'

const RES_MOCK_REGEX = /(\/.+)\/_mocks\/([a-z]+)$/
const RES_MOCKS_REGEX = /(\/.+)\/_mocks$/

export default function moxy(config?: {
  port?: number
  forward?: string
}): Moxy {
  const forward = config?.forward
  const port = config?.port ?? 8001

  const app = express()

  let server: Server
  let mocks: Mock[] = []
  let requestLog: LoggedRequest[] = []

  function findMock(path: string, method: string): Mock | null {
    const mock = mocks.find(
      (m) => m.path === path && m.method === method.toLowerCase()
    )
    return mock || null
  }

  app.use(bodyParser.json())
  app.use(cors())

  app.get('/_log', (req, res) => {
    res.json({ log: moxyApi.log() })
  })

  app.get(/(\/.+)\/_log$/, (req, res) => {
    const path = req.params[0]
    res.json({ log: moxyApi.log(path), path })
  })

  app.delete('/_log', (req, res) => {
    moxyApi.clearLog()
    res.status(204).end()
  })

  app.put(RES_MOCK_REGEX, (req, res) => {
    const method = req.params[1].toLowerCase() as HTTPMethod
    const path = req.params[0]
    // Validate method
    if (!HTTP_METHODS.includes(method)) {
      res.status(400).json({ error: 'Invalid method' })
    }

    const existingMock = findMock(path, method)

    moxyApi.setMock(
      path,
      method,
      req.body.response as MockResponseSetter | undefined
    )

    if (existingMock) {
      // If mock overwritten
      res.status(200).end()
    } else {
      // If new mock
      res.status(201).end()
    }
  })

  // Delete single path-method mock
  app.delete(RES_MOCK_REGEX, (req, res) => {
    moxyApi.removeMock(req.params[0], req.params[1] as HTTPMethod)
    res.status(204).end()
  })

  // Delete all mocks from a path
  app.delete(RES_MOCKS_REGEX, (req, res) => {
    moxyApi.removeMock(req.params[0])
    res.status(204).end()
  })

  // Delete all mocks
  app.delete('/_mocks', (req, res) => {
    moxyApi.removeMock()
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
        logLevel: 'error',
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

  const moxyApi: Moxy = {
    start: () => {
      server = app.listen(port)
      return server
    },
    stop: async () => {
      return new Promise((resolve) => {
        server.close(() => resolve())
      })
    },
    mocks: (path?: string) => {
      return path ? mocks.filter((mock) => mock.path === path) : mocks
    },
    log: <ReqData, ResData>(path?: string, method?: HTTPMethod) => {
      let log = requestLog
      if (path) {
        log = log.filter((entry) => entry.path === path)
      }
      if (method) {
        log = log.filter((entry) => entry.method.toLowerCase() === method)
      }
      return log as LoggedRequest<ReqData, ResData>[]
    },
    clearLog: () => {
      requestLog = []
    },
    setMock: <ResData>(
      path: string,
      method: HTTPMethod = 'get',
      response: MockResponseSetter<ResData> = {}
    ) => {
      const existingMock = findMock(path, method)

      if (existingMock) {
        // Remove existing mock
        mocks = mocks.filter((m) => m !== existingMock)
      }

      // Add new mock
      mocks.push({
        method,
        path,
        response: {
          status: response.status ?? 200,
          headers: response.headers ?? [],
          data: response.data ?? null,
        },
      })

      return () => moxyApi.removeMock(path, method)
    },
    removeMock: (path?: string, method?: HTTPMethod) => {
      if (path && method) {
        const existingMock = findMock(path, method)
        mocks = mocks.filter((mock) => mock !== existingMock)
      } else if (path) {
        mocks = mocks.filter((mock) => mock.path !== path)
      } else {
        mocks = []
      }
    },
  }

  return moxyApi
}

export * from './types'
