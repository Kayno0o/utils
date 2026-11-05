import type { FetchJsonOptions } from './browser/fetch'
import { fetchJson, mergeHeaders, readNdjson, toFetchError } from './browser/fetch'
import { combineSignals } from './fetch'

export interface OllamaOutputUsage {
  input_tokens: number
  output_tokens: number
}

export interface OllamaToolCall {
  function: {
    name: string
    arguments: Record<string, unknown>
  }
}

export interface OllamaOutputMessage {
  role: 'assistant'
  content: string
  thinking?: string // populated when think: true
  tool_calls?: OllamaToolCall[]
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
  tool_calls?: OllamaToolCall[]
  tool_name?: string // set on a tool-role reply to name the tool that ran
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

/** Request options for the non-streaming helpers; `stream` is fixed by the helper itself. */
export type OllamaPromptRequest = Omit<OllamaInputChatRequest, 'stream'>

/** Transport options forwarded to `fetchJson`, e.g. `timeout` and `signal`. */
export type OllamaFetchOptions = Pick<FetchJsonOptions, 'timeout' | 'signal' | 'headers' | 'token' | 'fetch'>

/** POSTs a chat request to an Ollama `/api/chat` endpoint. Throws `FetchError` on a non-2xx response. */
export async function promptOllama(url: string, input: OllamaPromptRequest, options: OllamaFetchOptions = {}): Promise<OllamaOutputChatResponse> {
  return fetchJson<OllamaOutputChatResponse>(url, {
    ...options,
    method: 'POST',
    body: { ...input, stream: false },
  })
}

/** Like `promptOllama`, but returns any thrown error instead of throwing. */
export async function promptOllamaSafe(url: string, input: OllamaPromptRequest, options?: OllamaFetchOptions): Promise<OllamaOutputChatResponse | Error> {
  try {
    return await promptOllama(url, input, options)
  }
  catch (e) {
    return e instanceof Error ? e : new Error(typeof e === 'string' ? e : `Unknown error: ${e}`)
  }
}

/** POSTs a chat request with `format` defaulted to `'json'`, parsing `message.content` into `T`. */
export async function promptOllamaJson<T>(url: string, input: OllamaPromptRequest, options?: OllamaFetchOptions): Promise<T> {
  const res = await promptOllama(url, { format: 'json', ...input }, options)

  try {
    return JSON.parse(res.message.content) as T
  }
  catch (e) {
    throw new Error(`Ollama returned invalid JSON: ${res.message.content.slice(0, 200)}`, { cause: e })
  }
}

/** Maps Ollama's `*_count` fields onto token usage. */
export function getOllamaUsage(res: OllamaOutputChatResponse): OllamaOutputUsage {
  return { input_tokens: res.prompt_eval_count, output_tokens: res.eval_count }
}

/** Base generation settings for a single use case. */
export interface OllamaSettings {
  model: string
  num_ctx: number
  temperature: number
  think: boolean
  /** Max output tokens (Ollama num_predict). 0/undefined = unbounded. */
  num_predict?: number
}

/** Per-request overrides adjusting a base `OllamaSettings`. All optional. */
export interface OllamaSettingsOverride {
  model?: string
  num_ctx?: number
  temperature?: number
  num_predict?: number
  think?: boolean
}

/** Merges base settings with optional overrides into the shape `promptOllama` wants. */
export function resolveOllamaSettings(
  base: OllamaSettings,
  override: OllamaSettingsOverride = {},
): { model: string, think: boolean, options: OllamaInputOptions } {
  const options: OllamaInputOptions = {
    num_ctx: override.num_ctx ?? base.num_ctx,
    temperature: override.temperature ?? base.temperature,
  }

  const numPredict = override.num_predict ?? base.num_predict

  if (numPredict)
    options.num_predict = numPredict

  return {
    model: override.model || base.model,
    think: override.think ?? base.think,
    options,
  }
}

/** Ollama's nanosecond durations and token counts, converted to UI-friendly units. */
export interface OllamaMeta {
  model: string
  loadMs: number
  promptEvalMs: number
  evalMs: number
  totalMs: number
  promptTokens: number
  outputTokens: number
  tokensPerSec: number
  rawInput: string
  rawOutput: string
  thinking?: string
}

const NS_PER_MS = 1e6
const NS_PER_S = 1e9

/** Converts an Ollama response's durations and token counts into an `OllamaMeta`. */
export function buildOllamaMeta(res: OllamaOutputChatResponse, rawInput: string): OllamaMeta {
  return {
    model: res.model,
    loadMs: (res.load_duration ?? 0) / NS_PER_MS,
    promptEvalMs: (res.prompt_eval_duration ?? 0) / NS_PER_MS,
    evalMs: (res.eval_duration ?? 0) / NS_PER_MS,
    totalMs: (res.total_duration ?? 0) / NS_PER_MS,
    promptTokens: res.prompt_eval_count ?? 0,
    outputTokens: res.eval_count ?? 0,
    tokensPerSec: res.eval_duration ? (res.eval_count ?? 0) / (res.eval_duration / NS_PER_S) : 0,
    rawInput,
    rawOutput: res.message.content,
    thinking: res.message.thinking,
  }
}

/** POSTs a chat request with `stream: true`, yielding each NDJSON chunk as it arrives. */
export async function* streamOllama(
  url: string,
  input: OllamaPromptRequest,
  options: OllamaFetchOptions = {},
): AsyncGenerator<OllamaOutputResponse, void> {
  const { timeout, signal, headers, token, fetch: fetcher = fetch } = options

  const res = await fetcher(url, {
    method: 'POST',
    headers: mergeHeaders(
      {
        'Accept': 'application/x-ndjson',
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : undefined,
      },
      headers,
    ),
    body: JSON.stringify({ ...input, stream: true }),
    signal: combineSignals(signal, timeout),
  })

  if (!res.ok)
    throw await toFetchError(res, url)

  if (!res.body)
    throw new Error(`Ollama returned no body for ${url}`)

  yield* readNdjson<OllamaOutputResponse>(res.body)
}
