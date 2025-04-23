import {
  json,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "@remix-run/node"
import { useLoaderData } from "@remix-run/react"
import { requireUser } from "~/helpers/auth"
import { createMeta } from "~/utils/meta"
import { createSitemap } from "~/utils/sitemap" 

export const handle = createSitemap()

export const meta: MetaFunction = () =>
  createMeta({
    title: `User Settings`,
    description: `Manage user account settings`,
  })

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return json(await requireUser(request))
}

export default function emptyRoute() {
  const { user } = useLoaderData<typeof loader>()

  return (
    <div className="app-container">
      <header className="app-header justify-between gap-4">
        <div>
          <h2>Title</h2>
        </div>
      </header>

      <section className="app-section">
        Content
      </section>
    </div>
  )
}

export const action = async ({ request }: ActionFunctionArgs) => {
   
  return null;
}
