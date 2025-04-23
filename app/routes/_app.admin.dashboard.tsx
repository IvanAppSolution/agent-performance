import {  type MetaFunction, type LoaderFunctionArgs  } from "@remix-run/node" 
import { useRootLoaderData } from "~/hooks/use-root-loader-data"
import { createMeta } from "~/utils/meta"
import { createSitemap } from "~/utils/sitemap" 

export const handle = createSitemap()

export const meta: MetaFunction = () =>
  createMeta({ title: `Admin Dashboard`, description: `Dashboard for admin` })

export default function AdminDashboardRoute() {

  return (
    <div className="app-container">
      <header className="app-header items-center gap-2 sm:gap-4">
        <div>
          <h2>Admin Dashboard</h2>
        </div>
      </header>

       
    </div>
  )
}
