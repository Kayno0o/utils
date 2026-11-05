export interface WsReconnectOptions {
  /** Wait before each attempt, in ms, or a function of the attempt number (0 first). Defaults to 2000. */
  delay?: number | ((attempt: number) => number)
  /** Attempts in a row before giving up; a successful open resets the count. Defaults to no limit. */
  attempts?: number
}

export type WsFrame = Parameters<WebSocket['send']>[0]

export interface WsClientOptions<TMsg> {
  /** Path on the page's own host, `ws:` or `wss:` following the page. Needed unless `url` is set. */
  path?: string
  /** Full socket URL, or a function read at each (re)connect; wins over `path`. */
  url?: string | (() => string)
  protocols?: string | string[]
  /** Message sent on open. Return null to skip auth and become ready immediately (guest). */
  authMessage?: () => object | null
  /** The `type` of the server's reply that ends the auth handshake. Defaults to `authed`. */
  readyType?: string
  /** Fired once ready: after the server replies with `readyType`, or immediately when there is no auth. */
  onReady?: () => void
  onMessage: (msg: TMsg) => void
  onError?: (event: Event) => void
  /** Fired for a frame `parse` rejects; the frame is dropped and the client keeps running, silently when this is unset. */
  onInvalidMessage?: (data: unknown, error: unknown) => void
  onClose?: (event: CloseEvent) => void
  /** Reads an incoming frame, throwing on a bad one. Defaults to JSON, which must be an object. */
  parse?: (data: unknown) => TMsg
  /** Writes an outgoing message. Defaults to `JSON.stringify`. */
  serialize?: (data: object) => WsFrame
  /** Auto-reconnect after a drop: `true` waits 2s, a number that many ms, or a backoff. Off by default (a game socket needs a full rejoin, not a silent reconnect). */
  reconnect?: boolean | number | WsReconnectOptions
}

export interface WsClient {
  send: (data: object) => void
  ready: () => boolean
  close: () => void
}

const DEFAULT_RECONNECT_DELAY_MS = 2000

function parseJsonObject<TMsg>(data: unknown): TMsg {
  const msg: unknown = JSON.parse(data as string)

  if (typeof msg !== 'object' || msg === null)
    throw new TypeError('Message is not a JSON object')

  return msg as TMsg
}

function readReconnect(reconnect: WsClientOptions<unknown>['reconnect']): Required<WsReconnectOptions> | null {
  if (!reconnect)
    return null

  if (reconnect === true)
    return { delay: DEFAULT_RECONNECT_DELAY_MS, attempts: Infinity }

  if (typeof reconnect === 'number')
    return { delay: reconnect, attempts: Infinity }

  return { delay: reconnect.delay ?? DEFAULT_RECONNECT_DELAY_MS, attempts: reconnect.attempts ?? Infinity }
}

/** Shared WS transport: URL, socket lifecycle, encode/decode (JSON by default), auth handshake, send-queue. */
export function createWsClient<TMsg extends { type: string }>(opts: WsClientOptions<TMsg>): WsClient {
  const { parse = parseJsonObject<TMsg>, serialize = JSON.stringify, readyType = 'authed' } = opts
  const reconnect = readReconnect(opts.reconnect)
  let ws: WebSocket | null = null
  let isReady = false
  let closed = false
  let attempt = 0
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined
  const queue: WsFrame[] = []

  function socketUrl(): string {
    if (opts.url !== undefined)
      return typeof opts.url === 'function' ? opts.url() : opts.url

    if (opts.path === undefined)
      throw new TypeError('createWsClient needs a `path` or a `url`')

    return `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}${opts.path}`
  }

  function markReady() {
    isReady = true
    opts.onReady?.()
    for (const frame of queue.splice(0))
      ws!.send(frame)
  }

  function connect() {
    reconnectTimer = undefined

    if (closed)
      return

    isReady = false
    ws = new WebSocket(socketUrl(), opts.protocols)

    ws.onopen = () => {
      attempt = 0

      const auth = opts.authMessage?.() ?? null

      if (auth)
        ws!.send(serialize(auth))
      else
        markReady()
    }

    ws.onmessage = (e) => {
      let msg: TMsg

      try {
        msg = parse(e.data)
      }
      catch (error) {
        opts.onInvalidMessage?.(e.data, error)

        return
      }

      if (msg.type === readyType) {
        markReady()

        return
      }

      opts.onMessage(msg)
    }

    ws.onerror = event => opts.onError?.(event)

    ws.onclose = (event) => {
      isReady = false
      opts.onClose?.(event)

      if (!reconnect || closed || attempt >= reconnect.attempts)
        return

      reconnectTimer = setTimeout(connect, typeof reconnect.delay === 'function' ? reconnect.delay(attempt) : reconnect.delay)
      attempt++
    }
  }

  connect()

  return {
    send(data) {
      const frame = serialize(data)

      if (isReady && ws?.readyState === WebSocket.OPEN)
        ws.send(frame)
      else
        queue.push(frame)
    },
    ready: () => isReady,
    close() {
      closed = true
      clearTimeout(reconnectTimer)
      ws?.close()
    },
  }
}
