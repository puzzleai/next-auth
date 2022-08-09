import { randomBytes, randomUUID } from "crypto"
import { AccountNotLinkedError } from "../errors"
import { fromDate } from "./utils"

import type { InternalOptions } from "../types"
import type { AdapterSession, AdapterUser } from "../../adapters"
import type { JWT } from "../../jwt"
import type { Account, User } from "../.."
import type { SessionToken } from "./cookie"

/**
 * This function handles the complex flow of signing users in, and either creating,
 * linking (or not linking) accounts depending on if the user is currently logged
 * in, if they have account already and the authentication mechanism they are using.
 *
 * It prevents insecure behaviour, such as linking OAuth accounts unless a user is
 * signed in and authenticated with an existing valid account.
 *
 * All verification (e.g. OAuth flows or email address verificaiton flows) are
 * done prior to this handler being called to avoid additonal complexity in this
 * handler.
 */
export default async function callbackHandler(params: {
  sessionToken?: SessionToken
  profile: User
  account: Account
  options: InternalOptions
}) {
  const { sessionToken, profile, account, options } = params
  // Input validation
  if (!account?.providerAccountId || !account.type)
    throw new Error("Missing or invalid provider account")
  if (!["email", "oauth"].includes(account.type))
    throw new Error("Provider not supported")

  const {
    adapter,
    jwt,
    events,
    session: { strategy: sessionStrategy },
  } = options

  // If no adapter is configured then we don't have a database and cannot
  // persist data; in this mode we just return a dummy session object.
  if (!adapter) {
    return { user: profile, account, session: {} }
  }

  const {
    createUser,
    updateUser,
    getUser,
    getUserByAccount,
    getUserByEmail,
    linkAccount,
    createSession,
    getSessionAndUser,
    deleteSession,
  } = adapter

  let session: AdapterSession | JWT | null = null
  let user: AdapterUser | null = null
  let isNewUser = false

  const useJwtSession = sessionStrategy === "jwt"

  if (sessionToken) {
    if (useJwtSession) {
      try {
        session = await jwt.decode({ ...jwt, token: sessionToken })
        if (session && "sub" in session && session.sub) {
          user = await getUser(session.sub)
        }
      } catch {
        // If session can't be verified, treat as no session
      }
    } else {
      const userAndSession = await getSessionAndUser(sessionToken)
      if (userAndSession) {
        session = userAndSession.session
        user = userAndSession.user
      }
    }
  }
}

function generateSessionToken() {
  // Use `randomUUID` if available. (Node 15.6++)
  return randomUUID?.() ?? randomBytes(32).toString("hex")
}
