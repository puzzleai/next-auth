import { merge } from "../../utils/merge"

import type { InternalProvider } from "../types"
import type { Provider } from "../../providers"
import type { InternalUrl } from "../../utils/parse-url"

/**
 * Adds `signinUrl` and `callbackUrl` to each provider
 * and deep merge user-defined options.
 */
export default function parseProviders(params: {
  providers: Provider[]
  url: InternalUrl
  providerId?: string
}): {
  providers: InternalProvider[]
  provider?: InternalProvider
} {
  const { url, providerId } = params

  const providers = params.providers.map(({ options, ...rest }) => {
    const defaultOptions = normalizeProvider(rest as Provider)

    return merge(defaultOptions, {
    })
  })

  const provider = providers.find(({ id }) => id === providerId)

  return { providers, provider }
}

function normalizeProvider(provider?: Provider) {
  if (!provider) return

  const normalized: InternalProvider = Object.entries(
    provider
  ).reduce<InternalProvider>((acc, [key, value]) => {
    if (
      ["authorization", "token", "userinfo"].includes(key) &&
      typeof value === "string"
    ) {
      const url = new URL(value)
      acc[key] = {
        url: `${url.origin}${url.pathname}`,
        params: Object.fromEntries(url.searchParams ?? []),
      }
    } else {
      acc[key] = value
    }

    return acc
    // eslint-disable-next-line @typescript-eslint/prefer-reduce-type-parameter, @typescript-eslint/consistent-type-assertions
  }, {} as any)

  return normalized
}
