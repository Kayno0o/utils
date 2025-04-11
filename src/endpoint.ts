import type { Key, PartialRecord } from './types'

export type EndpointArgs<
  EndpointsConst extends Record<Key, string>,
  EndpointsType extends PartialRecord<keyof EndpointsConst, any>,
  T extends keyof EndpointsConst,
> = T extends keyof EndpointsType ? [T, EndpointsType[T]] : [T]

export function declareGetEndpoint<
  EndpointsConst extends Record<Key, string>,
  EndpointsType extends PartialRecord<keyof EndpointsConst, any>,
>(ENDPOINTS: EndpointsConst) {
  return <T extends keyof EndpointsConst>([name, args]: EndpointArgs<EndpointsConst, EndpointsType, T>) => {
    const endpoint: string | undefined = ENDPOINTS[name]

    if (!args)
      return endpoint

    return Object.entries(args).reduce((acc, [key, value]) => acc.replaceAll(`{${key}}`, String(value)), endpoint)
  }
}

export function declareIsEndpoint<
  EndpointsConst extends Record<Key, string>,
  EndpointsType extends PartialRecord<keyof EndpointsConst, any>,
>(ENDPOINTS: EndpointsConst) {
  return <T extends keyof EndpointsConst = keyof EndpointsConst>(args: any): args is EndpointArgs<EndpointsConst, EndpointsType, T> => {
    if (!Array.isArray(args))
      return false

    const [name, values] = args
    if (args.length !== 1 && args.length !== 2)
      return false

    if (!ENDPOINTS[name])
      return false

    if (args.length === 1)
      return true

    if (typeof values !== 'object')
      return false

    return true
  }
}
