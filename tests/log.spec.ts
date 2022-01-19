import moxy from '../src/index'
import fetch from 'node-fetch'
import { Log } from '../src/types'
import { apiUrl, port } from './utils'

describe('Retrieve request log', () => {
  describe('with HTTP', () => {
    test('gets an empty log when no requests made', async () => {
      const { start, stop } = moxy({ port: port() })
      start()
      const res = await fetch(apiUrl('/_log'))
      const body = await res.json()
      expect(body).toEqual({ log: [] })
      await stop()
    })

    test('returns log of requests made on a single path', async () => {
      const { start, stop } = moxy({ port: port() })
      start()
      await fetch(apiUrl('/random_url'))
      const logRes = await fetch(apiUrl('/random_url/_log'))
      const body = (await logRes.json()) as Log
      expect(body.path).toEqual('/random_url')
      expect(body.log.length).toEqual(1)
      expect(body.log[0].path).toEqual('/random_url') // Logs request made to correct path
      await stop()
    })

    test('returns log of requests made on all paths', async () => {
      const { start, stop } = moxy({ port: port() })
      start()
      await fetch(apiUrl('/random_url'))
      await fetch(apiUrl('/sensible_url'))
      const logRes = await fetch(apiUrl('/_log'))
      const body = (await logRes.json()) as Log
      expect(body.log.length).toEqual(2)
      expect(body.log.some((log) => log.path === '/random_url')).toBeTruthy()
      expect(body.log.some((log) => log.path === '/sensible_url')).toBeTruthy()
      await stop()
    })
  })

  describe('with .log()', () => {
    test('gets an empty log when no requests made', async () => {
      const { start, stop, log } = moxy({ port: port() })
      start()
      expect(log()).toEqual([])
      await stop()
    })

    test('returns log of requests made on a single path', async () => {
      const { start, stop, log } = moxy({ port: port() })
      start()
      await fetch(apiUrl('/random_url'))
      await fetch(apiUrl('/other_url'))
      const randomUrlLog = log('/random_url')
      expect(randomUrlLog.length).toEqual(1)
      expect(randomUrlLog[0].path).toEqual('/random_url')
      await stop()
    })

    test('returns log of requests made by method', async () => {
      const { start, stop, log } = moxy({ port: port() })
      start()
      await fetch(apiUrl('/random_url'), {
        method: 'post',
      })
      await fetch(apiUrl('/other_url'))
      const postReqLog = log(undefined, 'post')
      expect(postReqLog.length).toEqual(1)
      expect(postReqLog[0].path).toEqual('/random_url') // Logs request made to correct path
      await stop()
    })

    test('returns log of requests made by path and method', async () => {
      const { start, stop, log } = moxy({ port: port() })
      start()
      await fetch(apiUrl('/random_url'), {
        method: 'post',
      })
      await fetch(apiUrl('/other_url'), {
        method: 'post',
      })
      await fetch(apiUrl('/other_url'))
      await fetch(apiUrl('/random_url'))
      const postReqLog = log('/random_url', 'post')
      expect(postReqLog.length).toEqual(1)
      expect(postReqLog[0].path).toEqual('/random_url')
      expect(postReqLog[0].method).toEqual('POST')
      await stop()
    })

    test('returns log of requests made on all paths', async () => {
      const { start, stop, log } = moxy({ port: port() })
      start()
      await fetch(apiUrl('/random_url'))
      await fetch(apiUrl('/sensible_url'))
      expect(log().length).toEqual(2)
      expect(log().some((log) => log.path === '/random_url')).toBeTruthy()
      expect(log().some((log) => log.path === '/sensible_url')).toBeTruthy()
      await stop()
    })
  })
})

describe('Clear entire request log', () => {
  test('with HTTP DELETE request', async () => {
    const { start, stop, log } = moxy({ port: port() })
    start()
    await fetch(apiUrl('/random_url'))
    await fetch(apiUrl('/sensible_url'))
    const deleteLogRes = await fetch(apiUrl('/_log'), {
      method: 'DELETE',
    })
    expect(deleteLogRes.status).toEqual(204)
    expect(log().length).toEqual(0)
    await stop()
  })

  test('with .clearLog()', async () => {
    const { start, stop, clearLog, log } = moxy({ port: port() })
    start()
    await fetch(apiUrl('/random_url'))
    await fetch(apiUrl('/sensible_url'))
    clearLog()
    expect(log().length).toEqual(0)
    await stop()
  })
})

test('Requests to moxy server are not stored in request log', async () => {
  const { start, stop, log, setMock } = moxy({ port: port() })
  start()
  // Set mock on path
  await setMock('/random_url', 'get')
  // Make request to path
  await fetch(apiUrl('/random_url'))
  // Only the request to /random_url is logged, not the request to _mocks
  expect(log().length).toEqual(1)
  expect(log()[0].path).toEqual('/random_url')
  await stop()
})

test('Requests made to mocked endpoints are stored correctly', async () => {
  const { start, stop, log, setMock } = moxy({ port: port() })
  start()
  setMock('/random_url', 'post', {
    status: 201,
    data: {
      key: 'value',
    },
  })
  await fetch(apiUrl('/random_url'), {
    method: 'POST',
  })
  expect(log()[0].mocked).toEqual(true)
  expect(log()[0].response.data).toEqual({ key: 'value' })
  expect(log()[0].response.status).toEqual(201)
  await stop()
})
