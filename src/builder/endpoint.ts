/* eslint-disable ts/no-empty-object-type */
import type { Key, PartialRecord } from '~/types'

type ExtractParams<T extends string> =
  T extends `${string}{${infer Param}}${infer Rest}`
    ? Record<Param, string> & ExtractParams<Rest>
    : {}

type ResolveParams<
  T extends string,
  CustomTypes extends Record<string, any>,
> = ExtractParams<T> extends infer BaseParams
  ? {
      [K in keyof BaseParams]: K extends keyof CustomTypes
        ? CustomTypes[K]
        : BaseParams[K]
    }
  : {}

type HasKeys<T> = keyof T extends never ? false : true

export type EndpointArgs<
  EndpointsConst extends Record<Key, string>,
  T extends keyof EndpointsConst,
  CustomTypes extends PartialRecord<keyof EndpointsConst, Record<string, any>> = {},
> = HasKeys<ResolveParams<EndpointsConst[T], CustomTypes[T] extends Record<string, any> ? CustomTypes[T] : {}>> extends true
  ? [T, ResolveParams<EndpointsConst[T], CustomTypes[T] extends Record<string, any> ? CustomTypes[T] : {}>]
  : [T] | [T, undefined]

export function declareGetEndpoint<
  EndpointsConst extends Record<Key, string>,
  CustomTypes extends PartialRecord<keyof EndpointsConst, Record<string, any>> = {},
>(ENDPOINTS: EndpointsConst) {
  function getEndpoint<T extends keyof EndpointsConst>(
    args: EndpointArgs<EndpointsConst, T, CustomTypes>
  ): string
  function getEndpoint<T extends keyof EndpointsConst>(
    endpoint: T,
    ...params: HasKeys<ResolveParams<EndpointsConst[T], CustomTypes[T] extends Record<string, any> ? CustomTypes[T] : {}>> extends true
      ? [ResolveParams<EndpointsConst[T], CustomTypes[T] extends Record<string, any> ? CustomTypes[T] : {}>]
      : [] | [undefined]
  ): string
  function getEndpoint<T extends keyof EndpointsConst>(
    argsOrEndpoint: EndpointArgs<EndpointsConst, T, CustomTypes> | T,
    params?: ResolveParams<EndpointsConst[T], CustomTypes[T] extends Record<string, any> ? CustomTypes[T] : {}>,
  ): string {
    const [name, resolvedParams] = Array.isArray(argsOrEndpoint)
      ? argsOrEndpoint
      : [argsOrEndpoint, params]

    const endpoint: string = ENDPOINTS[name]
    if (!resolvedParams) {
      return endpoint
    }
    return Object.entries(resolvedParams).reduce(
      (acc, [key, value]) => acc.replaceAll(`{${key}}`, String(value)),
      endpoint,
    )
  }

  return getEndpoint
}

export function declareIsEndpoint<
  EndpointsConst extends Record<Key, string>,
>(ENDPOINTS: EndpointsConst) {
  return <T extends keyof EndpointsConst = keyof EndpointsConst>(
    args: any,
  ): args is EndpointArgs<EndpointsConst, T> => {
    if (!Array.isArray(args))
      return false
    if (args.length < 1 || args.length > 2)
      return false

    const [name, values] = args
    if (!ENDPOINTS[name])
      return false

    if (args.length === 1)
      return true
    if (args.length === 2 && (values === undefined || typeof values === 'object'))
      return true

    return false
  }
}
