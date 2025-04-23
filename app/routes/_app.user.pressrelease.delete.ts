import { parse } from "@conform-to/zod"
import { json, redirect, type ActionFunctionArgs } from "@remix-run/node"

import { requireUser } from "~/helpers/auth"
import { modelPressrelease } from "~/models/pressrelease.server"
import { schemaPressreleaseDeleteById } from "~/schemas/pressrelease"
// import { createTimer } from "~/utils/timer"

export const action = async ({ request }: ActionFunctionArgs) => {
  const { userId } = await requireUser(request)

  // const timer = createTimer()
  const formData = await request.formData()
  const intent = formData.get("intent")?.toString()

  if (intent === "pressrelease-delete") {
    const submission = parse(formData, { schema: schemaPressreleaseDeleteById })
    if (!submission.value) return json(submission, { status: 400 })
    await modelPressrelease.deleteById({ userId, ...submission.value })
    // await timer.delay()
    return redirect(`/user/pressreleases`)
  }

  // await timer.delay()
  return null
}
