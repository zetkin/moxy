import moxy from '../src/index'
import fetch from 'node-fetch'
import { Log } from '../src/types'

describe('Retrieve request log', () => {
  describe('with HTTP', () => {
    test('gets an empty log when no requests made', async () => {
      const { start, stop } = moxy({ port: 1111 })
      start()
      const res = await fetch('http://localhost:1111/_log')
      const body = await res.json()
      expect(body).toEqual({ log: [] })
      stop()
    })

    test('returns log of requests made on a single path', async () => {
      const { start, stop } = moxy({ port: 1111 })
      start()
      await fetch('http://localhost:1111/random_url')
      const logRes = await fetch('http://localhost:1111/random_url/_log')
      const body = (await logRes.json()) as Log
      expect(body.path).toEqual('/random_url')
      expect(body.log.length).toEqual(1)
      expect(body.log[0].path).toEqual('/random_url') // Logs request made to correct path
      stop()
    })

    test('returns log of requests made on all paths', async () => {
      const { start, stop } = moxy({ port: 1111 })
      start()
      await fetch('http://localhost:1111/random_url')
      await fetch('http://localhost:1111/sensible_url')
      const logRes = await fetch('http://localhost:1111/_log')
      const body = (await logRes.json()) as Log
      expect(body.log.length).toEqual(2)
      expect(body.log.some((log) => log.path === '/random_url')).toBeTruthy()
      expect(body.log.some((log) => log.path === '/sensible_url')).toBeTruthy()
      stop()
    })
  })

  describe('with .log()', () => {
    test('gets an empty log when no requests made', async () => {
      const { start, stop, log } = moxy({ port: 1111 })
      start()
      expect(log()).toEqual({ log: [] })
      stop()
    })

    test('returns log of requests made on a single path', async () => {
      const { start, stop, log } = moxy({ port: 1111 })
      start()
      await fetch('http://localhost:1111/random_url')
      const logRes = log('/random_url')
      expect(logRes.path).toEqual('/random_url')
      expect(logRes.log.length).toEqual(1)
      expect(logRes.log[0].path).toEqual('/random_url') // Logs request made to correct path
      stop()
    })

    test('returns log of requests made on all paths', async () => {
      const { start, stop, log } = moxy({ port: 1111 })
      start()
      await fetch('http://localhost:1111/random_url')
      await fetch('http://localhost:1111/sensible_url')
      const logRes = log()
      expect(logRes.path).toBeUndefined()
      expect(logRes.log.length).toEqual(2)
      expect(logRes.log.some((log) => log.path === '/random_url')).toBeTruthy()
      expect(
        logRes.log.some((log) => log.path === '/sensible_url')
      ).toBeTruthy()
      stop()
    })
  })
})

describe('Clear entire request log', () => {
  test('with HTTP DELETE request', async () => {
    const { start, stop } = moxy({ port: 1111 })
    start()
    await fetch('http://localhost:1111/random_url')
    await fetch('http://localhost:1111/sensible_url')
    const deleteLogRes = await fetch('http://localhost:1111/_log', {
      method: 'DELETE',
    })
    expect(deleteLogRes.status).toEqual(204)
    const logRes = await fetch('http://localhost:1111/_log')
    const body = (await logRes.json()) as Log
    expect(body.log.length).toEqual(0)
    stop()
  })

  test('with .clearLog()', async () => {
    const { start, stop, clearLog, log } = moxy({ port: 1111 })
    start()
    await fetch('http://localhost:1111/random_url')
    await fetch('http://localhost:1111/sensible_url')
    clearLog()
    expect(log().log.length).toEqual(0)
    stop()
  })
})
