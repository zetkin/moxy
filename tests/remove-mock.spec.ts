import moxy from '../src/index'
import { port, removeMockReq } from './utils'

describe('Remove mock', () => {
  describe('with HTTP', () => {
    test('remove all mocks', async () => {
      const { start, stop, mocks, setMock } = moxy({ port: port() })
      start()

      setMock(`/campaign/1`)
      setMock(`/campaign/2`)
      setMock(`/campaign/3`)

      expect(mocks().length).toEqual(3)

      const res = await removeMockReq()

      expect(res.status).toEqual(204)
      expect(mocks().length).toEqual(0)

      await stop()
    })

    test('remove all mocks for path', async () => {
      const { start, stop, mocks, setMock } = moxy({ port: port() })
      start()

      setMock(`/campaign/1`, 'patch')
      setMock(`/campaign/1`, 'delete')
      setMock(`/campaign/2`)

      expect(mocks().length).toEqual(3)

      const res = await removeMockReq('/campaign/1')

      expect(res.status).toEqual(204)
      expect(mocks().length).toEqual(1)
      expect(mocks('/campaign/2').length).toEqual(1)

      await stop()
    })

    test('remove mock on path for method', async () => {
      const { start, stop, mocks, setMock } = moxy({ port: port() })
      start()

      setMock(`/campaign/1`, 'patch')
      setMock(`/campaign/1`, 'delete')

      expect(mocks().length).toEqual(2)

      // Delete patch mock
      const res = await removeMockReq('/campaign/1', 'patch')

      expect(res.status).toEqual(204)
      expect(mocks().length).toEqual(1)
      expect(mocks('/campaign/1')[0].method).toEqual('delete')

      await stop()
    })
  })

  describe('with .removeMock()', () => {
    test('remove all mocks', async () => {
      const { start, stop, mocks, setMock, removeMock } = moxy({ port: port() })
      start()

      setMock(`/campaign/1`)
      setMock(`/campaign/2`)
      setMock(`/campaign/3`)
      expect(mocks().length).toEqual(3)

      removeMock()
      expect(mocks().length).toEqual(0)

      await stop()
    })

    test('remove all mocks for path', async () => {
      const { start, stop, mocks, setMock, removeMock } = moxy({ port: port() })
      start()

      setMock(`/campaign/1`, 'patch')
      setMock(`/campaign/1`, 'delete')
      setMock(`/campaign/2`)

      expect(mocks().length).toEqual(3)

      removeMock('/campaign/1')

      expect(mocks().length).toEqual(1)
      expect(mocks('/campaign/2').length).toEqual(1)

      await stop()
    })

    test('remove mock on path for method', async () => {
      const { start, stop, mocks, setMock, removeMock } = moxy({ port: port() })
      start()

      setMock(`/campaign/1`, 'patch')
      setMock(`/campaign/1`, 'delete')

      expect(mocks().length).toEqual(2)

      // Delete patch
      removeMock('/campaign/1', 'patch')

      expect(mocks().length).toEqual(1)
      expect(mocks('/campaign/1')[0].method).toEqual('delete')

      await stop()
    })
  })
})
