import * as React from "react"
import {
  json,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "@remix-run/node"
import { useFetcher, useLoaderData, useNavigate, useActionData } from "@remix-run/react"
import { IconMatch } from "~/components/libs/icon"
import {
  getPaginationConfigs,
  getPaginationOptions,
  PaginationNavigation,
} from "~/components/shared/pagination-search"
import { Button } from "~/components/ui/button"
import { ButtonLoading } from "~/components/ui/button-loading"
import { requireUser } from "~/helpers/auth"
import { db } from "~/libs/db.server"
import { createMeta } from "~/utils/meta"
import { createSitemap } from "~/utils/sitemap"
import { useRootLoaderData } from "~/hooks/use-root-loader-data"
import { modelUser } from "~/models/user.server"
import { modelUserCustomers } from "~/models/user-customer.server"
import { DatePicker } from "~/components/ui/date-picker"
import { Input } from "~/components/ui/input"
import { Prisma } from '@prisma/client'
import { ToastContainer, toast } from 'react-toastify';
import Papa from 'papaparse';
import { CSVLink } from "react-csv";
import { modelPressrelease } from "~/models/pressrelease.server"
import { type Pressrelease } from "@prisma/client"
import { Dropdown } from "~/components/ui/dropdown"

export const handle = createSitemap()

export const meta: MetaFunction = () =>
  createMeta({
    title: `User Release`,
    description: `Manage Public Releases`,
  })

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // console.log('HERE1');
  let { user, userId, userTypeId } = await requireUser(request)
  let config = getPaginationConfigs({ request })
  config.limitParam = user.pagingRowLimit;
  const url = new URL(request.url);
  let agentId = "";
  
  let selectedAgentId = (url.searchParams.get("selectedAgentId") || url.searchParams.get("searchAgentId"))?? ""; 
  let isSearchingAgentCustomers = url.searchParams.get("isSearchingAgentCustomers") === "1" ? true : false; 
  let selectedCustomerId = url.searchParams.get("selectedCustomerId") ?? "";  
  let searchDateFrom = url.searchParams.get("searchDateFrom");  
  let searchDateTo = url.searchParams.get("searchDateTo");  
  let searchText = url.searchParams.get("searchText");  
  let searchColumn = url.searchParams.get("searchColumn");  
  let isSearching = (url.searchParams.get("isSearching") === "1" || url.searchParams.get("isBtnSearch") === "1") ? true : false;
  let searchCustomerId = url.searchParams.get("searchCustomerId");
  let isSearchDate = (url.searchParams.get("isSearchDate") === "1" || url.searchParams.get("isSearchDate") == "on") ? true : false;
  let isSearchText = (url.searchParams.get("isSearchText") === "1" || url.searchParams.get("isSearchText") == "on") ? true : false;
  let isSearchGraphData = url.searchParams.get("isSearchGraphData") === "1" ? true : false;
  let isSearchingGraphRating = url.searchParams.get("isSearchingGraphRating") === "1" ? true : false;
  let graphRating = url.searchParams.get("graphRating");
  let changePageRowLimit = url.searchParams.get("changePageRowLimit");
  let campaign = url.searchParams.get("campaign"); 
  let isFindingCampaign = url.searchParams.get("isFindingCampaign");

  // console.log('isSearchDate: ', isSearchDate)  
  // console.log('isSearching: ', isSearching)  
  // console.log('searchDateFrom: ', searchDateFrom)  
  // console.log('searchDateTo: ', searchDateTo)
    
  let where = null;
  let customerId:any = "";
  let customers = null;
  let agents = null;

  if (changePageRowLimit) {
    config.limitParam = parseInt(changePageRowLimit);
    await modelUser.updatePagingRowLimit({id: user.id, pagingRowLimit: config.limitParam})
  }

  if (isSearchingAgentCustomers) {
    console.log('--isSearchingAgentCustomers--')  
    if (selectedAgentId.length > 1) { //more then one length means selected is actual long string userid else it is 0
      const userCustomers = await modelUserCustomers.getCustomersByUserId({userId:selectedAgentId})
      const customerIds = userCustomers.map((c:any) => (c.customerId))
      customers = await modelUser.getCustomers({ customerIds })
    } else {
      customers = await modelUser.getAllCustomers();
    }

    return json({
      userId: "",
      userTypeId: 0,
      pressreleases: null,
      customers,
      agents: null,
      searchDateFrom: null,
      searchDateTo: null,
      ok: null,
      message: "",
      searchText: "",
      searchColumn: "",
      customerId: "",
      agentId: "",
      isSearchText: "",
      isSearchGraphData: false,
      isSearchingGraphRating: false,
      isSearchDate: false,
      querySearch: "",
      ...getPaginationOptions({ request, totalItems: 0, defaultMaxPageItems: config.limitParam }),
    })
  }

  if (userTypeId == 1 || userTypeId == 2) {
    agents = await modelUser.getAgents()

  } else if (userTypeId == 3) {
    const userCustomers = await modelUserCustomers.getCustomersByUserId({userId})
    const customerIds = userCustomers.map((c:any) => (c.customerId))
    customers = await modelUser.getCustomers({ customerIds })
  }

  // console.log('isSearching: ', isSearching)
  // console.log('selectedAgentId: ', selectedAgentId)
  // console.log('selectedCustomerId: ', selectedCustomerId)
  //----------- SEARCH QUERIES --------------//
  if (isSearching) {
    console.log('--isSearching--')  
    if ((selectedAgentId && selectedAgentId.length > 1) || (selectedAgentId && selectedAgentId.length > 1) ) {
      userId = selectedAgentId ? selectedAgentId : selectedAgentId;
      agentId = userId;

      //give the customers for the selected agent id
      if (userTypeId == 1 || userTypeId == 2) {
        const userCustomers = await modelUserCustomers.getCustomersByUserId({userId:agentId})
        const customerIds = userCustomers.map((c:any) => (c.customerId))
        customers = await modelUser.getCustomers({ customerIds })    
      }
    } else if (selectedAgentId == "0" || selectedAgentId == "") {
      userId = "0";
      agentId = "0";
    }
    
    if ((searchCustomerId && searchCustomerId.length > 1) || (selectedCustomerId && selectedCustomerId.length) ) {
      customerId = searchCustomerId ? searchCustomerId : selectedCustomerId;
      // console.log('customerId: ', customerId)
    } else {
      if (userTypeId == 4) { // user is client
        customerId = userId; //user.selectedCustomerId;
      } else {
        customerId = "0"; //0 is all customer, empty string is no customer id selected.
      }
      
    }

    if (userTypeId == 4 || userTypeId == 1) { //user is customer, manager, admin should not filter based pr on userId
      userId = ""
    }
    // console.log('--HERE--')
    if (isSearchText && searchColumn == "all" ) {
      console.log('--search all--')
      where = {
        OR: [
          {
            brand: {
              contains: searchText ?? "",
              mode: Prisma.QueryMode.insensitive,
            },            
          },
          {
            publication: {
              contains: searchText ?? "",
              mode: Prisma.QueryMode.insensitive,
            },            
          },
          {
            potentialReach: Number(searchText) ? {
              equals: parseInt(searchText!) 
            } : {},
          },
          {
            score: Number(searchText) ? {
              equals: parseInt(searchText!) 
            } : {},
          },
          {
            linkClicks: Number(searchText) ? {
              equals: parseInt(searchText!)                 
            } : {},
          }
          ],
          dateRelease: (isSearchDate && searchDateFrom && searchDateTo) ? {
            lte: new Date(searchDateTo),
            gte: new Date(searchDateFrom),
          } : {},
          customerId: customerId.length > 1 ? customerId : {},
          userId: userId.length > 1 ? userId : {},
          isTemp: false,
      };
    } else if (isSearchingGraphRating) { // This filter is made for  dashboard graph table summary of 1,2,3 rating click query.
      console.log("search isSearchingGraphRating1: ", isSearchingGraphRating);
      console.log("campaign: ", campaign);
      let brand = null;

      if (isFindingCampaign && campaign !== null) {
        if (campaign == "0") {
          brand = {};
        } else if (campaign == "") {
          brand = '';
        } else {
          brand = campaign;
        }
      }
      
      where = {          
        score: graphRating ? {
          equals: parseInt(graphRating ?? "0") 
        } : {},
        dateRelease: (isSearchDate && searchDateFrom && searchDateTo) ? {
          lte: new Date(searchDateTo),
          gte: new Date(searchDateFrom),
        } : {},
        customerId: customerId.length > 1 ? customerId : {},
        userId: userId.length > 1 ? userId : {},
        brand: isFindingCampaign ? brand : {},
        isTemp: false,
      };
    } else if (isSearchText && searchColumn?.length! > 0) {
      console.log("search isSearchText..")
      where = {
        brand: isSearchText && searchColumn == "brand" ? {
          contains: searchText ?? "",
          mode: Prisma.QueryMode.insensitive,          
        } : {},
        publication: isSearchText && searchColumn == "publication" ? {
          contains: searchText ?? "",
          mode: Prisma.QueryMode.insensitive,
        } : {},
        potentialReach: isSearchText && searchColumn == "potentialReach" ? {
          equals: parseInt(searchText ?? "0") 
        } : {},
        score: isSearchText && searchColumn == "score" ? {
          equals: parseInt(searchText ?? "0") 
        } : {},
        linkClicks: isSearchText && searchColumn == "linkClicks" ? {
          equals: parseInt(searchText ?? "0") 
        } : {},
        dateRelease: (isSearchDate && searchDateFrom && searchDateTo) ? {
          lte: new Date(searchDateTo),
          gte: new Date(searchDateFrom),
        } : {},
        customerId: customerId.length > 1 ? customerId : {},
        userId: userId.length > 1 ? userId : {},
        isTemp: false,
      }
    } else {
      console.log("search default..")
      where = {
        dateRelease: (isSearchDate && searchDateFrom && searchDateTo) ? {
          lte: new Date(searchDateTo),
          gte: new Date(searchDateFrom),
        } : {},
        customerId: customerId.length > 1 ? customerId : {},
        userId: userId.length > 1 ? userId : {},
        isTemp: false,
      }
    }
    console.log('where: ', where)
    const [totalItems, pressreleases] = await db.$transaction([
      db.pressrelease.count({ where }),
      db.pressrelease.findMany({
        where,
        select: {
          id: true,
          userId: true,
          customerId: true,
          dateRelease: true,
          brand: true,
          publication: true,
          potentialReach: true,
          score: true,
          link: true,
          linkClicks: true,
          customer: { select: { fullname: true } },
        },
        skip: config.skip,
        take: config.limitParam,
        orderBy: { dateRelease: "desc" },
      }),
    ])

    const querySearch = "&isSearching=" + (isSearching ? "1" : "0") + "&searchCustomerId=" + (customerId ?? "") + "&selectedAgentId=" + (agentId ?? "") + "&isSearchDate=" + (isSearchDate ? "1" : "0") + "&searchDateFrom=" + (searchDateFrom ?? "") + "&searchDateTo=" + (searchDateTo ?? "") +
    "&searchText=" + (searchText ?? "") + "&searchColumn=" + (searchColumn ?? "") + "&searchColumn=" + (searchColumn ?? "") +  "&isSearchText=" + (isSearchText ? "1" : "0") + 
    "&isSearchGraphData=" + (isSearchGraphData ? "1" : "0") + "&isSearchingGraphRating=" + (isSearchingGraphRating ? "1" : "0") + "&graphRating=" + (graphRating ?? "");

    return json({
      userId,
      userTypeId,
      pressreleases,
      customers,
      agents,
      searchDateFrom,
      searchDateTo,
      ok: null,
      message: "",
      searchText,
      searchColumn,
      customerId,
      agentId,
      isSearchText,
      isSearchGraphData,
      isSearchingGraphRating,
      isSearchDate,
      querySearch,
      ...getPaginationOptions({ request, totalItems, customQueryParam: querySearch, defaultMaxPageItems: config.limitParam }),
    })

  }
 
  //----------- DEFAULT VIEW DEFAULT QUERIES and SELECT ALL CUSTOMERS PRESSRELEASES --------------//
  if (userTypeId == 2 || userTypeId == 3) { //manager or agent 
    // if (selectedCustomerId == "0" || customerId == "0") {
    //   modelUser.updateSelectedCustomerId({id:userId, selectedCustomerId:"0"}) //set "0" selectedCustomerId if selectedCustomerId == "0"  
    // } else {
    //   customerId = user.selectedCustomerId; //set the customerID for 1st click visit, select customer id to  be search
    // }
    // customerId = user.selectedCustomerId;
    // modelUser.updateSelectedCustomerId({id:userId, selectedCustomerId:customerId})
    customerId = selectedCustomerId;

    if ( customerId && customerId?.length > 1) {
      where = { userId, customerId: customerId, isTemp: false, } 
    } else {
      where = !config.queryParam
      ? { AND: [{ userId, isTemp: false, }] } //, customerId:user.selectedCustomerId ?? "" 
      : {
          AND: [{ userId, isTemp: false, }], //, customerId:user.selectedCustomerId ?? ""  
        }
    }
  } else { // customer or client
    where = !config.queryParam
    ? { customerId: userId, isTemp: false, }
    : {
        AND: [{ customerId: userId, isTemp: false, }],
      }
  } 

  console.log('where: ', where)
  const [totalItems, pressreleases] = await db.$transaction([
    db.pressrelease.count({ where }),
    db.pressrelease.findMany({
      where,
      select: {
        id: true,
        userId: true,
        customerId: true,
        dateRelease: true,
        brand: true,
        publication: true,
        potentialReach: true,
        score: true,
        link: true,
        linkClicks: true,
        customer: { select: { fullname: true } },
      },
      skip: config.skip,
      take: config.limitParam,
      orderBy: { dateRelease: "desc" },
    }),
    
  ])
  console.log('PR totalItems: ', totalItems)
  console.log('RETURN 3') 
  return json({
    userId,
    userTypeId,
    pressreleases,
    customers,
    agents,
    searchDateFrom: null,
    searchDateTo: null,
    ok: null,
    message: "",
    searchText: "",
    searchColumn: "",
    customerId,
    agentId,
    isSearchText,
    isSearchGraphData: false,
    isSearchingGraphRating: false,
    isSearchDate,
    querySearch: "",
    ...getPaginationOptions({ request, totalItems, defaultMaxPageItems: config.limitParam }),
  })
  
}



