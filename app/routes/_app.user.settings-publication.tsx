import {
  json,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "@remix-run/node"
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigate,
  useNavigation,
  useParams,
  useSubmit, 
  useFetcher
} from "@remix-run/react"
import * as React from "react"
import { type z } from "zod"
import { conform, useForm, useInputEvent } from "@conform-to/react"
import { requireUser } from "~/helpers/auth"
import { createMeta } from "~/utils/meta"
import { createSitemap } from "~/utils/sitemap" 
import { Input } from "~/components/ui/input"
import { modelOutlet } from "~/models/outlet.server"
import Select, { InputActionMeta } from 'react-select';
import { FormErrors } from "~/components/ui/form"
import { schemaOutlet } from "~/schemas/outlet"
import { getFieldsetConstraint, parse } from "@conform-to/zod"
import { IconMatch } from "~/components/libs/icon"
import { FormDelete } from "~/components/shared/form-delete"
import { FormUpdateField } from "~/components/shared/form-update-field"
import { Button } from "~/components/ui/button"
import { ButtonLink } from "~/components/ui/button-link"
import { ButtonLoading } from "~/components/ui/button-loading"
import { ToastContainer, toast } from 'react-toastify';

export const handle = createSitemap()

export const meta: MetaFunction = () =>
  createMeta({
    title: `User Settings`,
    description: `Manage user account settings`,
  })

  
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const outletName = url.searchParams.get("outletName");
  let outlets:any[] = []; 
  // const {user} = await requireUser(request)
  console.log('outletName: ', outletName)
  if (outletName) {
    outlets = await modelOutlet.findByNameGetAllFields({name: outletName});    
    return json({
        outlets,
    })

  } else {
    return json({
      outlets: [],
    })
  }

  
  
}

interface Selected {
  value: string;
  label: string;
}

