import { Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { useNavigate } from "@remix-run/react"
import { IconMatch } from "~/components/libs/icon"


export function BarGraph({
  id,
  data,
  dataKey,
  groupValueNames,
  className = "",
  title = "",
  width = 400,
  height = 250,
  barSize = 18,
  showLegend = true,
  customerId = "",
  agentId="",
  kiloFormat = false,
  setYMax=0,
  setYMin=0,
  toolTip = "",
  isLog = false,
  margin = {top: 5, right: 15, bottom: 5, left: 5},
}: {
  id?: string
  data: any
  dataKey: string[]
  groupValueNames: string[]
  className?: string
  title?: string
  width?: number
  height?: number
  barSize?: number
  showLegend?: boolean
  customerId?: string,
  agentId?: string,
  kiloFormat?: boolean,
  setYMax?:number,
  setYMin?:number,
  toolTip?: string,
  isLog?: boolean,
  margin?: object,
}) {
  let navigate = useNavigate()
  const colorName = ["#00535C", "#CD840E"]
  const scaleType = isLog ? "logarithmic" : "auto";

  function getDateStartMonth(mon:string){
    return new Date(Date.parse(mon +" 1, " + new Date().getFullYear()))
  }

  function getDateEndMonth(mon:string){
    let d = new Date(new Date(Date.parse(mon +" 1, " + new Date().getFullYear())).getFullYear(), getDateStartMonth(mon).getMonth() + 1);
    return new Date(d.getTime() - 1000);
  }

  function NewlineText(text:string) {
    return text.split('\n').map(str => <p>{str}</p>);
  }

  const redirect = (data:any, index:any) => {
    const dFrom = getDateStartMonth(data.date).toISOString();
    const dTo = getDateEndMonth(data.date).toISOString();
    const to = "../pressreleases?isSearching=1&isSearchGraphData=1&isSearchDate=1&isSearchBarData=1&searchCustomerId=" + customerId + "&selectedAgentId=" + agentId + "&searchDateFrom=" + dFrom + "&searchDateTo=" + dTo;
    // console.log('to: ', to)
    navigate(to)
  }

  const formatter = (value:any) => new Intl.NumberFormat('en-US').format(kiloFormat ? value/1000 : value) + (kiloFormat ? 'K' : '');
  
  return (
    <>
      <div className="font-semibold block group relative flex justify-center">{title} { toolTip.length ? 
         <>
          <IconMatch icon="question" className="mt-1 ml-1" />
            <span className="absolute top-10 scale-0 rounded bg-gray-800 p-2 text-xs text-white group-hover:scale-100 z-50"> {NewlineText(toolTip)}</span>
         </>
        : null}</div>
      <ResponsiveContainer minWidth={width} height={height}>
        { data.length ? <BarChart data={data} id={id}  margin={margin}>
          <CartesianGrid strokeDasharray="1 1" />
          <XAxis dataKey="name" interval={0} />
          <YAxis scale={isLog ? 'log' : 'auto'} domain={[setYMin, setYMax == 0 ? 'auto' : setYMax]} allowDecimals={false} tickFormatter={formatter} type='number' allowDataOverflow={true} dataKey={dataKey[0]} />
          <Tooltip />
          {showLegend ? <Legend /> : ""}
          {dataKey.map((n, i) => (
            <Bar key={id + '_' + i} dataKey={n} name={groupValueNames[i]} fill={colorName[i]} barSize={barSize} 
              onClick={redirect}
              />
          ))}
        </BarChart> : <></> }
      </ResponsiveContainer>
    </>
  )
}
