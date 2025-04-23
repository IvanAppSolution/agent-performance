export function SummaryGraph({
  data,
  atcTitle = "",
  atrTitle = "",
  atcTitle2 = "",
  atrTitle2 = "",
  className = "",
  title = "",
  titleA = "",
  titleB = "",
  isDoubleRecordDisplay = false,
}: {
  data: any,
  atcTitle?: string
  atrTitle?: string
  atcTitle2?: string
  atrTitle2?: string
  className?: string
  title?: string
  titleA?: string
  titleB?: string
  isDoubleRecordDisplay?: boolean
}) {
  
  let  classStyleA = "";
  let  classStyleB = "";
  
  if (data?.atr.toString().length == 8){
    classStyleA = "text-2xl"
  } else if (data?.atr.toString().length > 8){
    classStyleA = "text-xl"
  } else {
    classStyleA = "text-3xl"
  }

  if (data?.atr2?.toString().length == 8){
    classStyleB = "text-2xl"
  } else if (data?.atr2?.toString().length > 8){
    classStyleB = "text-xl"
  } else {
    classStyleB = "text-3xl"
  }

  return (
    <div className={className + " font-semibold"}>
      
      
      { isDoubleRecordDisplay ? <>
        {titleA && titleB ? <div className="flex place-content-evenly pr-8 mb-2 underline"><div className=" ">{titleA}</div> <div>{titleB}</div></div> : ""} 
        <div className="flex place-content-evenly">
          <div className="">
            <p>{atcTitle}</p>
            <p className={classStyleA}>{data?.atc ?? 0}</p>
          </div>
          <div>
            <p style={{fontSize:'13px'}}>{atrTitle}</p>
            <p className={classStyleA}>{new Intl.NumberFormat('en-US').format(data?.atr ?? 0)}</p>
          </div>
          
          <div style={{borderRight:"1px solid", height: "63px"}}></div>
          <div>
            <p>{atcTitle2}</p>
            <p className={classStyleB}>{data?.atc2 ?? 0}</p>
          </div>
          <div>
            <p>{atrTitle2}</p>
            <p className={classStyleB}>{new Intl.NumberFormat('en-US').format(data?.atr2 ?? 0)}</p>
          </div>
        </div>  
        </>
      : <>
      {title ? <p className="mb-2 underline">{title}</p> : ""}
      <div className="flex place-content-evenly  ">
        <div>
          <p>{atcTitle}</p>
          <p className="text-3xl">{data?.atc ?? 0}</p>
        </div>
        <div>
          <p>{atrTitle}</p>
          <p className="text-3xl">{new Intl.NumberFormat('en-US').format(data?.atr ?? 0)}</p>
        </div>
      </div>
      </>
      }
    </div>
  )
}