export default function setttingsPublicationRoute() {
  const { outlets } = useLoaderData<typeof loader>()
  console.log('FE-outlets: ', outlets)
  const fetcher = useFetcher<typeof loader>();
  const navigation = useNavigation()
  const isSubmitting = navigation.state === "submitting"
  let actionData = useActionData<typeof action>()
  const [outlet, setOutlet] = React.useState({
    id: null,
    name: "",
    email: "",
    phone: "",
    address: "", 
    website: "", 
    twitter: "", 
    mediaType: "", 
    frequency: "", 
    circulation: "", 
    onlineUniqueUsers: "", 
    sectors: "",
    seoRanking: "",
  })
  const [outletOption, setOutletOption] =  React.useState<Selected []>([]) //{value: "", label:"", potentialReach: 0}
  let tempOutletOption = [{value: "", label: "", potentialReach: "0"}];
  let [selectedOutletOption, setSelectedOutletOption] = React.useState<Selected>({
    value: "",
    label: "",
  });

  const [
    form,
    { id, name, email, phone, address, website, twitter, mediaType, frequency, circulation, onlineUniqueUsers, sectors, seoRanking },
  ] = useForm<z.infer<typeof schemaOutlet>>({
    id: "update-outlet",
    lastSubmission: actionData?.submission,
    shouldRevalidate: "onInput",
    constraint: getFieldsetConstraint(schemaOutlet),
    onValidate({ formData }) {
      return parse(formData, { schema: schemaOutlet })
    },
    defaultValue: { ...outlet },
  })
  const navigate = useNavigate()
  const [intent, setIntent] = React.useState("outlet-add");  //outlet-add,m outlet-update, outlet-delete
  const [selectedOutletValue, setSelectedOutletValue ] = React.useState("")
  const handleSelectedOutlet = (selected:any) => {
    if (selected) {
      // console.log('fetcher.data?.outlets: ', fetcher.data?.outlets)
      const o = fetcher.data?.outlets.filter(({name})=>name===selected.value)[0]
      // console.log('selected: ', o)
      setOutlet({
        id: o?.id,
        name: o?.name,
        email: o?.email,
        phone: o?.phone,
        address: o?.address,
        website: o?.website,
        twitter: o?.twitter,
        mediaType: o?.mediaType, 
        frequency: o?.frequency,
        circulation: o?.circulation, 
        onlineUniqueUsers: o?.onlineUniqueUsers,
        sectors: o?.sectors,
        seoRanking: o?.seoRanking,        
      })
      
      setSelectedOutletOption(selected);    
      setIntent("outlet-update")
    } else {
      setSelectedOutletOption({value: "", label: ""});  
     
    }
  };
 

  const onInputChange = (
    inputValue: string,
    { action, prevInputValue }: InputActionMeta
  ) => {
    if (action === 'input-change') {
      fetcher.load(`?outletName=${inputValue}`);
    }
 
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    console.log('handleChange-name: ', name)
    console.log('handleChange-value: ', value)
    setOutlet(prevValues => ({
      ...outlet,
      [name]: value,
    }))
    
    // if (name === email) {

    // }
  }
 
  const handleCreateNew = () => {
    setOutlet({
      id: null,
      name: "",
      email: "",
      phone: "",
      address: "", 
      website: "", 
      twitter: "", 
      mediaType: "", 
      frequency: "", 
      circulation: "", 
      onlineUniqueUsers: "", 
      sectors: "",
      seoRanking: "",
    })

    setSelectedOutletOption({value: "", label: ""}); 
    setSelectedOutletValue("");
    setIntent("outlet-add")
  }
   
  const notify = () => toast("Successfully saved");
  const notifyError = (e:string) => toast.error(e ? e : "Something went wrong!");
  
  React.useEffect(() => {
    console.log('actionData: ', actionData)
    if (actionData && actionData?.ok) {
      notify()
    } else if (actionData && actionData?.ok == false) {
      notifyError(actionData?.message);
    }  
  },[actionData]) 

  React.useEffect(() => {
    console.log('fetcher.data: ', fetcher.data)
    if (fetcher.data && fetcher.data.outlets?.length) {
       
      setOutletOption(fetcher.data.outlets.map(item => {
        let container:Selected = {value: "", label:""};

        container["value"] = item.name; 
        container["label"] = item.name;
        
        return container;
        })        
      );  
    }
  },[fetcher.data])

  return (
    <div className="app-container">
      <header className="app-header justify-between gap-4">
        <div>
          <h2>Publications</h2>
        </div>
      </header>

      <section className="app-section mt-4">
        <ToastContainer />
        <Form replace method="POST" {...form.props}>
          {/* { intent === "outlet-update" ? <input type="hidden" {...conform.input(id)} /> : "" } */}
          <input type="hidden" {...conform.input(id)} />
          <div className="flex max-w-xs flex-col remove-input-txt-border">
            <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-white">
              Search Publication
            </label>
            
            <Select
              className="my-react-select-container"
              classNamePrefix="my-react-select"
              value={selectedOutletOption} 
              onInputChange={onInputChange}
              onChange={handleSelectedOutlet}
              options={outletOption}
              isClearable
            />
            {/* <FormErrors>{publication}</FormErrors> */}
          </div>
          <div className="mb-4 flex max-w-xs flex-col">
            <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-white">
              <Button type="button" variant="link" onClick={handleCreateNew} style={{color: "blue", padding: "0"}}>Create new</Button>
            </label>
          </div>
          <div className="mb-4 flex max-w-xs flex-col">
            <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-white">
              Name
            </label>
            <Input
              placeholder="Name"
              name="name"
              defaultValue={outlet.name}
              onChange={handleChange}
            />
            {/* <Button variant="link" onClick={handleCreateNew} style={{color: "blue"}}>Create new</Button> */}
            <FormErrors>{name}</FormErrors>
          </div>
          <div className="mb-4 flex max-w-xs flex-col">
            <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-white">
              Email
            </label>
            <Input
              placeholder="Email"
              name="email"
              type="email"
              defaultValue={outlet.email}
              onChange={handleChange}
            />
            <FormErrors>{email}</FormErrors>
          </div>
          <div className="mb-4 flex max-w-xs flex-col">
            <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-white">
              Phone
            </label>
            <Input
              placeholder="Phone"
              name="phone"
              defaultValue={outlet.phone}
              onChange={handleChange}
            />
            <FormErrors>{phone}</FormErrors>
          </div>
          <div className="mb-4 flex max-w-xs flex-col">
            <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-white">
              Address
            </label>
            <Input
              placeholder="Address"
              name="address"
              defaultValue={outlet.address}
              onChange={handleChange}
            />
            <FormErrors>{address}</FormErrors>
          </div>
          <div className="mb-4 flex max-w-xs flex-col">
            <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-white">
            Website
            </label>
            <Input
              placeholder="Website"
              name="website"
              defaultValue={outlet.website}
              onChange={handleChange}
            />
            <FormErrors>{website}</FormErrors>
          </div>
          <div className="mb-4 flex max-w-xs flex-col">
            <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-white">
              Twitter
            </label>
            <Input
              placeholder="Twitter"
              name="twitter"
              defaultValue={outlet.twitter}
              onChange={handleChange}
            />
            <FormErrors>{twitter}</FormErrors>
          </div>
          <div className="mb-4 flex max-w-xs flex-col">
            <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-white">
              Media Type
            </label>
            <Input
              placeholder="Media Type"
              name="mediaType"
              defaultValue={outlet.mediaType}
              onChange={handleChange}
            />
            <FormErrors>{mediaType}</FormErrors>
          </div>
          <div className="mb-4 flex max-w-xs flex-col">
            <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-white">
              Frequency
            </label>
            <Input
              placeholder="frequency"
              name="frequency"
              defaultValue={outlet.frequency}
              onChange={handleChange}
            />
            <FormErrors>{frequency}</FormErrors>
          </div>
          
          <div className="mb-4 flex max-w-xs flex-col">
            <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-white">
              Potential Reach / Circulation
            </label>
            <Input
              placeholder="Potential Reach"
              name="circulation"
              defaultValue={outlet.circulation}
              onChange={handleChange}
            />
            <FormErrors>{circulation}</FormErrors>
          </div>
          <div className="mb-4 flex max-w-xs flex-col">
            <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-white">
              Online Unique Users
            </label>
            <Input
              placeholder="Online Unique Users"
              name="onlineUniqueUsers"
              defaultValue={outlet.onlineUniqueUsers}
              onChange={handleChange}
            />
            <FormErrors>{onlineUniqueUsers}</FormErrors>
          </div>
          <div className="mb-4 flex max-w-xs flex-col">
            <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-white">
              Sectors
            </label>
            <Input
              placeholder="Sectors"
              name="sectors"
              defaultValue={outlet.sectors}
              onChange={handleChange}
            />
            <FormErrors>{sectors}</FormErrors>
          </div>
          <div className="mb-4 flex max-w-xs flex-col">
            <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-white">
              SEO Ranking
            </label>
            <Input
              placeholder="seoRanking"
              name="seoRanking"
              defaultValue={outlet.seoRanking}
              onChange={handleChange}
            />
            <FormErrors>{seoRanking}</FormErrors>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ButtonLoading
              type="submit"
              variant="default"
              size="sm"
              loadingText="Saving"
              isLoading={isSubmitting}
              icon={<IconMatch icon="floppy-disk" />}
              name="intent"
              value={intent}
            >
              <span>Save</span>
            </ButtonLoading>
            <FormDelete
              action="/user/settings-publication"
              intentValue="outlet-delete"
              defaultValue={String(outlet.id)}
              itemText={`${outlet.name}`}     
                     
            />
            <Button type="button" variant="outline" size="sm" onClick={()=>navigate(-1)}>
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
  // const { userId } = await requireUser(request)

  // const timer = createTimer()
  const formData = await request.formData()
  // console.log("action formData: ", formData)
  let submission = await parse(formData, {
    async: true,
    schema: schemaOutlet
  })

  // console.log("submission: ", submission)
  let outlet = null;
  if (submission.value && submission.payload.intent === "outlet-add") {
    delete submission.payload.id;
    // console.log("add: ", submission)  
    const r = await modelOutlet.findByName(submission.value?.name);
    if (r.length) {
      return json({ ok: false, submission, outlet, message: "Outlet name is already registered" }, { status: 400 })
    } else {
      outlet = await modelOutlet.create({...submission.payload }) 
    }
    
  } else if (submission.value && submission.payload.intent === "outlet-update") {
    // console.log("update: ", submission)
    outlet = await modelOutlet.update({...submission.value })
  }else if ( submission.payload.intent === "outlet-delete") {
    // console.log("delete: ", submission)
    outlet = await modelOutlet.deleteById({id: parseInt(submission.payload.id!)})
  } else {
    // await timer.delay()
    return json({ ok: false, submission, outlet, message: "Error data" }, { status: 400 })
  }  
  
  // await timer.delay()
  return json({ ok: true, submission, outlet, message: "" }, { status: 200 })
}
