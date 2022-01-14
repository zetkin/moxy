import { Server } from 'node:http'

export type HTTPMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'
export type HTTPHeaders = Record<string, string | string[] | undefined>

export interface Moxy {
  start: () => Server
  stop: () => void
  clearLog: () => void
  log: (path?: string) => Log
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
