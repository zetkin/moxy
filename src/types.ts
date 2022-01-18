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
  log: (path?: string) => Log
  clearLog: () => void
  setMock: <G>(
    path: string,
    method: HTTPMethod,
    response: MockResponse<G>
  ) => void
}

// Mocks as they are stored in the list of mocks
export interface Mock {
  method: string
  path: string
  response: MockResponse
}

// Used to set what will be returned from the mocked endpoint
export interface MockResponse<ResData = unknown> {
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
