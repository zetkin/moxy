import fetch from 'node-fetch'
import moxy from '../src/index'
import { apiUrl, port, setMockReq } from '../src/testing/utils'

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
      expect(resetMockRes.status).toEqual(204) // Reset

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

      let hadPreviousMock = setMock('/login', 'get', {
        status: 501,
      })
      expect(hadPreviousMock).toEqual(false)

      const res = await fetch(apiUrl(`/login`))
      expect(res.status).toEqual(501)

      hadPreviousMock = setMock('/login', 'get', { status: 204 })
      expect(hadPreviousMock).toEqual(true)

      const resAfterReset = await fetch(apiUrl(`/login`))
      expect(resAfterReset.status).toEqual(204)

      await stop()
    })
  })
})
