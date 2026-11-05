import { afterEach, beforeEach, describe, expect, it, jest } from 'bun:test'
import { createWsClient } from '../src/browser/wsClient'

class MockWebSocket {
  static OPEN = 1
  static instances: MockWebSocket[] = []

  readyState = 0
  sent: string[] = []
  onopen: (() => void) | null = null
  onmessage: ((e: { data: string }) => void) | null = null
  onerror: (() => void) | null = null

  constructor(public url: string, public protocols?: string | string[]) {
    MockWebSocket.instances.push(this)
  }

  send(data: string) {
    this.sent.push(data)
  }

  onclose: ((event?: { code: number }) => void) | null = null

  close(code = 1000) {
    this.readyState = 3
    this.onclose?.({ code })
  }

  open() {
    this.readyState = MockWebSocket.OPEN
    this.onopen?.()
  }

  receive(msg: object) {
    this.onmessage?.({ data: JSON.stringify(msg) })
  }
}

function last() {
  return MockWebSocket.instances.at(-1)!
}

beforeEach(() => {
  jest.useFakeTimers()
  MockWebSocket.instances = []
  globalThis.WebSocket = MockWebSocket as unknown as typeof WebSocket
  globalThis.location = { protocol: 'https:', host: 'example.com' } as Location
})

afterEach(() => {
  jest.useRealTimers()
  // @ts-expect-error cleanup test globals
  delete globalThis.WebSocket
  // @ts-expect-error cleanup test globals
  delete globalThis.location
})

describe('createWsClient', () => {
  it('builds a wss url from https protocol and host', () => {
    createWsClient({ path: '/ws', onMessage: () => undefined })

    expect(last().url).toBe('wss://example.com/ws')
  })

  it('builds a ws url from http protocol', () => {
    globalThis.location = { protocol: 'http:', host: 'localhost:3000' } as Location
    createWsClient({ path: '/ws', onMessage: () => undefined })

    expect(last().url).toBe('ws://localhost:3000/ws')
  })

  it('becomes ready immediately when there is no auth', () => {
    let readyCalls = 0
    const client = createWsClient({ path: '/ws', onReady: () => readyCalls++, onMessage: () => undefined })

    expect(client.ready()).toBe(false)
    last().open()
    expect(client.ready()).toBe(true)
    expect(readyCalls).toBe(1)
  })

  it('sends the auth message and waits for authed before ready', () => {
    let readyCalls = 0
    const client = createWsClient({
      path: '/ws',
      authMessage: () => ({ type: 'auth', token: 'x' }),
      onReady: () => readyCalls++,
      onMessage: () => undefined,
    })

    last().open()
    expect(client.ready()).toBe(false)
    expect(last().sent).toEqual([JSON.stringify({ type: 'auth', token: 'x' })])
    expect(readyCalls).toBe(0)

    last().receive({ type: 'authed' })
    expect(client.ready()).toBe(true)
    expect(readyCalls).toBe(1)
  })

  it('treats a null auth message as guest and becomes ready', () => {
    const client = createWsClient({ path: '/ws', authMessage: () => null, onMessage: () => undefined })

    last().open()
    expect(client.ready()).toBe(true)
    expect(last().sent).toEqual([])
  })

  it('queues sends until ready, then flushes them in order', () => {
    const client = createWsClient({ path: '/ws', authMessage: () => ({ type: 'auth' }), onMessage: () => undefined })

    last().open()
    client.send({ type: 'a' })
    client.send({ type: 'b' })
    expect(last().sent).toEqual([JSON.stringify({ type: 'auth' })])

    last().receive({ type: 'authed' })
    expect(last().sent).toEqual([
      JSON.stringify({ type: 'auth' }),
      JSON.stringify({ type: 'a' }),
      JSON.stringify({ type: 'b' }),
    ])
  })

  it('sends directly once ready and open', () => {
    const client = createWsClient({ path: '/ws', onMessage: () => undefined })

    last().open()
    client.send({ type: 'hello' })
    expect(last().sent).toEqual([JSON.stringify({ type: 'hello' })])
  })

  it('forwards non-authed messages to onMessage', () => {
    const received: unknown[] = []

    createWsClient({ path: '/ws', onMessage: msg => received.push(msg) })

    last().open()
    last().receive({ type: 'ping', n: 1 })
    expect(received).toEqual([{ type: 'ping', n: 1 }])
  })

  it('calls onError on socket error', () => {
    let errors = 0

    createWsClient({ path: '/ws', onError: () => errors++, onMessage: () => undefined })

    last().onerror?.()
    expect(errors).toBe(1)
  })

  it('calls onClose and resets ready on close', () => {
    let closes = 0
    const client = createWsClient({ path: '/ws', onClose: () => closes++, onMessage: () => undefined })

    last().open()
    expect(client.ready()).toBe(true)
    last().close()
    expect(closes).toBe(1)
    expect(client.ready()).toBe(false)
  })

  it('drops a frame that is not a JSON object and keeps handling the next ones', () => {
    const received: unknown[] = []
    const invalid: unknown[] = []

    createWsClient({ path: '/ws', onMessage: msg => received.push(msg), onInvalidMessage: data => invalid.push(data) })
    last().open()

    last().onmessage?.({ data: 'not json' })
    last().onmessage?.({ data: 'null' })
    last().receive({ type: 'chat' })

    expect(invalid).toEqual(['not json', 'null'])
    expect(received).toEqual([{ type: 'chat' }])
  })

  it('does not reconnect by default', () => {
    createWsClient({ path: '/ws', onMessage: () => undefined })
    last().close()

    expect(MockWebSocket.instances).toHaveLength(1)
  })

  it('reconnects 500ms after a drop when enabled', () => {
    createWsClient({ path: '/ws', reconnect: 500, onMessage: () => undefined })
    last().close()

    expect(MockWebSocket.instances).toHaveLength(1)
    jest.advanceTimersByTime(600)
    expect(MockWebSocket.instances).toHaveLength(2)
  })

  it('does not reconnect after an explicit close', () => {
    const client = createWsClient({ path: '/ws', reconnect: 500, onMessage: () => undefined })

    last().open()
    client.close()

    jest.advanceTimersByTime(600)
    expect(MockWebSocket.instances).toHaveLength(1)
  })
})

