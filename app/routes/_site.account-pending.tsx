import { type MetaFunction } from "@remix-run/react"

import { createMeta } from "~/utils/meta"
import { createSitemap } from "~/utils/sitemap"

export const handle = createSitemap()

export const meta: MetaFunction = () =>
  createMeta({
    title: `Blank`,
    description: `Blank page`,
    canonicalPath: "/account-pending",
  })

export default function accountPendingRoute() {
  return <div className="app-container">
  <header className="app-header justify-between gap-4">
    <div>
      <h2>Account Pending</h2>
    </div>
  </header>

  <section className="app-section">
    Please wait while your account is still pending for approval. Please Inform the manager to approve your account.
  </section>
</div>
}
