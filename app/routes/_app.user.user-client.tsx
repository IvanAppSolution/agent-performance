import * as React from "react"
import { parse } from "@conform-to/zod"
import { json, type LoaderFunctionArgs, type ActionFunctionArgs, type MetaFunction } from "@remix-run/node"
import { Form, useLoaderData, useNavigate, useNavigation, useFetcher, useRevalidator, useActionData } from "@remix-run/react"
import { schemaGeneralId } from "~/schemas/general"
import { createMeta } from "~/utils/meta"
import { createSitemap } from "~/utils/sitemap"
import { db } from "~/libs/db.server"
import Select from 'react-select';
import { Button } from "~/components/ui/button"
import { ButtonLoading } from "~/components/ui/button-loading"
import { modelUserCustomers } from "~/models/user-customer.server"
import { IconMatch } from "~/components/libs/icon"
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export const handle = createSitemap()

export const meta: MetaFunction = () => createMeta({ title: `Settings`, description: `Admin settings` })

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");  
  
  if (userId) {
    const where3 = { userId: userId } 

    const [userCustomers] = await db.$transaction([
      db.userCustomers.findMany({
        where: where3
      }),
    ])

    // console.log('userCustomers: ', userCustomers)
    return json({
      agents: null,
      customers: null,
      userCustomers: userCustomers
    })

  }

  const where = { isActive: true, typeId: 3 } 
  const where2 = { isActive: true, typeId: 4 } 

  const [agents] = await db.$transaction([
    db.user.findMany({
      where
    }),
  ])

  const [customers] = await db.$transaction([
    db.user.findMany({
      where: where2
    }),
  ])

  return json({
    agents,
    customers,
    userCustomers: null
  })
}
 
interface Selected {
  value: string;
  label: string;
  toString: string;
}

export default function UserUserClientRoute() {
  // const { agents, customers, userCustomers } = useLoaderData<typeof loader>()
  let data = useLoaderData<typeof loader>()
  const navigation = useNavigation()
  const navigate = useNavigate()
  const fetcher = useFetcher<typeof loader>();
  const isSubmitting = navigation.state === "submitting"
  // const [intent, setIntent] = React.useState("create")
  const [isFetching, setIsFetching] = React.useState(false)
  let actionData = useActionData<typeof action>()
  // const [_userCustomers, set_userCustomers] = React.useState("create")

  const revalidator = useRevalidator();
  
  const agentOption = data.agents!.map(item => {
    const container = {value: "", label:"", toString: ""};

    container["value"] = item.id; 
    container["label"] = item.fullname; 
    container["toString"] = item.id; 

    return container;
  })

  const customerOption = data.customers!.map(item => {
    const container = {value: "", label:"", toString: ""};

    container["value"] = item.id; 
    container["label"] = item.fullname; 
    container["toString"] = item.id; 

    return container;
  })

  

  // console.log('agentOption: ', agentOption)

  let [selectedOption, setSelectedOption] = React.useState<Selected>();  
  let [selectedOption2, setSelectedOption2] = React.useState<Selected[]>([]);  
 
  const handleChange = async (selected:any) => {
    // console.log('selected.value: ', selected.value)
    // let v = "clt5mgwbs0000b1yk4zz22nil"
    // fetcher.load(`?userId=${v}`);
    
    // revalidator.revalidate()
    setSelectedOption(selected);
    // const inFlightCount = fetcher.formData?.get("quantity") || 0
    setIsFetching(!isFetching)
    fetcher.load(`?userId=${selected.value}`);
    // const result = await fetcher.formData?.get("?userId=clt5mgwbs0000b1yk4zz22nil")
    // revalidator.revalidate()

  };

  const handleChange2 = (selected:any) => {
    setSelectedOption2(selected);
  };

  const notify = () => toast("Successfully saved");
 
  React.useEffect(() => {    
    if (fetcher.data && fetcher.data.userCustomers?.length) {
      console.log('update customers')

      let selOption:Selected[] = []
      fetcher.data.userCustomers!.map(item => {
        let container:Selected = {value: "", label:"", toString: ""};
    
        const c = data.customers!.filter(c => c.id == item.customerId); 
        if (c) {
          container["value"] = item.customerId; 
          container["label"] = c[0]!.fullname

          selOption.push(container);
        }
    
        
      })
      
      setSelectedOption2(selOption)
      
    } 
    else {
      setSelectedOption2([])
    }
 
     
  },[fetcher.data])

  React.useEffect(() => {
    if (actionData && actionData?.ok) {
      notify()
    }
     
  },[actionData]) 

  return (
    <div className="app-container" >
      <header className="app-header">
        <div>
          <h2>Agent Client Management</h2>
          <p>Assign team members to an account.</p>
        </div>
      </header>


      <section className="app-section" >
        <ToastContainer />
        <Form  method="POST" >
          <div style={{ width: 400 }} className="remove-input-txt-border">
            <label onClick={handleChange} className="ml-2 mb-1 block text-sm font-medium text-gray-900 dark:text-white">
              Select Agent
            </label>
            <Select
              id="long-value-select"
              instanceId="long-value-select"
              className="my-react-select-container"
              classNamePrefix="my-react-select"
              name="userId"
              value={selectedOption}
              onChange={handleChange}
              options={agentOption}
              isSearchable 
              isClearable
            />
          </div>
  
          <div style={{ width: 400, marginTop: '20px' }} className="remove-input-txt-border">
              <label className="ml-2 mb-1 block text-sm font-medium text-gray-900 dark:text-white">
                Select Client
              </label>
              <Select
                id="long-value-select2"
                instanceId="long-value-select2"
                className="my-react-select-container"
                classNamePrefix="my-react-select"
                name="customerId"
                value={selectedOption2}
                onChange={handleChange2}
                options={customerOption}
                isMulti
                isSearchable 
              />
            </div>
          

          <div style={{ width: 400, marginTop: '20px' }}>
            <ButtonLoading
              variant="default"
              size="sm"
              loadingText="Saving"
              isLoading={isSubmitting}
              icon={<IconMatch icon="floppy-disk" />}
              className="mr-3"
            >
              <span>Save</span>
            </ButtonLoading>

            <Button type="button" variant="outline" size="sm" onClick={() => navigate(-1)} >
              <IconMatch icon="x-circle" />
              <span>Cancel</span>
            </Button> 
          </div>
        </Form>  
      </section>  
    </div>
  )
}

export const action = async ({ request }: ActionFunctionArgs) => { 
  let formData = await request.formData();
  const submission = parse(formData, { schema: schemaGeneralId })
  console.log('formData: ', formData)

 
  let userId = String(formData.get("userId") || "");
  const postedCustomerIds = formData.getAll("customerId") || [];

  if (postedCustomerIds.length) {
    await modelUserCustomers.deleteByUserId({userId})
    await modelUserCustomers.createMany(userId, postedCustomerIds)
  }

  return { ok: true };
}

