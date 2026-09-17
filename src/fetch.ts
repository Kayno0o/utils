import { SECOND_MS } from './date'

/** Long enough for a slow page, short enough that a peer which goes quiet cannot pin a caller for the process's lifetime. */
export const DEFAULT_FETCH_TIMEOUT_MS = 15 * SECOND_MS

/** The caller's signal, a deadline, or both - undefined when there is neither. */
export function combineSignals(signal: AbortSignal | null | undefined, timeoutMs: number | undefined): AbortSignal | undefined {
  if (timeoutMs === undefined)
    return signal ?? undefined

  const deadline = AbortSignal.timeout(timeoutMs)

  return signal ? AbortSignal.any([signal, deadline]) : deadline
}

export interface FetchWithTimeoutInit extends RequestInit {
  timeoutMs?: number
}

/**
 * `fetch` with a deadline, for every call to a service you do not run: a caller `signal` still
 * aborts, whichever fires first. Not for a response streamed on to a viewer, whose read outlives
 * any fixed deadline.
 */
export async function fetchWithTimeout(url: string | URL, init: FetchWithTimeoutInit = {}): Promise<Response> {
  const { timeoutMs = DEFAULT_FETCH_TIMEOUT_MS, signal, ...rest } = init

  return await fetch(url, { ...rest, signal: combineSignals(signal, timeoutMs) })
}
