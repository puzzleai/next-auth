// import getAuthorizationUrl from "../lib/oauth/authorization-url"
// import emailSignin from "../lib/email/signin"
import type { RequestInternal, OutgoingResponse } from ".."
import type { InternalOptions } from "../types"
import type { Account, User } from "../.."

/** Handle requests to /api/auth/signin */
export default async function signin(params: {
  query: RequestInternal["query"]
  body: RequestInternal["body"]
}): Promise<OutgoingResponse> {
  

  return { redirect: `/signin` }
}
