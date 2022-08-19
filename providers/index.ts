import type { OAuthConfig, OAuthProvider } from "./oauth"


import type {
  CredentialsConfig,
  CredentialsProvider,
  CredentialsProviderType,
} from "./credentials"

export * from "./oauth"
export * from "./credentials"

export type ProviderType = "oauth" | "email" | "credentials"

export interface CommonProviderOptions {
  id: string
  name: string
  type: ProviderType
  options?: Record<string, unknown>
}

export type Provider = OAuthConfig<any>  | CredentialsConfig

export type BuiltInProviders = Record<CredentialsProviderType, CredentialsProvider> 

export type AppProviders = Array<
  Provider | ReturnType<BuiltInProviders[keyof BuiltInProviders]>
>

export interface AppProvider extends CommonProviderOptions {
  signinUrl: string
  callbackUrl: string
}

export type RedirectableProviderType = "email" | "credentials"

export type BuiltInProviderType = RedirectableProviderType
