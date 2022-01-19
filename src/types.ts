import { Server } from 'node:http'

declare global {
  namespace Express {
    interface Request {
      logEntry?: LoggedRequest
    }
  }
}

export const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const
export type HTTPMethod = typeof HTTP_METHODS[number]

export type HTTPHeaders =
  | Record<string, string | string[] | undefined>
  | string[][]

export interface Moxy {
  start: () => Server
  stop: () => Promise<void>
  mocks: (path?: string) => Mock[]
  log: (path?: string, method?: HTTPMethod) => Log['log']
  clearLog: () => void
  setMock: <G>(
    path: string,
    method?: HTTPMethod,
    response?: MockResponseSetter<G>
  ) => () => void
  removeMock: (path?: string, method?: HTTPMethod) => void
}

// Mocks as they are stored in the list of mocks
export interface Mock<ResData = unknown> {
  method: string
  path: string
  response: MockResponse<ResData>
}

// The mock response as it's stored in a created mock
export interface MockResponse<ResData = unknown> {
  data: ResData | null
  headers: HTTPHeaders
  status: number
}

// For setting the mock response
export interface MockResponseSetter<ResData = unknown> {
  data?: ResData
  headers?: HTTPHeaders
  status?: number
}

export interface Log<ReqData = unknown, ResData = unknown> {
  log: LoggedRequest<ReqData, ResData>[]
  path?: string
}

export interface LoggedRequest<ReqData = unknown, ResData = unknown> {
  timestamp: Date
  method: string
  path: string
  headers?: HTTPHeaders
  data?: ReqData
  mocked: boolean
  response: {
    data?: ResData
    headers?: HTTPHeaders
    status: number
  }
}
