import fetch from 'node-fetch'
import moxy from '../src/index'
import { apiUrl, port, setMockReq } from './utils'

describe('Set mock', () => {
  describe('with HTTP', () => {
    test('with default mock response (200 status, no body, no custom headers)', async () => {
      const { start, stop } = moxy({ port: port() })
      start()
      const setMockRes = await setMockReq(`/login`)
      expect(setMockRes.status).toEqual(201)

      const res = await fetch(apiUrl(`/login`))
      expect(res.status).toEqual(200)

      await stop()
    })

    test('with custom mock response', async () => {
      const { start, stop } = moxy({ port: port() })
      start()
      const setMockRes = await setMockReq('/login', 'post', {
        status: 401,
        data: { error: 'Unauthorised' },
        headers: [['Connection', 'close']],
      })
      expect(setMockRes.status).toEqual(201)

      const res = await fetch(apiUrl(`/login`), { method: 'POST' })
      expect(res.status).toEqual(401)
      const body = await res.json()
      expect(body).toEqual({ error: 'Unauthorised' })
      expect(res.headers.keys()).toContain('connection')
      expect(res.headers.values()).toContain('close')

      await stop()
    })

    test('can override a mock', async () => {
      const { start, stop } = moxy({ port: port() })
      start()

      const setMockRes = await setMockReq('/login', 'get', {
        status: 501,
      })
      expect(setMockRes.status).toEqual(201) // Created

      const res = await fetch(apiUrl(`/login`))
      expect(res.status).toEqual(501)

      const resetMockRes = await setMockReq('/login', 'get', { status: 204 })
      expect(resetMockRes.status).toEqual(200) // Reset

      const resAfterReset = await fetch(apiUrl(`/login`))
      expect(resAfterReset.status).toEqual(204)

      await stop()
    })

    describe('returns error status', () => {
      test('when invalid method passed', async () => {
        const { start, stop } = moxy({ port: port() })
        start()
        const setMockRes = await fetch(apiUrl('/login/_mocks/poet'), {
          method: 'PUT',
        })
        expect(setMockRes.status).toEqual(400)
        const body = await setMockRes.json()
        expect(body).toEqual({ error: 'Invalid method' })
        await stop()
      })
    })
  })

  describe('with .setMock()', () => {
    test('with default mock response (200 status, no body, no custom headers)', async () => {
      const { start, stop, setMock } = moxy({ port: port() })
      start()
      setMock(`/login`)
      const res = await fetch(apiUrl(`/login`))
      expect(res.status).toEqual(200)
      await stop()
    })

    test('with custom mock response', async () => {
      const { start, stop, setMock } = moxy({ port: port() })
      start()
      setMock('/login', 'post', {
        status: 401,
        data: { error: 'Unauthorised' },
        headers: [['Connection', 'close']],
      })
      const res = await fetch(apiUrl(`/login`), { method: 'POST' })
      expect(res.status).toEqual(401)
      const body = await res.json()
      expect(body).toEqual({ error: 'Unauthorised' })
      expect(res.headers.keys()).toContain('connection')
      expect(res.headers.values()).toContain('close')
      await stop()
    })

    test('can override a mock', async () => {
      const { start, stop, setMock } = moxy({ port: port() })
      start()

      setMock('/login', 'get', {
        status: 501,
      })

      const res = await fetch(apiUrl(`/login`))
      expect(res.status).toEqual(501)

      setMock('/login', 'get', { status: 204 })

      const resAfterReset = await fetch(apiUrl(`/login`))
      expect(resAfterReset.status).toEqual(204)

      await stop()
    })

    test('setting a mock returns a function to remove the mock', async () => {
      const { start, stop, setMock } = moxy({ port: port() })
      start()
      const { removeMock } = setMock(`/login`)
      const res = await fetch(apiUrl(`/login`))
      expect(res.status).toEqual(200)
      removeMock()
      const resAfterDelete = await fetch(apiUrl(`/login`))
      expect(resAfterDelete.status).toEqual(404)
      await stop()
    })

    test('setting a mock returns a function to log all requests to mocked endpoint', async () => {
      const { start, stop, setMock } = moxy({ port: port() })
      start()

      const { log } = setMock(`/login`, 'post', {
        data: { session: 'some-token' },
      })

      // 2 post requests to /login
      await fetch(apiUrl(`/login`), {
        method: 'post',
        headers: [['content-type', 'application/json']],
        body: JSON.stringify({ usernamd: 'Jerry', password: 'Superman' }),
      })
      await fetch(apiUrl(`/login`), {
        method: 'post',
        headers: [['content-type', 'application/json']],
        body: JSON.stringify({ username: 'George', password: 'BOSCO' }),
      })

      // Get request to same endpoint
      await fetch(apiUrl('/logout'))
      // Request to different endpoint
      await fetch(apiUrl('/random_url'))

      // Only logs post requests to /login
      expect(log().length).toEqual(2)
      expect(log().every((log) => log.method === 'POST')).toEqual(true)
      expect(log().every((log) => log.path === '/login')).toEqual(true)
      // Test types and req/res data
      expect(
        log().every((req) => req.response.data?.session === 'some-token')
      ).toEqual(true)
      expect(
        log<{ username: string; password: string }>().some(
          (req) => req.data?.username === 'George'
        )
      ).toEqual(true)

      await stop()
    })
  })
})
