export type SameSiteValue = 'Strict' | 'Lax' | 'None'

export interface CookieOptions {
  'expires'?: string
  'max-age'?: number
  'path'?: string
  'domain'?: string
  'secure'?: boolean
  'sameSite'?: SameSiteValue
}

export interface DeleteOptions {
  path?: string
  domain?: string
}

export class CookieBuilder {
  private name: string
  private value: string
  private options: CookieOptions = {}

  constructor(name: string, value: string) {
    this.name = name
    this.value = value
  }

  expires(date: Date | string): this {
    this.options.expires = date instanceof Date ? date.toUTCString() : date

    return this
  }

  maxAge(seconds: number): this {
    this.options['max-age'] = seconds

    return this
  }

  path(path: string): this {
    this.options.path = path

    return this
  }

  domain(domain: string): this {
    this.options.domain = domain

    return this
  }

  secure(): this {
    this.options.secure = true

    return this
  }

  sameSite(value: SameSiteValue): this {
    this.options.sameSite = value

    return this
  }

  build(): string {
    let cookieString = `${encodeURIComponent(this.name)}=${encodeURIComponent(this.value)}`

    for (const [key, value] of Object.entries(this.options)) {
      if (value === true) {
        cookieString += `; ${key}`
      }
      else if (value !== undefined) {
        cookieString += `; ${key}=${value}`
      }
    }

    document.cookie = cookieString

    return cookieString
  }
}

export class CookieManager {
  static set(name: string, value: string): CookieBuilder {
    return new CookieBuilder(name, value)
  }

  static get(name: string): string | null {
    const cookies = document.cookie.split(';')

    for (const cookie of cookies) {
      const [cookieName, cookieValue] = cookie.trim().split('=')

      if (decodeURIComponent(cookieName!) === name) {
        return decodeURIComponent(cookieValue || '')
      }
    }

    return null
  }

  static getAll(): Record<string, string> {
    const cookies: Record<string, string> = {}
    const cookieArray = document.cookie.split(';')

    for (const cookie of cookieArray) {
      const [name, value] = cookie.trim().split('=')

      if (name) {
        cookies[decodeURIComponent(name)] = decodeURIComponent(value || '')
      }
    }

    return cookies
  }

  static delete(name: string, options: DeleteOptions = {}): void {
    const builder = new CookieBuilder(name, '')

    builder.expires(new Date(0))

    if (options.path)
      builder.path(options.path)

    if (options.domain)
      builder.domain(options.domain)

    builder.build()
  }

  static exists(name: string): boolean {
    return this.get(name) !== null
  }

  static clear(options: DeleteOptions = {}): void {
    const cookies = this.getAll()

    for (const name in cookies) {
      this.delete(name, options)
    }
  }

  static update(name: string, value: string): CookieBuilder {
    return new CookieBuilder(name, value)
  }
}
