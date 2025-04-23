import * as React from "react"
import {
  json,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "@remix-run/node"
import { useFetcher, useLoaderData, useNavigate } from "@remix-run/react"
import { IconMatch } from "~/components/libs/icon" 
import { Button } from "~/components/ui/button"
import { ButtonLink } from "~/components/ui/button-link"
import { ButtonLoading } from "~/components/ui/button-loading"
import { db } from "~/libs/db.server"
import { createMeta } from "~/utils/meta"
import { createSitemap } from "~/utils/sitemap" 
import {
  getPaginationConfigs,
  getPaginationOptions,
  PaginationNavigation,
  PaginationSearch,
} from "~/components/shared/pagination-search"
import { Input } from "~/components/ui/input"
import { Prisma } from '@prisma/client'


export const handle = createSitemap()

export const meta: MetaFunction = () =>
  createMeta({
    title: `User Release`,
    description: `Manage Public Releases`,
  })

export const loader = async ({ request }: LoaderFunctionArgs) => {
  let config = getPaginationConfigs({ request })
  const url = new URL(request.url);
  let isSearching = (url.searchParams.get("isSearching") === "1" || url.searchParams.get("isBtnSearch") === "1") ? true : false;
  let isSearchText = url.searchParams.get("isSearchText") ? true : false;
  let searchText = url.searchParams.get("searchText");  
  let searchColumn = url.searchParams.get("searchColumn"); 
  // console.log('isSearching: ', isSearching)  
  // console.log('searchColumn: ', searchColumn)  
  // console.log('searchText: ', searchText)
  // console.log('isSearchText: ', isSearchText)
  let where = null;

  if (isSearching) {
    if (isSearchText && searchColumn == "all" ) {
      console.log('--search all--')
      where = {
        OR: [
          {
            fullname: {
              contains: searchText ?? "",
              mode: Prisma.QueryMode.insensitive,
            },            
          },
          {
            email: {
              contains: searchText ?? "",
              mode: Prisma.QueryMode.insensitive,
            },            
          },
          
        ],
      };
    } else if (isSearchText && searchColumn?.length! > 0) {
      console.log("search isSearchText..")
      where = {
          OR: [{fullname: isSearchText && searchColumn == "fullName" ? {
            contains: searchText ?? "",
            mode: Prisma.QueryMode.insensitive,          
          } : {},
          email: isSearchText && searchColumn == "email" ? {
            contains: searchText ?? "",
            mode: Prisma.QueryMode.insensitive,
          } : {},
        },
        ]
      }
    } else {
      where = {}
    }

  } else {
    where = {
      // OR: [{ typeId: 2 }, { typeId: 3 }, { typeId: 4 }] 
    }
  }


console.log("where: ", where)

  const [totalItems, users] = await db.$transaction([
    db.user.count({ where }),
    db.user.findMany({
      where: where,
      skip: config.skip,
      take: config.limitParam,
      orderBy: { id: "desc" },
    }),
  ])
  // console.log("totalItems: ", totalItems)
  // console.log("users: ", users)
  return json({
    users,
    searchText,
    searchColumn,
    isSearchText,
    ...getPaginationOptions({ request, totalItems, customQueryParam: "" }),
  })
}

export default function UserUsersRoute() {
  const data = useLoaderData<typeof loader>()
  const formRef = React.useRef<HTMLFormElement>(null);
  const formRef2 = React.useRef<HTMLFormElement>(null);
  const fetcher = useFetcher<typeof loader>();
  let navigate = useNavigate()
  const [users, setUsers] = React.useState(data.users);  
  let {queryParam, limitParam, pageParam, totalItems, totalPages, paginationItems, customQueryParam} = data;
  const [paginationData, setPaginationData] = React.useState({queryParam, limitParam, pageParam, totalItems, totalPages, paginationItems, customQueryParam});
  const [searchData, setSearchData] =  React.useState({
    text: data.searchText,
    column: data.searchColumn,
  })
  const [isSearchText, setIsSearchText] =  React.useState(data.isSearchText ? true : false);
  const isSubmitting = fetcher.state === "submitting"
  
  const getTypeName = (id:number) => {
    switch (id) {
      case 1 : {
        return "Admin" 
      }
      case 2 : {
        return "Manager" 
      }
      case 3 : {
        return "Agent" 
      }
      case 4 : {
        return "Client" 
      }
    }
  }

  const handleSelectColumn = (selected:any) => {    
    setSearchData(prevValues => ({
      ...searchData,
      searchColumn: selected,
    }))
  };

  const handleSearchText = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target    
    setSearchData(prevValues => ({
        ...searchData,
        searchText: value,
      }))
  };

  const handleSearch = () => {
    const formData = new FormData(formRef2.current!);
    console.log('formData: ', formData)
    fetcher.submit(formData)
  };

  React.useEffect(() => {
    // console.log('useEffect-data: ', data) 
    if (data && data.users.length) {
      setUsers(data.users);
      let {queryParam, limitParam, pageParam, totalItems, totalPages, paginationItems, customQueryParam} = data;
      setPaginationData({ queryParam, limitParam, pageParam, totalItems, totalPages, paginationItems, customQueryParam});
    }
  },[data])

  React.useEffect(() => {
    // console.log('useEffect-fetcher.data: ', fetcher.data)
    if (fetcher.data && fetcher.data?.users) {
      setUsers(fetcher.data.users);
      let {queryParam, limitParam, pageParam, totalItems, totalPages, paginationItems} = fetcher.data; 
      setPaginationData({ queryParam, limitParam, pageParam, totalItems, totalPages, paginationItems, customQueryParam});
    }  
  },[fetcher.data])
  
  return (
    <div className="app-container">
      <header className="app-header">
        <div>
          <h2>User List</h2>
        </div>
      </header>

      <section className="app-section">
 
 
        <div className=" flex app-section my-3 w-full block ">
          <fetcher.Form  ref={formRef2} id="searchForm"  method="post"  className="inline ">  
            <div className="flex w-full " >
                  <input  type="checkbox" name="isSearchText" checked={isSearchText} onChange={()=>setIsSearchText(!isSearchText)} className="self-center w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
                  <label className="self-center ml-2"  style={{width: "110px"}}>
                    Search Text :
                  </label>
                  <div className="mr-5" style={{width: "200px"}}>
                    <Input              
                      className="w-full"
                      placeholder=""
                      defaultValue={searchData.text ?? ""}  
                      name="searchText"
                      disabled={!isSearchText}  
                      readOnly={!isSearchText}      
                      onChange={handleSearchText} 
                      onKeyDown ={(e:React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => { e.key === 'Enter' && e.preventDefault(); }} 
                    />
                  </div>
                  <label className="self-center inline-block"  style={{width: "80px"}}>
                    Column :
                  </label>
                  <div className="mr-4" style={{width: "200px"}}>
                    <select className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500  p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      name="searchColumn" defaultValue={searchData.column ?? "all"} onChange={handleSelectColumn} disabled={!isSearchText} 
                    >
                      <option key="all" value='all' selected>All column</option>
                      <option key='fullName' value='fullName' selected={searchData.column == "Full name" ? true : false} >Full name</option>
                      <option key='email' value='email' selected={searchData.column == "email" ? true : false} >Email</option>
                    </select> 
                  </div>  
                  <div className="max-w-sm">
                    <div className="">  
                      <input type="hidden" name="isBtnSearch" value="1" />
                      <Button type="button" size="sm" variant="default" onClick={handleSearch} className="mr-4"><IconMatch icon="magnifying-glass" />Search</Button>                
                    </div>
                      
                  </div>
              </div> 
            </fetcher.Form>   
            <div className="">  
              <Button type="button" size="sm" variant="default"  onClick={() => navigate("/user/register-new-agent")} className="mr-3">
                <IconMatch icon="plus" />
                <span>New Agent</span>
              </Button> 
              <Button type="button" size="sm" variant="default"  onClick={() => navigate("/user/register-new-client")} >
                <IconMatch icon="plus" />
                <span>New Client</span>
              </Button>
            </div>   
        </div> 
        
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg mt-4">
          <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400 rtl:text-right">
            <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">
                  Fullname
                </th>
                <th scope="col" className="px-6 py-3">
                  Email
                </th>
                <th scope="col" className="px-6 py-3">
                  Type
                </th>
                <th scope="col" className="px-6 py-3">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              { users.length == 0 ? <tr> <td colSpan={8} className="text-center p-4">No records found..</td></tr> 
              : users.map(r => (
                <tr
                  onClick={() => navigate("../users/" + r.id)}
                  className="cursor-pointer border-b bg-white dark:border-gray-700 dark:bg-gray-800"
                > 
                  <td className="px-6 py-4">{r.fullname}</td>
                  <td className="px-6 py-4">{r.email}</td>
                  <td className="px-6 py-4">{getTypeName(r.typeId)}</td>
                  <td className="px-6 py-4">{r.isActive ? 'Enabled' : 'Disabled'}</td> 
                </tr>
              ))}
            </tbody>
          </table>
          { paginationData.totalItems > 0 ? <section className="app-section p-4">
            <PaginationNavigation  {...paginationData} />        
          </section> : "" }
        </div>
      </section>
    </div>
  )
}
 