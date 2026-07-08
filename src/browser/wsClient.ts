export interface WsClientOptions<TMsg> {
  path: string
  /** Message sent on open. Return null to skip auth and become ready immediately (guest). */
  authMessage?: () => object | null
  /** Fired once ready: after the server replies `{type:'authed'}`, or immediately when there is no auth. */
  onReady?: () => void
  onMessage: (msg: TMsg) => void
  onError?: () => void
  onClose?: () => void
  /** Auto-reconnect 2s after a drop. Off by default (a game socket needs a full rejoin, not a silent reconnect). */
  reconnect?: boolean | number
}

export interface WsClient {
  send: (data: object) => void
  ready: () => boolean
  close: () => void
}

/** Shared WS transport: URL, socket lifecycle, JSON encode/decode, auth handshake, send-queue. */
export function createWsClient<TMsg extends { type: string }>(opts: WsClientOptions<TMsg>): WsClient {
  let ws: WebSocket | null = null
  let isReady = false
  let closed = false
  const queue: string[] = []

  function markReady() {
    isReady = true
    opts.onReady?.()
    for (const s of queue.splice(0))
      ws!.send(s)
  }

  function connect() {
    isReady = false
    ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}${opts.path}`)

    ws.onopen = () => {
      const auth = opts.authMessage?.() ?? null

      if (auth)
        ws!.send(JSON.stringify(auth))
      else
        markReady()
    }

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data as string) as TMsg

      if (msg.type === 'authed') {
        markReady()

        return
      }

      opts.onMessage(msg)
    }

    ws.onerror = () => opts.onError?.()

    ws.onclose = () => {
      isReady = false
      opts.onClose?.()

      if (opts.reconnect && !closed)
        setTimeout(connect, typeof opts.reconnect === 'number' ? opts.reconnect : 2000)
    }
  }

  connect()

  return {
    send(data) {
      const s = JSON.stringify(data)

      if (isReady && ws?.readyState === WebSocket.OPEN)
        ws.send(s)
      else
        queue.push(s)
    },
    ready: () => isReady,
    close() {
      closed = true
      ws?.close()
    },
  }
}
