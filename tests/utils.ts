import fetch from 'node-fetch'
import { HTTPMethod, MockResponse } from '../src/types'

export const port = (basePort: number = 3000): number => {
  const workerId = parseInt(process.env.JEST_WORKER_ID) || 0
  return workerId + basePort
}

export const apiUrl = (path: string = '') => {
  return `http://localhost:${port()}${path}`
}

/**
 * Wrapper for making the request to create a mock using HTTP. Returns a Response.
 *
 * This is similar to a function a user might write.
 */
export const setMockReq = async (
  path: string,
  method: HTTPMethod = 'get',
  response?: MockResponse
): Promise<Response> => {
  const res = await fetch(apiUrl(path + `/_mocks/${method}`), {
    headers: [['Content-Type', 'application/json']],
    method: 'PUT',
    body: JSON.stringify({
      response,
    }),
  })
  return res as unknown as Response
}

/**
 * Wrapper for making the request to remove a mock using HTTP.
 *
 * This is similar to a function a user might write.
 */
export const removeMockReq = async (
  path?: string,
  method?: HTTPMethod
): Promise<Response> => {
  const url = apiUrl(
    (path ? path : '') + '/_mocks' + (method ? `/${method}` : '')
  )
  const res = await fetch(url, {
    method: 'DELETE',
  })
  return res as unknown as Response
}
