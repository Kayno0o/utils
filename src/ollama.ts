export interface OllamaOutputUsage {
  input_tokens: number
  output_tokens: number
}

export interface OllamaOutputMessage {
  role: 'assistant'
  content: string
  thinking?: string // populated when think: true
}

export interface OllamaOutputChatResponse {
  model: string
  created_at: string // ISO 8601 timestamp
  message: OllamaOutputMessage
  done: true
  done_reason: 'stop' | 'length' | 'load'

  // Timing stats (nanoseconds)
  total_duration: number
  load_duration: number
  prompt_eval_duration: number
  eval_duration: number

  // Token counts
  prompt_eval_count: number
  eval_count: number
}

// When stream: true, intermediate chunks look like this (done: false)
export interface OllamaOutputChatStreamChunk {
  model: string
  created_at: string
  message: OllamaOutputMessage
  done: false
}

export type OllamaOutputResponse = OllamaOutputChatResponse | OllamaOutputChatStreamChunk

export interface OllamaInputMessage {
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  images?: string[] // base64-encoded strings
  tool_calls?: {
    function: {
      name: string
      arguments: Record<string, unknown>
    }
  }[]
}

export interface OllamaInputOptions {
  temperature?: number
  num_ctx?: number
  top_k?: number
  top_p?: number
  min_p?: number
  seed?: number
  stop?: string[]
  num_predict?: number
  repeat_penalty?: number
  presence_penalty?: number
  frequency_penalty?: number
  tfs_z?: number
  mirostat?: number
  mirostat_tau?: number
  mirostat_eta?: number
  num_gpu?: number
  num_thread?: number
  numa?: boolean
  low_vram?: boolean
  f16_kv?: boolean
  vocab_only?: boolean
  use_mmap?: boolean
  use_mlock?: boolean
}

export interface OllamaInputTool {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: {
      type: 'object'
      properties: Record<string, {
        type: string
        description?: string
        enum?: string[]
      }>
      required?: string[]
    }
  }
}

export interface OllamaInputChatRequest {
  model: string
  messages: OllamaInputMessage[]
  stream?: boolean
  think?: boolean
  format?: 'json' | Record<string, unknown> // JSON schema for structured output
  options?: OllamaInputOptions
  tools?: OllamaInputTool[]
  keep_alive?: number | string // e.g. "5m", -1 to keep forever
}

/** POSTs a chat request to an Ollama `/api/chat` endpoint, returning the response or an `Error`. */
export async function promptOllama(url: string, input: OllamaInputChatRequest): Promise<OllamaOutputChatResponse | Error>
export async function promptOllama(url: string, message: string, input: Omit<OllamaInputChatRequest, 'messages'>): Promise<OllamaOutputChatResponse | Error>
export async function promptOllama(
  url: string,
  a: OllamaInputChatRequest | string,
  b?: Omit<OllamaInputChatRequest, 'messages'>,
): Promise<OllamaOutputChatResponse | Error> {
  const request: OllamaInputChatRequest = typeof a === 'string'
    ? { ...b as Omit<OllamaInputChatRequest, 'messages'>, messages: [{ role: 'user', content: a }] }
    : a

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })

    if (!res.ok) {
      let detail = res.statusText

      try {
        detail = await res.text() || res.statusText
      }
      catch {
        detail = res.statusText
      }

      return new Error(`Ollama request failed: ${res.status} ${detail}`)
    }

    return await res.json() as OllamaOutputChatResponse
  }
  catch (e) {
    if (e instanceof Error)
      return e

    if (typeof e === 'string')
      return new Error(e)

    return new Error(`Unknown error: ${e}`)
  }
}
