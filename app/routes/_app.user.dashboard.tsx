import { json, type LoaderFunctionArgs, type MetaFunction } from "@remix-run/node"
import { Link, useLoaderData, useFetcher } from "@remix-run/react"
import * as React from "react"
import pkg from 'lodash';
const { groupBy } = pkg;

import {
  getPaginationConfigs,
} from "~/components/shared/pagination-search"
import { AvatarAuto } from "~/components/ui/avatar-auto"
import { Card } from "~/components/ui/card"
import { BarGraph } from "~/components/ui/graph/bar-graph"
import { PieGraph } from "~/components/ui/graph/pie-graph"
import { QSGraph } from "~/components/ui/graph/qs-graph"
import { SummaryGraph } from "~/components/ui/graph/summary-graph"
import { requireUser } from "~/helpers/auth"
import { db } from "~/libs/db.server"
import { createMeta } from "~/utils/meta"
import { createSitemap } from "~/utils/sitemap"
import { modelUser } from "~/models/user.server"
import { modelUserCustomers } from "~/models/user-customer.server"
import { type Pressrelease } from "@prisma/client"
import { useRootLoaderData } from "~/hooks/use-root-loader-data"
import { Dropdown } from "~/components/ui/dropdown"
import { type User } from "@prisma/client"
import { Button } from "~/components/ui/button"
import { IconMatch } from "~/components/libs/icon"
import { number } from "zod";

export const handle = createSitemap()

export const meta: MetaFunction = () =>
  createMeta({
    title: `User Dashboard`,
    description: `Dashboard for personal user`,
  })

