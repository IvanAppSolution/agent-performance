import { useNavigate } from "@remix-run/react"

export function QSGraph({
  data,
  className = "",
  title = "",
  customerId = "",
  agentId = "",
}: {
  data: any
  className?: string
  title?: string
  customerId?: string
  agentId?: string
}) {
  let navigate = useNavigate()
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

  function getDateStartMonth(mon:string){
    return new Date(Date.parse(mon +" 1, " + new Date().getFullYear()))
  }

  function getDateEndMonth(mon:string){
    let d = new Date(new Date(Date.parse(mon +" 1, " + new Date().getFullYear())).getFullYear(), getDateStartMonth(mon).getMonth() + 1);
    return new Date(d.getTime() - 1000);
  }

  const handleRowClick = ({customerId, dateString} : {customerId: string, dateString: string}) => {
    const dFrom = getDateStartMonth(dateString).toISOString();
    const dTo = getDateEndMonth(dateString).toISOString();
    navigate("../pressreleases?isSearching=1&isSearchGraphData=1&isSearchDate=1&searchCustomerId=" + customerId + "&searchAgentId=" + agentId + "&searchDateFrom=" + dFrom + "&searchDateTo=" + dTo)
  }

  const handleRowClickRating = ({customerId, dateString, rating} : {customerId: string, dateString: string, rating: number}) => {
    const dFrom = getDateStartMonth(dateString).toISOString();
    const dTo = getDateEndMonth(dateString).toISOString();
    navigate("../pressreleases?isSearching=1&isSearchingGraphRating=1&graphRating=" + rating + "&isSearchDate=1&searchCustomerId=" + customerId + "&searchDateFrom=" + dFrom + "&searchDateTo=" + dTo)
  }

  return (
    <div className={className} style={{ display: "flex", justifyContent: "space-evenly" }}>
      {title ? <p className="font-semibold">{title}</p> : ""}
      <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400 rtl:text-right">
        <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            <th scope="col" className="px-6 py-3">
              QS Breakdown
            </th>
            <th scope="col" className="px-6 py-3">
              3
            </th>
            <th scope="col" className="px-6 py-3">
              2
            </th>
            <th scope="col" className="px-6 py-3">
              1
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((r: any, i: number) => (
            <tr key={i} className="cursor-pointer border-b bg-white dark:border-gray-700 dark:bg-gray-800">
              <td className="px-6 py-4" onClick={() => handleRowClick({customerId, dateString: r?.month ?? ""})}>{r?.month}</td>
              <td className="px-6 py-4" onClick={() => handleRowClickRating({customerId, dateString: r?.month ?? "", rating: 3})}>{r?.score3}</td>
              <td className="px-6 py-4" onClick={() => handleRowClickRating({customerId, dateString: r?.month ?? "", rating: 2})}>{r?.score2}</td>
              <td className="px-6 py-4" onClick={() => handleRowClickRating({customerId, dateString: r?.month ?? "", rating: 1})}>{r?.score1}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
