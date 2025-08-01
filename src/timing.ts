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
