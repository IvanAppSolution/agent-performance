// Refer to https://github.com/sergiodxa/remix-auth-form for more information

import { AuthorizationError } from "remix-auth"
import { FormStrategy } from "remix-auth-form"

import { db } from "~/libs/db.server"
import { type UserSession } from "~/services/auth.server"

export const formStrategy = new FormStrategy<UserSession>(async ({ form }) => {
  const email = String(form.get("email"))
  const id = String(form.get("id"))
  let user = null;

  if (email && email !== "null") {
    user = await db.user.findUnique({
      where: { email },
      select: { id: true },
    })
  } else if(id && id !== "null") {
    user = await db.user.findUnique({
      where: { id },
      select: { id: true },
    })
  }
  /**
   * The user creation logic was created in the signup action
   * So this Form Stragegy could be used on signup and login
   * Just by finding the user by email
   */
  
  if (!user) throw new AuthorizationError("User not found")

  return { id: user.id }
})