export const loader = async ({ request }: LoaderFunctionArgs) => {
  let { user, userId, userTypeId } = await requireUser(request)
  const config = getPaginationConfigs({ request })
  const url = new URL(request.url);
  let agentId = "";

  let selectedAgentId = (url.searchParams.get("selectedAgentId") || url.searchParams.get("searchAgentId"))?? "";
  let isSearchingAgentCustomers = url.searchParams.get("isSearchingAgentCustomers") === "1" ? true : false; 
  let selectedCustomerId = url.searchParams.get("selectedCustomerId") ?? "";  
  // let agentId = url.searchParams.get("selectedAgentId") ?? userId;  
  let findCampaign = url.searchParams.get("findCampaign"); 
  let isFindingCampaign = url.searchParams.get("isFindingCampaign");
  let isSubmitSearch = url.searchParams.get("isSubmitSearch");

  let where = null;
  let customerId = ""; 
  let customers:User[] = [];
  let agents:User[] = [];
  let searchDateFrom = get6MonthsAgo();
  let searchDateTo = new Date();
  
  if (isSearchingAgentCustomers) {
    if (selectedAgentId.length > 1) { //more then one length means selected is actual long string userid else it is 0
      const userCustomers = await modelUserCustomers.getCustomersByUserId({userId:selectedAgentId})
      const customerIds = userCustomers.map((c:any) => (c.customerId))
      customers = await modelUser.getCustomers({ customerIds })
    } else {
      customers = await modelUser.getAllCustomers();
    }
    console.log('RETURN 1') 
    return json({
      user,
      userId,
      userTypeId,
      pressreleases: [],
      customers,
      agents,
      customerId,
      agentId,
      campaign: [],
      isSearchingAgentCustomers,
      isFindingCampaign,
      findCampaign,
      campaignPressrelease: []
    })
  }

  // console.log('customers1: ', customers) 
  if (userTypeId == 2 ) { //userTypeId == 2 is an agent
    if (selectedAgentId.length > 1) { 
      const userCustomers = await modelUserCustomers.getCustomersByUserId({userId:selectedAgentId})
      const customerIds = userCustomers.map((c:any) => (c.customerId))
      customers = await modelUser.getCustomers({ customerIds })    
    
    } else {
      customers = await modelUser.getAllCustomers();
      //if no agent selected set the default agent id to null for manager.
      agentId = "";
    }

    agents = await modelUser.getAgents()

  } else if (userTypeId == 3) { //userTypeId == 2 is an customer
    const userCustomers = await modelUserCustomers.getCustomersByUserId({userId:user.id})
    // console.log('userCustomers: ', userCustomers)
    const customerIds = userCustomers.map(c => (c.customerId))
    customers = await modelUser.getCustomers({ customerIds })
    // console.log('selectedCustomerId: ', selectedCustomerId) 
  } 

  //----------- DEFAULT VIEW DEFAULT QUERIES and SELECT ALL CUSTOMERS PRESSRELEASES --------------//
  if ((selectedAgentId && selectedAgentId.length > 1)) {
    // userId = selectedAgentId;
    agentId = selectedAgentId;
  } else if (selectedAgentId == "0") {
    userId = "0";
    agentId = "0";
  }

  if ( selectedCustomerId && selectedCustomerId.length) {
    customerId = selectedCustomerId;
  } else {
    if (userTypeId == 4) { // user is client
      customerId = userId; //user.selectedCustomerId;
    } else {
      customerId =  "0"; //user.selectedCustomerId ?? | 0 is all customer, empty string is no customer id selected.
    }
    
  }

  // if (userTypeId == 4 || userTypeId == 1) { //user is customer, manager, admin should not filter based pr on userId
  //   userId = ""
  // }

  if (isFindingCampaign) {
    where = {
      AND: [{ 
        dateRelease: {
          gte: searchDateFrom,
          lte: searchDateTo,
        },
        customerId: customerId.length > 1 ? customerId : {},
        userId: agentId.length > 1 ? agentId : {},
        isTemp: false,
        brand: findCampaign ?? null,
      }]
    }
    // console.log('find campaign pr where:', where)
    // console.log('find campaign pr agentid:', agentId)
    const [campaignPressrelease] = await db.$transaction([
      db.pressrelease.findMany({
        where : where,
        orderBy: { dateRelease: "asc" },
      }),
    ])
    console.log('RETURN 2') 
    return json({
      user,
      userId,
      userTypeId,
      pressreleases: [],
      customers,
      agents,
      customerId,
      agentId,
      campaign: [],
      isSearchingAgentCustomers,
      isFindingCampaign,
      findCampaign,
      campaignPressrelease,
    })
  }

    
  where = {
    AND: [{ 
      dateRelease: {
        gte: searchDateFrom,
        lte: searchDateTo,
      },
      customerId: customerId.length > 1 ? customerId : {},
      userId: agentId.length > 1 ? agentId : {},
      isTemp: false,
    }]
  }

  modelUser.updateSelectedCustomerId({id:agentId, selectedCustomerId:customerId ?? ""})
  

  let totalItems = 0;
  let pressreleases:any = [];
  let campaign:any = [];

  if (isSubmitSearch) { // isSubmitSearch is null mean 1st load
    // console.log('isSubmitSearch - where: ', where.AND);
    [totalItems, pressreleases] = await db.$transaction([
      db.pressrelease.count({ where }),
      db.pressrelease.findMany({
        where,
        orderBy: { dateRelease: "asc" },
      }),
    ]);

    campaign = await db.pressrelease.groupBy({
        by: ['brand'],
        _count: {
          _all: true,
          brand: true,
        },
        _sum: {
          score: true,
        },
        orderBy: {
          brand: 'asc',
        },
        where: {
          dateRelease: {
            gte: searchDateFrom,
            lte: searchDateTo,
          },
          customerId: customerId.length > 1 ? customerId : {},
          userId: agentId.length > 1 ? agentId : {},
          isTemp: false,
        },
      })
  }

  console.log('RETURN 3') 
  return json({
    user,
    userId,
    userTypeId,
    pressreleases,
    customers,
    agents,
    customerId,
    agentId,
    campaign,
    isSearchingAgentCustomers,
    isFindingCampaign,
    findCampaign,
    campaignPressrelease: [],
  })
}

// ------------------------------- END OF BE LOADER -----------------------------------------------------//

function get11MonthsAgo(){
  var date = new Date(), y = date.getFullYear(), m = date.getMonth();
  var firstDay = new Date(y, m, 1, 0, 0, 0);
  return new Date(firstDay.setMonth(firstDay.getMonth() - 11));
}

