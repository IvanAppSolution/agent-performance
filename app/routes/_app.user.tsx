import { type LoaderFunctionArgs } from "@remix-run/node"
import { Outlet } from "@remix-run/react"
import { SidebarNavItems } from "~/components/shared/sidebar-nav-items"
import { configNavigationItems } from "~/configs/navigation"
import { authService } from "~/services/auth.server"
import { cn } from "~/utils/cn"
import { createSitemap } from "~/utils/sitemap"
import { redirect } from "@remix-run/node"
import { useMatches } from "@remix-run/react"
import { useMemo } from "react"
import { modelUser } from "~/models/user.server"
import { useRootLoaderData } from "~/hooks/use-root-loader-data"

export const handle = createSitemap()

export function useMatchesData(routeId: string) {
  const matchingRoutes = useMatches()

  const route = useMemo(
    () => matchingRoutes.find(route => route.id === routeId),
    [matchingRoutes, routeId],
  )

  return route?.data
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // await authService.isAuthenticated(request, { failureRedirect: "/login" })
 
  // const postStatuses = await modelPostStatus.getAll()
  // invariantResponse(postStatuses, "Post statuses unavailable", { status: 404 })

  // const customerList = await modelPostStatus.getAll()
  // const { userData } = useRootLoaderData()
  // const data = useMatchesData("root")  
  // console.log('data: ', data)
  // return redirect("/admin/dashboard")

  let auth = await authService.isAuthenticated(request); 
  const user = await modelUser.getById({id: auth!.id });

  if (user && (user.typeId == 1)) {
    return redirect("/admin/dashboard")
  } else if (user && (user.typeId == 2 || user.typeId == 3 || user.typeId == 4)) {
    return null
  } else {
    return redirect("/login")
  }
  // return null;
}

export default function UserLayoutRoute() {
  const { userData } = useRootLoaderData()
  
  // console.log('userData: ', userData)
  // Configure and order in app/configs/navigation.ts
  const navItems = [
    "/user/dashboard",
    "/user/pressreleases",
    "/user/settings",
    "/logout",
  ]

  const managerNavItems = [
    "/user/dashboard",
    "/user/pressreleases",
    "/user/users",
    "/user/user-client",
    "/user/settings",
    "/logout",
  ]

  // IDEA: Use a collapsible and resizable component: shared/sidebar + sidebar-nav-items
  return (
    <div className="flex">
      <nav className={cn("select-none p-2 lg:p-4")}>
        { 
          userData!.typeId == 2 ? <SidebarNavItems
          items={configNavigationItems.filter(item => managerNavItems.includes(item.path))}
        /> : <SidebarNavItems
          items={configNavigationItems.filter(item => navItems.includes(item.path))}
        />
        }

      </nav>

      <div className="min-h-screen w-full pb-20">
        <Outlet />
      </div>
    </div>
  )
}
