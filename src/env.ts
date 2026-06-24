export const isBrowser = (): boolean => typeof window !== 'undefined' && typeof document !== 'undefined'
export const isNode = (): boolean => typeof process !== 'undefined' && process.versions?.node != null
export const isBun = (): boolean => typeof Bun !== 'undefined'
export const isWorker = (): boolean => 'WorkerGlobalScope' in globalThis
