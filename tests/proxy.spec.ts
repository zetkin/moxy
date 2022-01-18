import moxy from '../src/index'
import fetch from 'node-fetch'
import { apiUrl, port } from '../src/testing/utils'

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
    expect(targetLog().log.length).toEqual(1)

    await stopTarget()
    await stopMoxy()
  })

  test('check that mocked endpoints DO NOT forward', async () => {
    // TODO: Rework to Javascript API
    const {
      start: startTarget,
      stop: stopTarget,
      log: targetLog,
    } = moxy({ port: port(5000) })

    const {
      start: startMoxy,
      stop: stopMoxy,
      log: moxyLog,
    } = moxy({
      port: port(),
      forward: `http://localhost:${port(5000)}`,
    })

    startTarget()
    startMoxy()

    // Set a mock (get request)
    await fetch(apiUrl('/some_url/_mocks/get'), {
      method: 'PUT',
      body: JSON.stringify({ status: 411 }),
      headers: [['Content-Type', 'application/json']],
    })

    // Make request to moxy
    await fetch(apiUrl('/some_url'))

    expect(moxyLog().log.length).toEqual(1)
    expect(targetLog().log.length).toEqual(0)

    await stopTarget()
    await stopMoxy()
  })
})
