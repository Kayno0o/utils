export class JWTBuilder<Payload> {
  constructor(
    public jwt: {
      generate: (payload: Payload, options: any) => string
      verify: (token: string, secret: string) => any
    },
    public secret: string,
  ) {}

  generate(payload: Payload) {
    return this.jwt.generate(payload, this.secret)
  }

  verify(token: string): Payload | undefined {
    try {
      return this.jwt.verify(token, this.secret) as Payload | undefined
    }
    catch (e) {
      console.error(e)

      return undefined
    }
  }
}
