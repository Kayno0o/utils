/* eslint-disable ts/no-empty-object-type */
import type { ExtractParams, ExtractVariables, Key } from '~/types'

type ResolveParams<
  T extends string,
  CustomTypes extends Record<Key, any>,
> = ExtractParams<T, string | number> extends infer BaseParams
  ? {
    [K in keyof BaseParams]: K extends keyof CustomTypes
      ? CustomTypes[K]
      : BaseParams[K]
  }
  : {}

type KeysWithoutVariablesType<Object extends Record<Key, any>, Keys extends Key = keyof Object> = {
  [K in Keys]: ExtractVariables<Object[K]> extends never
    ? K
    : never
}[Keys]

type KeysWithVariablesType<Object extends Record<Key, any>, Keys extends Key = keyof Object> = {
  [K in Keys]: ExtractVariables<Object[K]> extends never
    ? never
    : K
}[Keys]

type OnlyAllowedKeys<T, AllowedKeys extends Key> = {
  [K in keyof T]: K extends AllowedKeys ? T[K] : never
}

export function declareGetEndpoint<
  EndpointsConst extends Record<Key, string>,
  CustomTypes extends OnlyAllowedKeys<CustomTypes, KeysWithVariablesType<EndpointsConst>> = {},
>(ENDPOINTS: EndpointsConst) {
  type KeysWithoutVariables = KeysWithoutVariablesType<EndpointsConst>
  type KeysWithVariables = KeysWithVariablesType<EndpointsConst>

  function getEndpoint<Name extends KeysWithoutVariables>(name: Name): string
  function getEndpoint<Name extends KeysWithVariables>(name: Name, resolvedParams: ResolveParams<EndpointsConst[Name], CustomTypes[Name] extends Record<Key, any> ? CustomTypes[Name] : {}>): string

  function getEndpoint(name: string, resolvedParams?: any): string {
    const endpoint: string = ENDPOINTS[name]
    if (!resolvedParams)
      return endpoint

    return Object.entries(resolvedParams).reduce((acc, [key, value]) => acc.replaceAll(`{${key}}`, String(value)), endpoint)
  }

  return getEndpoint
}
