import { type MetaFunction } from "@remix-run/node"
import { createMeta } from "~/utils/meta"
import { createSitemap } from "~/utils/sitemap"
import { LinkText } from "~/components/ui/link-text"
import { ButtonLink } from "~/components/ui/button-link"

export const handle = createSitemap("/", 1)

export const meta: MetaFunction = () =>
  createMeta({
    title: "Dogokit",
    description:
      "Web app template kit using Remix, React, Tailwind CSS, Radix UI, Prisma ORM, and more.",
  })

export default function IndexRoute() {
  return (
    <div className="site-container space-y-12">
      <section className="site-section">
        <h1>Agent Performance Project</h1>
        <h3 className="text-center mt-5">
          <ButtonLink to="/login" className="transition hover:text-primary">
            Log in
          </ButtonLink>
        </h3>
      </section>
      {/* <section className="site-section">
        <ContentIntro />
      </section>

      <section className="site-section">
        <ContentStack />
      </section>

      <section className="site-section">
        <ContentStart />
      </section>

      <section className="site-section">
        <ContentInspirations />
      </section> */}
    </div>
  )
}