describe('createWsClient options', () => {
  it('connects to a given url, read again at each reconnect, with protocols', () => {
    let n = 0

    createWsClient({ url: () => `wss://api.example.org/ws?n=${n++}`, protocols: ['v1'], reconnect: 10, onMessage: () => undefined })
    expect(last().url).toBe('wss://api.example.org/ws?n=0')
    expect(last().protocols).toEqual(['v1'])

    last().close()
    jest.advanceTimersByTime(10)
    expect(last().url).toBe('wss://api.example.org/ws?n=1')
  })

  it('backs off with a delay function and stops after the given attempts', () => {
    const delays: number[] = []

    createWsClient({ path: '/ws', reconnect: { delay: (attempt) => {
      delays.push(attempt)

      return 100 * 2 ** attempt
    }, attempts: 2 }, onMessage: () => undefined })

    last().close()
    jest.advanceTimersByTime(100)
    last().close()
    jest.advanceTimersByTime(200)
    last().close()
    jest.advanceTimersByTime(10_000)

    expect(delays).toEqual([0, 1])
    expect(MockWebSocket.instances).toHaveLength(3)
  })

  it('resets the attempt count once a reconnect opens', () => {
    createWsClient({ path: '/ws', reconnect: { delay: 10, attempts: 1 }, onMessage: () => undefined })

    last().close()
    jest.advanceTimersByTime(10)
    last().open()
    last().close()
    jest.advanceTimersByTime(10)

    expect(MockWebSocket.instances).toHaveLength(3)
  })

  it('uses the given codec and ready type, and hands close events over', () => {
    const received: unknown[] = []
    const closes: unknown[] = []
    const client = createWsClient<{ type: string }>({
      path: '/ws',
      authMessage: () => ({ token: 't' }),
      readyType: 'welcome',
      parse: data => ({ type: String(data).split(':')[0]! }),
      serialize: data => `json:${JSON.stringify(data)}`,
      onMessage: msg => received.push(msg),
      onClose: event => closes.push(event),
    })

    last().open()
    expect(last().sent).toEqual(['json:{"token":"t"}'])

    client.send({ a: 1 })
    last().onmessage?.({ data: 'welcome:' })
    expect(client.ready()).toBe(true)
    expect(last().sent.at(-1)).toBe('json:{"a":1}')

    last().onmessage?.({ data: 'chat:hi' })
    expect(received).toEqual([{ type: 'chat' }])

    last().close(4001)
    expect(closes).toEqual([{ code: 4001 }])
  })
})
