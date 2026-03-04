export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function delay<T extends (...args: any[]) => any>(ms: number, callback?: T, ...args: Parameters<T>): Promise<T extends undefined ? void : ReturnType<T>> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const result = callback?.(...args)

        resolve(result as any)
      }
      catch (error) {
        reject(error)
      }
    }, ms)
  })
}

export function debounce<T extends (...args: any[]) => any>(func: T, delay: number): ((...args: Parameters<T>) => void) {
  let timeoutId: ReturnType<typeof setTimeout>

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

export function throttle<T extends (...args: any[]) => any>(func: T, delay: number): ((...args: Parameters<T>) => void) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  let canRun = true

  return (...args: Parameters<T>) => {
    if (canRun)
      func(...args)

    canRun = false

    timeoutId ||= setTimeout(() => {
      canRun = true
      timeoutId = undefined
    }, delay)
  }
}

export function once<T extends (...args: any[]) => any>(func: T): ((...args: Parameters<T>) => ReturnType<T>) {
  let response: ReturnType<T> | undefined
  let hasRun = false

  return (...args: Parameters<T>) => {
    if (hasRun)
      return response as ReturnType<T>

    response = func(...args)
    hasRun = true

    return response as ReturnType<T>
  }
}
