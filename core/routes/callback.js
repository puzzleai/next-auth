import callbackHandler from "../lib/callback-handler"
import { hashToken } from "../lib/utils"

// import type { InternalOptions } from "../types"
// import type { RequestInternal, OutgoingResponse } from ".."
// import type { Cookie, SessionStore } from "../lib/cookie"
// import type { User } from "../.."

/** Handle callbacks from login services */
export default async function callback(params) {
  const { options, query, body, method, headers, sessionStore } = params
  const {
    provider,
    adapter,
    url,
    callbackUrl,
    pages,
    jwt,
    events,
    callbacks,
    session: { strategy: sessionStrategy, maxAge: sessionMaxAge },
    logger,
  } = options

  const cookies = []

  const useJwtSession = sessionStrategy === "jwt"

  if (provider.type === "credentials" && method === "POST") {
    const credentials = body

    let user//: User
    try {
      user = (await provider.authorize(credentials, {
        query,
        body,
        headers,
        method,
      })) //as User
      if (!user) {
        return {
          status: 401,
          redirect: `${url}/error?${new URLSearchParams({
            error: "CredentialsSignin",
            provider: provider.id,
          })}`,
          cookies,
        }
      }
    } catch (error) {
      return {
        status: 401,
        redirect: `${url}/error?error=${encodeURIComponent(
          (error).message
        )}`,
        cookies,
      }
    }

    /** @type {import("src").Account} */
    const account = {
      providerAccountId: user.id,
      type: "credentials",
      provider: provider.id,
    }

    try {
      const isAllowed = await callbacks.signIn({
        user,
        // @ts-expect-error
        account,
        credentials,
      })
      if (!isAllowed) {
        return {
          status: 403,
          redirect: `${url}/error?error=AccessDenied`,
          cookies,
        }
      } else if (typeof isAllowed === "string") {
        return { redirect: isAllowed, cookies }
      }
    } catch (error) {
      return {
        redirect: `${url}/error?error=${encodeURIComponent(
          (error).message
        )}`,
        cookies,
      }
    }

    const defaultToken = {
      name: user.name,
      email: user.email,
      picture: user.image,
      sub: user.id?.toString(),
    }

    const token = await callbacks.jwt({
      token: defaultToken,
      user,
      // @ts-expect-error
      account,
      isNewUser: false,
    })

    // Encode token
    const newToken = await jwt.encode({ ...jwt, token })

    // Set cookie expiry date
    const cookieExpires = new Date()
    cookieExpires.setTime(cookieExpires.getTime() + sessionMaxAge * 1000)

    const sessionCookies = sessionStore.chunk(newToken)

    cookies.push(...sessionCookies)

    // @ts-expect-error
    await events.signIn?.({ user, account })

    return { redirect: callbackUrl, cookies }
  }
  return {
    status: 500,
    body: `Error: Callback for provider type ${provider.type} not supported`,
    cookies,
  }
}
