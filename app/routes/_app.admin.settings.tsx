import { parse } from "@conform-to/zod"
import { json, type ActionFunctionArgs, type MetaFunction } from "@remix-run/node"

import { schemaGeneralId } from "~/schemas/general"
import { createMeta } from "~/utils/meta"
import { createSitemap } from "~/utils/sitemap"
import { ThemeMenu } from "~/components/shared/theme-menu"

export const handle = createSitemap()

export const meta: MetaFunction = () =>
  createMeta({ title: `Settings`, description: `Admin settings` })

export default function AdminSettingsRoute() {
  return (
    <div className="app-container">
      <header className="app-header">
        <div>
          <h2>Settings</h2>
          <p>Manage application settings</p>
        </div>
      </header>
      
      <section className="app-section mt-4" >
        <div className="mb-4 flex max-w-xs flex-col">
          <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-white">
            Theme <ThemeMenu variant="ghost" />
          </label>
        </div>
      </section>
    </div>
  )
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()
  const submission = parse(formData, { schema: schemaGeneralId })
  if (!submission.value || submission.intent !== "submit") {
    return json(submission, { status: 400 })
  }
  return json(submission)
}
