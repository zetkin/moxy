import moxy from '../src/index'
import fetch from 'node-fetch'
import { apiUrl, port } from './utils'

describe('Moxy proxy functionality', () => {
  test('check that unmocked endpoints DO forward', async () => {
    const {
      start: startTarget,
      stop: stopTarget,
      log: targetLog,
    } = moxy({ port: port(5000) })

    const { start: startMoxy, stop: stopMoxy } = moxy({
      port: port(),
      forward: `http://localhost:${port(5000)}`,
    })

    startTarget()
    startMoxy()

    // Make request to moxy
    await fetch(apiUrl())

    // Expect request to have been made at target
    expect(targetLog().length).toEqual(1)

    await stopTarget()
    await stopMoxy()
  })

  test('check that mocked endpoints DO NOT forward', async () => {
    const {
      start: startTarget,
      stop: stopTarget,
      log: targetLog,
    } = moxy({ port: port(5000) })

    const {
      start: startMoxy,
      stop: stopMoxy,
      log: moxyLog,
      setMock,
    } = moxy({
      port: port(),
      forward: `http://localhost:${port(5000)}`,
    })

    startTarget()
    startMoxy()

    // Set mock and make request to moxy
    await setMock('/some_url', 'get')
    await fetch(apiUrl('/some_url'))

    // Expect request logged in moxy, not forwarded
    expect(moxyLog().length).toEqual(1)
    expect(targetLog().length).toEqual(0)

    await stopTarget()
    await stopMoxy()
  })
})