function get6MonthsAgo(){
  var date = new Date(), y = date.getFullYear(), m = date.getMonth();
  var firstDay = new Date(y, m, 1, 0, 0, 0);
  return new Date(firstDay.setMonth(firstDay.getMonth() - 6));
}

interface GroupedMonths {
  [key: number]: Pressrelease;
}

interface GraphData {
  name: string,
  value: number,
  date: string,
}

interface GraphDataQS {
  name: string,
  qst: number,
  qsa: number,
  date: string,
}

interface ScoreValues {
  month: string;
  score1: number;
  score2: number;
  score3: number;
}
interface GroupedData {
  [key: string]: number;
}

interface ScoreValuesByMonths {
  [key: string]: ScoreValues;
}

interface QualityScoresRating {
    name: string;
    value: number;
}


export default function UserDashboardRoute() {
  const data = useLoaderData<typeof loader>()
  // const [pressreleases, setPressreleases] = React.useState(data ? data.pressreleases : []);
  // console.log('data.campaign: ', data.campaign)
  const { userData } = useRootLoaderData() 
  const monthArray = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const monthFullArray = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
  const pieColors = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"]
  let totalCoveragebyMonthData = null;
  const formRef = React.useRef<HTMLFormElement>(null);
  const fetcher = useFetcher<typeof loader>();
  // const [agentId, setAgentId] = React.useState(data.agentId)
  // const [customerId, setCustomerId] = React.useState(data.customerId)
  const [customers, setCustomers] = React.useState(data.customers ? data.customers : []);
  const [campaign, setCampaign] = React.useState(data ? data.campaign : []);  
  const [searchData, setSearchData] =  React.useState({
    customerId: data.customerId ? data.customerId : "", // 0 means select all, '' empty means default and selected nothing yet.
    agentId: data.agentId ? data.agentId : "", // 0 means select all, '' empty means default and selected nothing yet.
    campaign: "0",
  })
  let selClient = "";
  if (userData?.typeId == 3) {
    selClient = (customers.length ? "All client" : "Empty client");
  } else if (userData?.typeId == 2) {
    selClient = (customers.length ? "All client" : "Empty client");
  } 
  // if (userData?.typeId == 4) {
  //   selClient = (customers.length ? "Select client" : "Empty client");
  // }
  
  const [selectClient, setSelectClient] =  React.useState(selClient);
   
  const [dataSummaryYear, setDataSummaryYear] = React.useState({
    atc: 0,
    atr: 0,
  });

  const [dataSummaryMonth, setDataSummaryMonth] = React.useState({
    atc: 0,
    atr: 0,
    atc2: 0,
    atr2: 0,
  });

  const [totalReleaseByMonthData, setTotalReleaseByMonthData] = React.useState([{
      name: monthArray[0],
      value: 0,
    }]);

  const [totalReachByMonthData, setTotalReachByMonthData] = React.useState([{
      name: monthArray[0],
      value: 0,
    }]);  

  const [qualityScores, setQualityScores] = React.useState([{
      name: monthArray[0],
      qsa: 0,
      qst: 0,
    }]); 

  // record for Pie graph
  const [qualityScoresRating, setQualityScoresRating] = React.useState<QualityScoresRating[]>([]); 

  const [qualityScoresRatingAll, setQualityScoresRatingAll] = React.useState<QualityScoresRating[]>([]); 

  let [monthlyTableScore, setMonthlyTableScore] = React.useState<ScoreValues[]>([]); 
 
  function groupDataByMonth(pressreleases:any[])  { //:{ [key: number]: Pressrelease[] }
    // let result: { [key: number]: Pressrelease[] } = {};
    // let result:GroupedMonths = {};
    
    if (pressreleases) {   
      const result = groupBy(pressreleases, ({ dateRelease }) => (new Date(dateRelease).getFullYear() + "-" + new Date(dateRelease).getMonth()))
      // console.log('result: ', result)
      return result;
      // return groupBy(pressreleases, ({ dateRelease }) => new Date(dateRelease).getMonth())
    } else {
      return [];
    }
   
  }


  function extractTotalReleaseByMonth(data: { [key: number]: any[] }) {
    // const groupedData: GroupedData = {};
    let graphData: GraphData[] = [];

    for (const property in data) {
      // console.log(`${property}: ${data[property]}`);
      if (data[property] && data[property]?.length) {
        const d = data[property];
        if (d && d.length) {
          const r = d[0]?.dateRelease;
          const date = new Date(r??'');
          // const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
          // groupedData[monthYear] = d.length;
           
          graphData.push({
            name: monthArray[date.getMonth()] ?? '',
            value: d.length,
            date: monthArray[date.getMonth()] + "-" + date.getFullYear()
          })
        }
        
      }
    }

    return graphData;

  }
    
  function extractPotentialReachByMonth (data: { [key: number]: any[] }): GraphData[] {
    const groupedData: GroupedData = {};
    let graphData: GraphData[] = [];

    for (const property in data) {
      if (data[property] && data[property]?.length) {
        data[property]?.forEach(item => {
          const date = new Date(item.dateRelease);
          const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;          
          if (groupedData[monthYear]) {
              groupedData[monthYear] += item.potentialReach;
          } else {
              groupedData[monthYear] = item.potentialReach;
          }
        })
      }
    }
    // console.log("groupedData: ", groupedData)
    for (const property in groupedData) {
      const date = new Date(property + '-01');
      graphData.push({
        name: monthArray[date.getMonth()] ?? '',
        value: groupedData[property]! ?? 0,
        date: monthArray[date.getMonth()] + "-" + date.getFullYear()
      })
    }
    
    return graphData;
  };


  function extractReleaseScoreByMonth (data: { [key: number]: any[] }): GraphDataQS[] {
    const groupedDataTotalScore: GroupedData = {};
    const groupedDataAvScore: GroupedData = {};
    let graphDataQS: GraphDataQS[] = [];

    let k = 0;
    for (const property in data) {
      if (data[property] && data[property]?.length) {
        data[property]?.forEach(item => {
          const date = new Date(item.dateRelease);
          const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
          if (groupedDataTotalScore[monthYear]) {
            k++;
            groupedDataTotalScore[monthYear] += item.score;
            groupedDataAvScore[monthYear] = parseInt((groupedDataTotalScore[monthYear]! / k).toFixed(1));
          } else {
            k = 1;
            groupedDataTotalScore[monthYear] = item.score;
            groupedDataAvScore[monthYear] = item.score;
          }
        })
      }
    }

    for (const property in groupedDataTotalScore) {
      const date = new Date(property + '-01');
      graphDataQS.push({
        name: monthArray[date.getMonth()] ?? '',
        qst: groupedDataTotalScore[property] ?? 0,
        qsa: groupedDataAvScore[property] ?? 0,
        date: monthArray[date.getMonth()] + "-" + date.getFullYear()
      })
    }
    
    return graphDataQS;
  };


  const extractPercentageRates = (data: { [key: number]: any[] }) => {
    const groupedData: GroupedData = {}; 
    const groupedDataP: GroupedData = {}; 
    let t = 0;

    for (const property in data) {
      if (data[property] && data[property]?.length) {
        data[property]?.forEach(item => {
          t++;
          // const date = new Date(item.dateRelease);
          // const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
          if (typeof groupedData[item.score] !== "undefined" && groupedData[item.score]) {
              groupedData[item.score] +=1;
          } else {
              groupedData[item.score] = 1;
          }
        })
      }
    }
    // Calculate percentage rates 
    // return groupedData;
    Object.keys(groupedData).forEach(key => {
      groupedDataP[key] = (groupedData[key]! / t) * 100;
    });

    return groupedData;
  };

  const extractScoresByMonth = (data: { [key: number]: any[] }) => { 
    let groupedDataByMonths: ScoreValuesByMonths = {}; 
    let t = 0;

    for (const property in data) {
      let groupedData: ScoreValues = {month: '', score1:0, score2: 0, score3:0};
      if (data[property] && data[property]?.length) {
        data[property]?.forEach(item => {
          t++;
          const date = new Date(item.dateRelease);
          const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
          // console.log('monthYear: ', monthYear)
          if (groupedDataByMonths[monthYear]) {
            let updatedData =  Object.assign({}, groupedDataByMonths[monthYear]);
            // console.log('updatedData: ', updatedData)
            if (updatedData && item.score == 1) {
              updatedData.score1! += 1;
            } else if (updatedData &&  item.score == 2) {
              updatedData.score2! += 1;
            } else if (updatedData && item.score == 3) {
              updatedData.score3! += 1;
            }

            updatedData.month = monthFullArray[date.getMonth()]! + " " + date.getFullYear()           
            groupedDataByMonths[monthYear] = updatedData!;

          } else {

            groupedData.score1 = 0;
            groupedData.score2 = 0;
            groupedData.score3 = 0;

            if (item.score == 1) {
              groupedData.score1 += 1;
            } else if (item.score == 2) {
              groupedData.score2 += 1;
            } else if (item.score == 3) {
              groupedData.score3 += 1;
            }

            groupedData.month = monthFullArray[date.getMonth()]! + " " + date.getFullYear()
            // console.log('groupedData: ', groupedData)
            groupedDataByMonths[monthYear] = groupedData;
          }
          
        })
      }
    }

    return groupedDataByMonths;
  };

  const handleSelectedAgent = (id: string) => {
    // console.log('handleSelectedAgent: ', id)
    setSearchData(prevValues => ({
      ...searchData,
      agentId: id,
      // customerId: "0"
    }))
    const formData = new FormData();
    formData.set("selectedAgentId", id)
    formData.set("selectedCustomerId", "0")
    formData.set("isSearchingAgentCustomers", "1")

    fetcher.submit(formData)
  };

  const handleSelectedCustomer = (id: string) => {
    setSearchData(prevValues => ({
      ...searchData,
      customerId: id,
    }))
    const formData = new FormData();
    formData.set("selectedAgentId", searchData.agentId)
    formData.set("selectedCustomerId", id)
    formData.set("isSubmitSearch", "1")

    if (userData?.typeId == 2 && searchData.agentId != "") {
      // fetcher.submit(formData)
    } else if (userData?.typeId == 3 || userData?.typeId == 4) {
      fetcher.submit(formData)
    }
    
  };

  const handleSelectCampaign = (selected:any) => {
    if (selected.target.value == "0") {
      setQualityScoresRating(obj => (qualityScoresRatingAll))
      return;
    }

    setSearchData(prevValues => ({
      ...searchData,
      campaign: selected.target.value,
    }))

    const formData = new FormData();
    formData.set("isFindingCampaign", "1")
    formData.set("findCampaign", selected.target.value)
    formData.set("selectedCustomerId", searchData.customerId)
    formData.set("selectedAgentId", searchData.agentId)
    fetcher.submit(formData)
  };

  const handleSearch = () => {
    const formData = new FormData();
    formData.set("isSubmitSearch", "1")
    formData.set("selectedAgentId", searchData.agentId)
    formData.set("selectedCustomerId", searchData.customerId)
    fetcher.submit(formData)
  }

  //Trigger 1st load
  React.useEffect(()=>{
    if (userData?.typeId == 3 || userData?.typeId == 4) {
      console.log("trigger 1st load..")
      const formData = new FormData();
      formData.set("isSubmitSearch", "1")
      formData.set("selectedAgentId", searchData.agentId)
      formData.set("selectedCustomerId", searchData.customerId)
      fetcher.submit(formData)
    }
    // console.log('qualityScoresRating: ', qualityScoresRating)
  },[])

  React.useEffect(() => {
    // console.log('useEffect-data?.pressreleases: ', data?.pressreleases)
    // console.log('useEffect-fetcher.data: ', fetcher.data)
    let d:any[] = [];
    let campaignRelease:any[] = [];

    if (fetcher.data && fetcher.data?.pressreleases.length) {
      // console.log("fetcher.data?.pressreleases.length:", fetcher.data?.pressreleases.length) 
      d = fetcher.data?.pressreleases
      setCampaign(fetcher.data?.campaign)

      setSearchData({
        customerId: fetcher.data?.customerId ?? "0",
        agentId: fetcher.data?.agentId ?? "0",
        campaign: fetcher.data?.findCampaign ?? "0",
      })

      if (userData?.typeId == 2) {
        setSelectClient(fetcher.data?.customers.length ? "Select client" : "Empty client");
      }
       
    } else if (fetcher.data?.isFindingCampaign) {
      // console.log("find-campaign fetcher.data.campaignPressrelease:", fetcher.data.campaignPressrelease)    
      let gdata = groupDataByMonth(fetcher.data.campaignPressrelease) ?? [];  
      // console.log("find-campaign gdata:", gdata)    
      const gd = extractPercentageRates(gdata);
      // console.log("find-campaign gd:", gd)    
      setQualityScoresRating([
        {
          name: "1",
          value: gd[1] || 0,
        },
        {
          name: "2",
          value: gd[2] || 0,
        },
        {
          name: "3",
          value: gd[3] || 0,
        },
      ])

      return;

    } else if (fetcher.data?.isSearchingAgentCustomers) {   
      setCustomers(fetcher.data?.customers);
      setSelectClient(fetcher.data?.customers.length ? "Select client" : "Empty client");
      setSearchData(prevValues => ({
        ...searchData,
        customerId: fetcher.data?.customers.length ? "0" : "",
      }))
      return;

    } else {
      // d = data?.pressreleases;
      console.log("No record found!")
      return;
    }

    // console.log('d: ', d)
    let gdata = groupDataByMonth(d) ?? [];
    // console.log('grouped data: ', gdata)

    let totalReleaseByMonthData = extractTotalReleaseByMonth(gdata);
    // console.log('totalReleaseByMonth: ', totalReleaseByMonthData)
    setTotalReleaseByMonthData(totalReleaseByMonthData)

    let totalReachByMonthData  = extractPotentialReachByMonth(gdata)
    // console.log('totalReachByMonthData: ', totalReachByMonthData)      
    setTotalReachByMonthData(totalReachByMonthData)

    const atc = totalReleaseByMonthData.reduce((acc, currentValue) => acc + currentValue.value, 0);
    const atr = totalReachByMonthData.reduce((acc, currentValue) => acc + currentValue.value, 0);

    setDataSummaryYear({atr, atc})


    setDataSummaryMonth({
      atr: totalReachByMonthData[totalReachByMonthData.length - 1]?.value!, 
      atc: totalReleaseByMonthData[totalReleaseByMonthData.length - 1]?.value!, 
      atr2: totalReachByMonthData[totalReachByMonthData.length - 2]?.value!, 
      atc2: totalReleaseByMonthData[totalReleaseByMonthData.length - 2]?.value!, 
    })

    let releaseScoreByMonth = extractReleaseScoreByMonth(gdata);
    // console.log('releaseScoreByMonth: ', releaseScoreByMonth)
    setQualityScores(releaseScoreByMonth);
    // console.log('gdata: ', gdata)
    const gd = extractPercentageRates(gdata);
    // console.log('gd-all: ', gd)
    setQualityScoresRatingAll([
      {
        name: "1",
        value: gd[1] || 0,
      },
      {
        name: "2",
        value: gd[2] || 0,
      },
      {
        name: "3",
        value: gd[3] || 0,
      },
    ])

    setQualityScoresRating([
      {
        name: "1",
        value: gd[1] || 0,
      },
      {
        name: "2",
        value: gd[2] || 0,
      },
      {
        name: "3",
        value: gd[3] || 0,
      },
    ])

    let tableOfScore = extractScoresByMonth(gdata)
    // console.log('tableOfScore: ',tableOfScore)
    const entries = Object.entries(tableOfScore);
    // console.log('entries: ',entries)
    // Extract only the values (month objects) from the entries
    const monthsArray:ScoreValues[]  = entries.map(entry => entry[1]);
    // console.log('monthsArray: ',monthsArray)
    // monthlyTableScore = monthsArray
    setMonthlyTableScore(monthsArray.reverse())
  
  }, [fetcher.data])


  return (
    <div className="app-container">
      {data && <header className="app-header items-center gap-4">
        <AvatarAuto user={data.user} imageUrl={data.user?.profilePicUrl ?? ''} />
        <div>
          <h2>
            <span className="hidden lg:inline">Hi, </span>
            {data.user.fullname}
          </h2>
        </div>
      </header> }
      { data && (data.userTypeId == 1 || data.userTypeId == 2) && ( 
              
          <div className=" justify-start app-section mt-4 w-full flex items-center">
            <label className="mr-5 font-medium text-gray-900 dark:text-white  ">Agent :</label> 
              <div className="w-1/3 inline-block">
                <Dropdown
                  id='selectedAgentId'
                  title='Select agent'
                  data={data.agents}
                  hasImage
                  className=''
                  style=''
                  onSelect={handleSelectedAgent}
                  defaultItem={{id:"0", fullname: 'All agent', profilePicUrl: ""}}
                />
              </div> 
          </div>
        )}
        { data && (data.userTypeId == 1 || data.userTypeId == 2 || data.userTypeId == 3) && ( 
          <div className=" justify-start app-section mt-4 w-full flex items-center  ">
            <label className="mr-5 font-medium text-gray-900 dark:text-white  ">Client :</label>
            <div className="w-1/3 inline-block mr-4">
              <Dropdown
                id='selectedCustomerId'
                title={selectClient}
                data={customers}
                hasImage
                className=''
                style=''
                selectedId={searchData.customerId}
                onSelect={handleSelectedCustomer}
                defaultItem={customers.length ? {id:"0", fullname: "All client", profilePicUrl: ""} : {id:"", fullname: "Empty client", profilePicUrl: ""}}
              />
            </div>
            {userData?.typeId == 2 ? <div className="max-w-sm">
                  <Button type="button" onClick={handleSearch} className="mr-4 " disabled={customers.length > 0  ? false : true}><IconMatch icon="magnifying-glass" />Search</Button> 
            </div> : "" }
          </div>
        )} 
      <section className="app-section flex flex-wrap">
        <Card className="sm:w-8/12 md:w-8/12 lg:w-5/12 xl:w-5/12 mt-5 mr-4 rounded-lg border bg-card p-4 text-center text-card-foreground shadow-sm" style={{minWidth:"400px"}}>
          <SummaryGraph title="Annual" data={dataSummaryYear} atcTitle="Total Coverage" atrTitle="Total Reach" className="w-full"  />
        </Card>        
        <Card className="sm:w-8/12 md:w-8/12 lg:w-5/12 xl:w-5/12 mt-5 rounded-lg border bg-card p-4 text-center text-card-foreground shadow-sm" style={{minWidth:"400px"}}>
          <SummaryGraph titleA="Current Month" titleB="Last Month" data={dataSummaryMonth} atcTitle="Coverage" atrTitle="Reach" atcTitle2="Coverage" atrTitle2="Reach" isDoubleRecordDisplay={true} className="w-full"  />
        </Card>
      </section>
    
      <section className="app-section mt-4 flex flex-wrap  border-t-2 border-gray-300">        
        <Card className="sm:w-8/12 md:w-8/12 lg:w-5/12 xl:w-5/12 mt-4 mr-4 rounded-lg border bg-card py-4 text-center text-card-foreground shadow-sm" style={{minWidth:"400px"}}>
          <BarGraph
            id="releaseByMonth"
            data={totalReleaseByMonthData}
            dataKey={["value"]}
            groupValueNames={["value"]}
            className=" "
            title="Total Coverage by Month"
            showLegend={false}
            customerId={searchData.customerId ?? ""}
            agentId={searchData.agentId ?? ""}
          />
        </Card>

        <Card className="sm:w-8/12 md:w-8/12 lg:w-5/12 xl:w-5/12 mt-4 rounded-lg border bg-card py-4 text-center text-card-foreground shadow-sm" style={{minWidth:"400px"}}>
          <BarGraph
            id="reachByMonth"
            data={totalReachByMonthData}
            dataKey={["value"]}
            groupValueNames={["value"]}
            className=" "
            title="Total Reach by Month"
            showLegend={false}
            customerId={searchData.customerId ?? ""}
            agentId={searchData.agentId ?? ""}
            kiloFormat={false}
            isLog={true}
            margin={{left:32}}
            setYMin={1}
            setYMax={300000000}            
          />
        </Card>
      </section>

      <section className="app-section flex flex-wrap mt-4 border-t-2 border-gray-300">
        <Card className="sm:w-8/12 md:w-8/12 lg:w-5/12 xl:w-5/12 mt-4 mr-4 rounded-lg border bg-card py-4 text-center text-card-foreground shadow-sm" style={{minWidth:"400px"}}>
          <BarGraph
            id="tqs"
            data={qualityScores}
            dataKey={["qst"]}
            groupValueNames={["qst"]}
            className=" "
            title="Total Quality Score"
            showLegend={false}
            customerId={searchData.customerId ?? ""}
            agentId={searchData.agentId ?? ""}
            toolTip="The Coverage Quality Score is worked out on 3 criteria.   
            1. Reach / Circulation / suitability of publication and audience    
            2.  Brand message included in the piece    
            3.  Backlink or call to action"
          />
        </Card>

        <Card className="sm:w-8/12 md:w-8/12 lg:w-5/12 xl:w-5/12 mt-4 rounded-lg border bg-card py-4 text-center text-card-foreground shadow-sm" style={{minWidth:"400px"}}>
          <BarGraph
            id="qsa"
            data={qualityScores}
            dataKey={["qsa"]}
            groupValueNames={["qsa"]}
            className=" "
            title="Quality Score Average"
            showLegend={false}
            customerId={searchData.customerId ?? ""}
            agentId={searchData.agentId ?? ""}
            setYMax={3}
            toolTip="The Coverage Quality Score is worked out on 3 criteria.   
            1. Reach / Circulation / suitability of publication and audience    
            2.  Brand message included in the piece    
            3.  Backlink or call to action"
          />
        </Card>
      </section>

      <section className="app-section flex flex-wrap mt-4 border-t-2 border-gray-300">
        <Card className="sm:w-8/12 md:w-8/12 lg:w-5/12 xl:w-5/12 mt-4 mr-4 rounded-lg border bg-card p-4 text-center text-card-foreground shadow-sm" style={{minWidth:"400px"}}>
          <QSGraph data={monthlyTableScore} className="w-full" title="" customerId={searchData.customerId ?? ""} agentId={searchData.agentId ?? ""} />
        </Card>
        <Card className=" sm:w-8/12 md:w-8/12 lg:w-5/12 xl:w-5/12 mt-4 rounded-lg border bg-card p-4 text-center text-card-foreground shadow-sm" style={{height:"300px", minWidth:"400px"}}>
        <div className="font-semibold m-auto absolute z-50" style={{width: "35%"}}>
          Campaign Quality Score &nbsp;
          <select className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500  p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            value={searchData.campaign}  style={{width: "150px"}} onChange={handleSelectCampaign}>
            <option key="all" value="0" >All</option>
            { campaign && campaign.map((c,i) => (
              <option key={i} value={c.brand || ""} > {c.brand || ""}</option>
              ))
            }
          </select> 
        </div>
          <PieGraph
            data={qualityScoresRating}
            campaign={campaign}
            dataKey={["value"]}
            groupValueNames={["value" ]}
            className="w-full"
            title="Quality Score"
            colors={pieColors}
            customerId={searchData.customerId ?? ""}
            agentId={searchData.agentId ?? ""}
            handleSelectCampaign={handleSelectCampaign}
            selectedCampaign={searchData.campaign} 
          />
        </Card>
         
      </section>
      {/* <section className="app-section mt-4"> --- Use this if adding extra pie chart below the existing pie chart --- </section> */}
      
    </div>
  )
}
