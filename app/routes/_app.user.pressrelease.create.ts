import { redirect, type ActionFunctionArgs } from "@remix-run/node"

import { requireUser } from "~/helpers/auth"
import { modelPressrelease } from "~/models/pressrelease.server"
import { invariantResponse } from "~/utils/invariant"
import { createSitemap } from "~/utils/sitemap"
import { createTimer } from "~/utils/timer"

export const handle = createSitemap()

export const action = async ({ request }: ActionFunctionArgs) => {
  const timer = createTimer()
  const { user, userId } = await requireUser(request)
  
  const pressrelease = await modelPressrelease.create({
    userId,
    customerId: user.id, // set to own id default id to avoid issue
    brand: "",
    publication: "",
    potentialReach: 0,
    score: 0,
    link: "",
    linkly: "",
    linkClicks: 0,
    isTemp: false,
  })

  invariantResponse(pressrelease, "Press release failed be create", { status: 400 })

  // await timer.delay()
  return redirect(`/user/pressreleases/${pressrelease.id}`)
}