export default function UserPressreleasesRoute() {
  let data = useLoaderData<typeof loader>()
  // console.log("FE-data: ", data)
  // console.log("FE-data.customerId: ", data.customerId)
  const { userData } = useRootLoaderData()  
  const actionData:any = useActionData<typeof action>()
  const formRef2 = React.useRef<HTMLFormElement>(null);
  const csvLink = React.useRef() 
  const fetcher = useFetcher<typeof loader>();
  let navigate = useNavigate()

  if (data?.pressreleases && data?.pressreleases.length) {
    for(let i=0; i<data.pressreleases.length; i++ ) {
      data.pressreleases[i].dateRelease = data.pressreleases[i]?.dateRelease.toString().substring(0, 10) ?? '';
    }
  }
  
  // console.log('data.pressreleases: ', data.pressreleases)
  const [pressreleases, setPressreleases] = React.useState<Pressrelease[]>([]);
  const [pressreleasesCSV, setPressreleasesCSV] = React.useState([]);
  const [hasInitialized, setHasInitialized] =  React.useState(false);
  let {queryParam, limitParam, pageParam, totalItems, totalPages, paginationItems, customQueryParam} = data;
  // console.log('fe-queryParam: ', queryParam) 
  // console.log('fe-paginationItems: ', paginationItems)
  const [paginationData, setPaginationData] = React.useState({queryParam, limitParam, pageParam, totalItems, totalPages, paginationItems, customQueryParam});
  // const [customers, setCustomers] = React.useState(data.customers);
  var prevMonth = new Date();
  prevMonth.setMonth(prevMonth.getMonth() - 1);
  const [searchData, setSearchData] =  React.useState({
    dateFrom: data.searchDateFrom ? new Date(data.searchDateFrom) : prevMonth,
    dateTo: data.searchDateTo ? new Date(data.searchDateTo) : new Date(),
    text: data.searchText,
    column: data.searchColumn,
    customerId: data.customerId ? data.customerId : "0",
    agentId: data.agentId ? data.agentId : "0",
  })
  const inputFileRef = React.useRef(null);
  const [isSearchDate, setIsSearchDate] =  React.useState(data.isSearchDate);
  const [isSearchText, setIsSearchText] =  React.useState((data.isSearchText == false || data.isSearchGraphData || data.isSearchingGraphRating) ? false : true);
  const [fileName, setFileName] =  React.useState("");
  const [isSubmittingCSV, setIsSubmittingCSV] =  React.useState(false);
  const [isSubmittingAddPR, setIsSubmittingAddPR] =  React.useState(false);
  const [customers, setCustomers] = React.useState(data.customers ? data.customers : []);
  const [selectClient, setSelectClient] =  React.useState(data.customers && data.customers.length > 0 ? "All client" : "Empty client");
  const [csvRowsUploaded, setCsvRowsUploaded] =  React.useState(0);

  const month = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]
  const getMonth = (date: string) => {
    return month[new Date(date).getMonth()]
  }
  const isFetcherSubmitting = fetcher.state === "submitting"

  const handleSelectedCustomer2 = (id: string) => {
    // console.log("handleSelectedCustomer2: ", id)
    setSearchData(prevValues => ({
      ...searchData,
      customerId: id,
    }))
    setPressreleases([])
    setPaginationData({ queryParam: "", limitParam: 0, pageParam: 0, totalItems: 0, totalPages: 0, paginationItems: [], customQueryParam: ""});
  };

  const handleSelectedAgent = (id: string) => {
    console.log("handleSelectedAgent: ", id)
    setSearchData(prevValues => ({
      ...searchData,
      agentId: id,
    }))
    
    const formData = new FormData();
    formData.set("selectedAgentId", id)
    formData.set("isSearchingAgentCustomers", "1")
    fetcher.submit(formData) //submet to get the customers of the selected agent
    setPressreleases([])
    setPaginationData({ queryParam: "", limitParam: 0, pageParam: 0, totalItems: 0, totalPages: 0, paginationItems: [], customQueryParam: ""});
  };


  const handleSearchText = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target    
    setSearchData(prevValues => ({
        ...searchData,
        searchText: value,
      }))
  };

  const handleSelectColumn = (selected:any) => {    
    setSearchData(prevValues => ({
      ...searchData,
      searchColumn: selected.target.value,
    }))
  };

  const handleSearch = () => {
    const formData = new FormData(formRef2.current!);
    formData.set("selectedCustomerId", searchData.customerId)
    formData.set("selectedAgentId", searchData.agentId)
    fetcher.submit(formData)
  };

  const handleUpdatePageRowLimit = (selected:any) => {
    const formData = new FormData(formRef2.current!);
    
    formData.set("selectedCustomerId", searchData.customerId)
    formData.set("selectedAgentId", searchData.agentId)

    formData.set("changePageRowLimit", selected.target.value)
    formData.set("isBtnSearch", "1")
    fetcher.submit(formData)
  };

  const handleDowloadResult = async () => {
    if (pressreleases.length && csvLink ) {
      await processCsvFormat(pressreleases);
      csvLink.current!.link!.click()
    }
  };


  const getCustomerName = (customerId:string) => {
    if (data.customers) {
      return data.customers.map((c:any) => {
        if (c.id == customerId) {
          return c.fullname;
        }
      }).filter(function( element:any ) {
          return element !== undefined;
      }).toString();
    } else {
      return "";
    }
  }

  const getUserName = (id:string) => {
    if (data.agents) {
      return data.agents.map((c:any) => {
        if (c.id == id) {
          return c.fullname;
        }
      }).filter(function( element:any ) {
          return element !== undefined;
      }).toString();
    } else {
      return "";
    }
  }

  const notify = (msg:string) => msg ? toast(msg) : toast("Successfully saved");
  const notifyError = (e:string) => toast.error(e ? e : "Something went wrong!");

  const processCsvFormat = (pr:Pressrelease[]) => {
    if (pr && pr.length) {    
      const p = pr.map (p => {
        return {
          "clientName": p?.customerId ?  p.customer?.fullname : "",
          "clientId": p?.customerId ? p?.customerId.toString() : "",
          "dateRelease": p?.dateRelease.toString().substring(0, 10),
          "brand": p?.brand ? p?.brand.toString() : "",
          "publication": p?.publication ? p?.publication.toString() : "",
          "potentialReach": p?.potentialReach ?? 0,
          "score": p?.score ?? 0,
          "link": p?.link ? p?.link.toString() : "",
          "linkClicks": p?.linkClicks ?? 0   
        }  
      })
      // console.log('p: ', p)
      setPressreleasesCSV(p);
    } else {
      setPressreleasesCSV([]);
    }
  }
  
  React.useEffect(() => {
    // console.log('useEffect-fetcher0: ', fetcher)
    if (fetcher.data && fetcher.data?.pressreleases) {
      // console.log('useEffect-fetcher.data: ', fetcher.data)
      setPressreleases(fetcher.data.pressreleases);
      let {queryParam, limitParam, pageParam, totalItems, totalPages, paginationItems, customQueryParam} = fetcher.data;
      setSearchData(prevValues => ({
        ...searchData,
        agentId: fetcher.data.agentId ?? "0",
        customerId: fetcher.data.customerId ?? "0",
        text: fetcher.data.searchText ?? "",
      }))
      setIsSearchDate(fetcher.data.isSearchDate) 
      setIsSearchText((fetcher.data.isSearchText == false || fetcher.data.isSearchGraphData || fetcher.data.isSearchingGraphRating) ? false : true)
      setPaginationData({ queryParam, limitParam, pageParam, totalItems, totalPages, paginationItems, customQueryParam});
      // let {queryParam, limitParam, pageParam, totalItems, totalPages, paginationItems} = data;
      // setPaginationData({ queryParam, limitParam, pageParam, totalItems, totalPages, paginationItems});
    } else if (fetcher.data && fetcher.data?.ok ){
      setIsSubmittingCSV(false)
      notify(fetcher.data?.csvRowsInserted + " of " + csvRowsUploaded + " rows uploaded successfully")
    } else if (fetcher.data && fetcher.data?.ok == false ){
      notifyError(fetcher?.data?.message)
    } else if (fetcher.data && fetcher.data.customers){
      // console.log('fetcher.data.customers2: ', fetcher.data.customers)
      setCustomers(fetcher.data.customers)
      setSelectClient(fetcher.data.customers.length > 0 ? "All client" : "Empty client")
    }
     
  },[fetcher.data])

  React.useEffect(() => {
    if (data.pressreleases.length) {
      // console.log('data: ', data)
      setPressreleases(data.pressreleases);
      setSearchData(prevValues => ({
        ...searchData,
        customerId: data.customerId ?? "0",
      }))
      setHasInitialized(true);
      let {queryParam, limitParam, pageParam, totalItems, totalPages, paginationItems, customQueryParam} = data;
      setPaginationData({ queryParam, limitParam, pageParam, totalItems, totalPages, paginationItems, customQueryParam});
    }
  },[data])

  const handleFileUpload = ( e: React.ChangeEvent<HTMLInputElement> ) => {
    if (e.target.files) {
      const file = e.target.files[0];
      setIsSubmittingCSV(true)
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        encoding: "ISO-8859-1",
        skipEmptyLines: true,
        transformHeader:function(h:any) {
          return h.trim();
        },
        complete: (results: any) => {       
          if (results.data && results.data.length && results.data[0].hasOwnProperty("clientId") && results.data[0].hasOwnProperty("dateRelease") && 
            results.data[0].hasOwnProperty("brand") && results.data[0].hasOwnProperty("publication") && results.data[0].hasOwnProperty("potentialReach") && 
            results.data[0].hasOwnProperty("score") && results.data[0].hasOwnProperty("link") && results.data[0].hasOwnProperty("linkClicks")) {

            try {
              let data = results.data.map((p:any) => {
                let d = p?.dateRelease ?  new Date(p.dateRelease) : new Date();
                if (userData?.id && p?.clientId && d) {                   
                  return {
                    "clientId": p?.clientId,
                    "dateRelease": d,
                    "brand": p?.brand ? p?.brand.toString() : "",
                    "publication": p?.publication ? p?.publication.toString() : "",
                    "potentialReach": parseInt(p?.potentialReach ?? "0"),
                    "score": parseInt(p?.score ?? "0"),
                    "link": p?.link ? p?.link.toString() : "",
                    "linkClicks": parseInt(p?.linkClicks ?? "0"),
                  }
                } else {
                  throw new Error("Please check either user id, client id or date released if missing in the records.");
                }
              })

              data = data.filter(function( element:any ) {
                  return element !== undefined;
              });

              // console.log("handleFileUpload-after: ",data)
              fetcher.submit({pr: data}, { method: "post", encType: "application/json"});
              setCsvRowsUploaded(data.length)
              setFileName("")      
              setIsSubmittingCSV(false)
            } catch (e:any) {
              console.log("error: ", e)
              notifyError(e.toString())
              setIsSubmittingCSV(false)
            }

          } else {
            notifyError("Please check either user id, client id or date released if missing in the records.")
          }
        },
      });
    }
  };

  const handleOpenImportFile = () => {
    if (inputFileRef && inputFileRef.current) {
      inputFileRef.current.click();
    }
  };
  
  return (
    <div className="app-container">
      <header className="app-header">
        <div>
          <h2>Performance</h2>
        </div>
      </header>

      <section className="app-section">
        <ToastContainer />
        <fetcher.Form  ref={formRef2} id="searchForm" action="/user/pressreleases" method="post"  className="inline ">  
        { (data.userTypeId == 1 || data.userTypeId == 2) && ( 
          <div className="mt-4 w-full lg:flex md:flex-none">
            <div className="lg:w-1/3 md:w-1/2">
              <label className="text-xs sm:text-base lg:mx-5 md:mr-5 md:mr-2 sm:mr-2 font-medium text-gray-900 dark:text-white inline-block">Agent:</label> 
              <div className="xl:w-60 lg:w-52 md:w-48 inline-block">
                <Dropdown
                  id='person'
                  title='Select agents'
                  data={data.agents}
                  hasImage
                  className=''
                  style=''
                  selectedId='0'
                  onSelect={handleSelectedAgent}
                  defaultItem={{id:"0", fullname: 'All agents', profilePicUrl: ""}}
                />
              </div>
            </div>
          </div> )
        }
        { (data.userTypeId < 4) && ( 
          <div className="mt-4 w-full lg:flex md:flex-none">
              <div className="lg:w-1/3 md:w-1/2">
                <label className="text-xs sm:text-base lg:mx-5 md:mr-5 md:mr-2 sm:mr-2 font-medium text-gray-900 dark:text-white inline-block">Client:</label>
                <div className="xl:w-60 lg:w-52 md:w-48 inline-block">
                  <Dropdown
                    id='person'
                    title={selectClient}
                    data={customers}
                    hasImage
                    className=''
                    style=''
                    selectedId='0'
                    onSelect={handleSelectedCustomer2}
                    defaultItem={{id:"0", fullname: selectClient, profilePicUrl: ""}}
                  />
                </div>
              </div>  
            { data.userTypeId == 3 && ( 
            <div className="lg:w-1/2 sm-1/1 mt-2">                     
                <fetcher.Form method="POST" action={`/user/pressrelease/create`} className="inline mr-4"> 
                    <ButtonLoading type="submit" variant="default" size="default" loadingText="Adding" isLoading={isFetcherSubmitting && isSubmittingCSV == false}>
                      <IconMatch icon="plus" />
                      <span>Add Coverage</span>
                    </ButtonLoading> 
                </fetcher.Form>
                
                <Button type="button" onClick={handleOpenImportFile} disabled={isSubmittingCSV} className="mr-3"><IconMatch icon="arrow-square-in" />{isSubmittingCSV ? 'Importing..' : 'Import CSV'}</Button>
                <input id="uploadCSVFile" ref={inputFileRef} value={fileName} type="file" accept=".csv" onChange={handleFileUpload} style={{position: "absolute", left: "-999em"}} />                
                <a href="/templates/sampleCSV.csv" className=" text-blue-600 dark:text-blue-500 hover:underline">Sample CSV</a>
            </div>
              )} 
          </div>)
          }

          <input type="hidden" name="isBtnSearch" value="1" />
          <div className="app-section mt-4 w-full ">          
            <div className="flex w-9/12 ">
              <input  type="checkbox" name="isSearchDate" checked={isSearchDate} onChange={()=>setIsSearchDate(!isSearchDate)} className="self-center w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
              <label className="text-xs md:text-base self-center ml-2  md:w-14 lg:w-28 md:mr-2 sm:mr-2"  >
                Search Date:
              </label>
              <div className="self-center lg:w-48 md:40">
                <DatePicker
                  id={"searchDateFrom"}
                  formId={"searchForm"}
                  name="searchDateFrom"
                  className="w-full text-xs md:text-base"
                  required={true}                
                  onSelect={()=>{console.log('')}}
                  _defaultDate={searchData.dateFrom}
                  disabled={!isSearchDate}
                />
              </div>
              <label className="text-xs md:text-base inline-block self-center mx-4 text-center lg:w-16 sm:w-9"  >
                To:
              </label>
              <div className="self-center lg:w-52 md:w-42">
                <DatePicker
                  id={"searchDateTo"}
                  formId={"searchForm"}
                  name="searchDateTo"
                  className="w-full text-xs md:text-base"
                  required={true}                
                  onSelect={()=>{console.log('')}}
                  _defaultDate={searchData.dateTo}
                  disabled={!isSearchDate}
                />
              </div>
            </div>
          </div>
          <div className="app-section mt-4 w-full lg:flex md:flex-none  ">
            
            <div className="flex w-3/5" >
                <input  type="checkbox" name="isSearchText" checked={isSearchText} onChange={()=>setIsSearchText(!isSearchText)} className="self-center w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
                <label className="text-xs md:text-base self-center ml-2 md:w-14 lg:w-28 md:mr-2 sm:mr-2">
                  Search Text:
                </label>
                <div className="lg:w-48 md:w-40 sm:w-32" >
                  <Input              
                    className="w-full text-xs md:text-base"
                    placeholder=""
                    defaultValue={searchData.text ?? ""}  
                    name="searchText"
                    disabled={!isSearchText}  
                    readOnly={!isSearchText}      
                    onChange={handleSearchText}  
                    onKeyDown ={(e:React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => { e.key === 'Enter' && e.preventDefault(); }}
                  />
                </div>
                <label className="text-xs md:text-base md:mr-1 sm:mx-2  self-center inline-block lg:mx-4 md:mx-2 sm:mx-1"   >
                  Column:
                </label>
                <div className="lg:w-52 md:w-40 sm:w-36">
                  <select className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-xs md:text-base rounded-lg focus:ring-blue-500 focus:border-blue-500  p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    name="searchColumn" defaultValue={searchData.column ?? "all"} onChange={handleSelectColumn} disabled={!isSearchText}>
                    <option key="all" value='all'>All column</option>
                    <option key='brand' value='brand'>Campaign</option>
                    <option key='publication' value='publication'>Publication</option>
                    <option key='potentialReach' value='potentialReach'>Potential Reach</option>
                    <option key='score' value='score'>Quality Score</option>
                    <option key='linkClicks' value='linkClicks'>Link Clicks</option>
                  </select> 
                </div>  
              </div>
              <div className="flex lg:w-3/5 sm-1/1">
                <div className="lg:ml-4">
                  <Button type="button" onClick={handleSearch} className="mr-4" disabled={customers.length > 0 ? false : true}><IconMatch icon="magnifying-glass" />Search</Button>
                  <Button type="button" onClick={handleDowloadResult} disabled={pressreleases.length<1}><IconMatch icon="download-simple" />Download Result</Button>
                  { pressreleasesCSV.length ? <CSVLink data={pressreleasesCSV} filename='result.csv' ref={csvLink} style={{position: "absolute", left: "-999em"}} >Download me</CSVLink> : null }
                </div>
              </div>
          </div>
        </fetcher.Form>  
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg mt-4">
          <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400 rtl:text-right">
            <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
              <tr key="_">
                { userData?.typeId == 2 && searchData.agentId == "0" && customers.length ? <th scope="col" className="px-6 py-3">
                  Agent
                </th> : "" }
                { data.userTypeId <= 3 ? <th scope="col" className="px-6 py-3">
                  Client
                </th> : "" }
                <th scope="col" className="px-3 py-3">
                  Date
                </th>
                <th scope="col" className="px-6 py-3">
                  Campaign
                </th>
                <th scope="col" className="px-6 py-3">
                  Publication
                </th>
                <th scope="col" className="px-3 py-3  text-right">
                  Potential Reach
                </th>
                <th scope="col" className="px-3 py-3 text-right">
                  Quality Score
                </th>
                <th scope="col" className="px-3 py-3 text-right">
                  link Clicks
                </th>
              </tr>
            </thead>
            <tbody>
              { pressreleases.length == 0 ? <tr key="0"> <td colSpan={8} className="text-center p-4">No records found..</td></tr> 
              : pressreleases.map(r => (
                <tr
                  onClick={() => {navigate("../pressreleases/" + r.id)}}
                  className={`border-b bg-white dark:border-gray-700 dark:bg-gray-800 cursor-pointer`}
                >
                  { userData?.typeId == 2 && searchData.agentId == "0" && customers.length ? <td className="px-6 py-4">{getUserName(r.userId)}</td> : null }
                  { data.userTypeId <= 3 ? <td className="px-6 py-4">{r.customer?.fullname}</td> : null }
                  <td className="px-3 py-4">{getMonth(r.dateRelease.toString())}</td>
                  <td className="px-6 py-4">{r.brand}</td>
                  <td className="px-6 py-4">{r.publication}</td>
                  <td className="px-3 py-4 text-right">{r.potentialReach}</td>
                  <td className="px-3 py-4 text-right">{`${r.score}`}</td>
                  <td className="px-3 py-4 text-right">{`${r.linkClicks}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
          { pressreleases.length > 0 && paginationData.totalItems > 0 ? <section className="app-section p-4 relative">
            <PaginationNavigation  {...paginationData} /> 
            <div className="" style={{width: "50px", position: "absolute", right: "15px", top: "8px"}}>
              <select className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500  p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                name="pagingRowLimit" defaultValue={paginationData.limitParam} onChange={handleUpdatePageRowLimit}>
                <option key="15" value='15'>15</option>
                <option key='30' value='30'>30</option>
                <option key='50' value='50'>50</option>
                <option key='75' value='75'>75</option>
                <option key='100' value='100'>100</option>              
              </select> 
            </div>        
          </section> : "" }          
        </div>
      </section>
    </div>
  )
}

export const action = async ({ request }: ActionFunctionArgs) => { 
  let { pr } = await request.json(); 
  const { userId } = await requireUser(request) 
  // let pr = formData.getAll("pr"); 
  // console.log("pr: ", pr)
  if (pr && pr.length && pr[0].hasOwnProperty("clientId") && pr[0].hasOwnProperty("dateRelease") && pr[0].hasOwnProperty("brand") && pr[0].hasOwnProperty("publication") && pr[0].hasOwnProperty("potentialReach") && pr[0].hasOwnProperty("score") && pr[0].hasOwnProperty("link") && pr[0].hasOwnProperty("linkClicks")) {
    try { 
      const data = pr.map(p => {
        // console.log("action-data p: ", p)
        let d = p?.dateRelease ?  new Date(p.dateRelease) : new Date();
        
        return {
          "userId": userId,
          "customerId": p?.clientId,
          "dateRelease": d,
          "brand": p?.brand,
          "publication": p?.publication,
          "potentialReach": parseInt(p?.potentialReach ?? "0"),
          "score": parseInt(p?.score ?? "0"),
          "link": p?.link,
          "linkClicks": parseInt(p?.linkClicks ?? "0"),   
          "isTemp": false,   
        }        
       })
     
      // console.log("action-data: ", data)
    
      const r = await modelPressrelease.createMany(data)
      // console.log("action-data r: ", r)
      return { ok: true, message: r.count + " rows added successfully", csvRowsInserted: r.count };
     } catch (e) {
      return { ok: false, message: "Error while saving! " + e };
     }
     
  } else {
    console.log('format error')
    return { ok: false, message: 'Something went wrong! Please take a look at the csv file for correct format. Please check if the format are correct and all columns are provided specially userId and clientId. Removed extra last line.' };
  }  
}
