import { Cell, Legend, Pie, PieChart } from "recharts"
import { useNavigate } from "@remix-run/react"
// import React from "react"

export function PieGraph({
  data,
  campaign,
  dataKey,
  groupValueNames,
  className = "",
  title = "",
  width = 400,
  height = 270,
  barSize = 20,
  showLegend = true,
  colors,
  customerId = "",
  agentId = "",
  handleSelectCampaign,
  selectedCampaign = "0",
}: {
  data: any
  campaign: any
  dataKey: string[]
  groupValueNames: string[]
  className?: string
  title?: string
  width?: number
  height?: number
  barSize?: number
  showLegend?: boolean
  colors: string[]
  customerId?: string
  agentId?: string
  handleSelectCampaign: any
  selectedCampaign?: string
}) {

  let navigate = useNavigate()
  const RADIAN = Math.PI / 180
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    index,
    value,
  }: {
    cx: number
    cy: number
    midAngle: number
    innerRadius: number
    outerRadius: number
    percent: number
    index: number
    value: any
  }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.3
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
      >
     {data[index].name} ({value})
      </text>
    )
  }

  const onPieClick = (index:any, data:any) => {
    const redirect = "../pressreleases?isSearching=1&isSearchingGraphRating=1&graphRating=" + (data + 1) + "&searchCustomerId=" + customerId + "&searchAgentId=" + agentId + "&campaign=" + selectedCampaign + "&isFindingCampaign=" + (selectedCampaign != "0" ? "1" : "0");
    console.log("redirect: ", redirect)
    navigate(redirect)
  }

  return (
    <div className={className}>
      <PieChart width={width} height={height}>
        {data.length ? <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomizedLabel}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          onClick={onPieClick}
        >
          {data.map((entry: number, index: number) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie> : <></> }
        {showLegend ? <Legend verticalAlign="bottom" align="center" /> : null}
      </PieChart>
    </div>
  )
}
