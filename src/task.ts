/**
 * Shared vocabulary for the background-task protocol: a server records a long-running
 * job's progress, a client polls it until it settles. The two halves live in different
 * packages (`@kaynooo/elysia` runs tasks, `@kaynooo/solidjs` polls them), so the state
 * machine they both speak is defined here rather than mirrored in each.
 */

/** Lifecycle of a background task: `pending`/`running` are in flight, the rest are terminal. */
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed'

/** The terminal statuses - a task that reached one of these will never change again. */
export type SettledTaskStatus = Extract<TaskStatus, 'completed' | 'failed'>

/** The statuses a task can still be making progress in. */
export const TASK_IN_FLIGHT_STATUSES = ['pending', 'running'] as const satisfies readonly TaskStatus[]

/** A task snapshot as returned by the polled endpoint. */
export interface TaskSnapshot {
  status: string
  processed: number
  total: number
  result: string | null
}

/** The final snapshot, once the task stops running. */
export interface SettledTask {
  status: SettledTaskStatus
  total: number
  result: string | null
}

/** Whether a task has reached a terminal state, narrowing the status it was read from. */
export function isTaskSettled(status: string): status is SettledTaskStatus {
  return status === 'completed' || status === 'failed'
}
