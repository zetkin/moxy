import fetch from 'node-fetch'
import moxy from '../src/index'
import { apiUrl, port, setMockReq } from '../src/testing/utils'

describe('Set mock', () => {
  /**
   * Test in general
   *
   * - Set mock on each method
   * - That a mocked request has `true` in the log
   */

  describe('with HTTP', () => {
    test('with default mock response (200 status, no body, no custom headers)', async () => {
      const { start, stop } = moxy({ port: port() })
      start()
      // Default mock for get request
      const setMockRes = await setMockReq(`/login`)
      expect(setMockRes.status).toEqual(201)

      // Check that mock set
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
      // Test sets correct status
      expect(res.status).toEqual(401)
      // Test returns body
      const body = await res.json()
      expect(body).toEqual({ error: 'Unauthorised' })
      // Test sets headers
      expect(res.headers.keys()).toContain('connection')
      expect(res.headers.values()).toContain('close')

      await stop()
    })

    describe('returns error status', () => {
      test('when invalid method passed', async () => {
        const { start, stop, log } = moxy({ port: port() })
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
    test('throws an error if the user attempts to set a mock on the home route', async () => {})
  })
})
