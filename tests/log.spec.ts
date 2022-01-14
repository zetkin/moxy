import moxy from '../src/index'
import fetch from 'node-fetch'
import { Log } from '../src/types'
import { apiUrl, port } from '../src/testing/utils'

describe('Retrieve request log', () => {
  // TODO: Test that requests to moxy _mocks _logs aren't stored in request log

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
      expect(log()).toEqual({ log: [] })
      await stop()
    })

    test('returns log of requests made on a single path', async () => {
      const { start, stop, log } = moxy({ port: port() })
      start()
      await fetch(apiUrl('/random_url'))
      const logRes = log('/random_url')
      expect(logRes.path).toEqual('/random_url')
      expect(logRes.log.length).toEqual(1)
      expect(logRes.log[0].path).toEqual('/random_url') // Logs request made to correct path
      await stop()
    })

    test('returns log of requests made on all paths', async () => {
      const { start, stop, log } = moxy({ port: port() })
      start()
      await fetch(apiUrl('/random_url'))
      await fetch(apiUrl('/sensible_url'))
      const logRes = log()
      expect(logRes.path).toBeUndefined()
      expect(logRes.log.length).toEqual(2)
      expect(logRes.log.some((log) => log.path === '/random_url')).toBeTruthy()
      expect(
        logRes.log.some((log) => log.path === '/sensible_url')
      ).toBeTruthy()
      await stop()
    })
  })
})

describe('Clear entire request log', () => {
  test('with HTTP DELETE request', async () => {
    const { start, stop } = moxy({ port: port() })
    start()
    await fetch(apiUrl('/random_url'))
    await fetch(apiUrl('/sensible_url'))
    const deleteLogRes = await fetch(apiUrl('/_log'), {
      method: 'DELETE',
    })
    expect(deleteLogRes.status).toEqual(204)
    const logRes = await fetch(apiUrl('/_log'))
    const body = (await logRes.json()) as Log
    expect(body.log.length).toEqual(0)
    await stop()
  })

  test('with .clearLog()', async () => {
    const { start, stop, clearLog, log } = moxy({ port: port() })
    start()
    await fetch(apiUrl('/random_url'))
    await fetch(apiUrl('/sensible_url'))
    clearLog()
    expect(log().log.length).toEqual(0)
    await stop()
  })
})
