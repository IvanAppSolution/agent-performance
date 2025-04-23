import { conform, useForm, useInputEvent } from "@conform-to/react"
import { getFieldsetConstraint, parse } from "@conform-to/zod"
import {
  json,
  redirect,
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
  useFetcher,
  Link
} from "@remix-run/react"
import {
  unstable_createMemoryUploadHandler,
  unstable_parseMultipartFormData,
  unstable_createFileUploadHandler,
  unstable_composeUploadHandlers,
} from "@remix-run/node";
import type { NodeOnDiskFile } from "@remix-run/node";
import * as React from "react"
import { useRef, useState } from "react"
import { type z } from "zod"
import Select, { InputActionMeta } from 'react-select';
import { IconMatch } from "~/components/libs/icon"
import { FormDelete } from "~/components/shared/form-delete"
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// import { Button } from "~/components/ui/button"
import { ButtonLink } from "~/components/ui/button-link"
import { ButtonLoading } from "~/components/ui/button-loading"
import { DatePicker } from "~/components/ui/date-picker"
import { FormErrors } from "~/components/ui/form"
import { Input } from "~/components/ui/input"
import { requireUser } from "~/helpers/auth"
import { modelPressrelease } from "~/models/pressrelease.server"
import { schemaPressrelease } from "~/schemas/pressrelease"
import { modelOutlet } from "~/models/outlet.server"
import { invariant, invariantResponse } from "~/utils/invariant"
import { createMeta } from "~/utils/meta"
import { createSitemap } from "~/utils/sitemap"
import { modelUser } from "~/models/user.server"
import { modelUserCustomers } from "~/models/user-customer.server"
import { put } from '@vercel/blob';
// import { installGlobals } from "@remix-run/node";
// installGlobals();
// import PDFViewer from 'pdf-viewer-reactjs'

export const handle = createSitemap()

export const meta: MetaFunction<typeof loader> = ({ params, data }) => {
  const post = data?.pressrelease

  if (!post) {
    return createMeta({
      title: "Post not found",
      description: `Cannot find release with slug ${params.postSlug}`,
      canonicalPath: "/pressreleases",
    })
  }
  return createMeta({
    title: "Create release",
    description: "create release",
    canonicalPath: "/pressreleases",
  })
}

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  invariant(params.id, "params.id unavailable")
  const url = new URL(request.url);
  const outletName = url.searchParams.get("outletName"); 
  let outlets:any[] = []; 
  let { user, userId, userTypeId } = await requireUser(request)
  const defaultPressrelease = {
    id: 0,
    userId: '',
    customerId: '',
    dateRelease: new Date,
    brand: '',
    publication: '',
    potentialReach: 0,
    score: 0,
    link: '',
    linkly: '',
    linkClicks: 0,
    createdAt: new Date,
    updatedAt: new Date,
    isTemp: false,
  }
  
  if (outletName) {
    outlets = await modelOutlet.findByName({name: outletName});
    return json({
      user, pressrelease: defaultPressrelease, userSelectedCustomerId: null, userSelectedCustomerName: "", outlets, customers: [], userTypeId
    })

  }

  let pressrelease = null;
  let customers = null;
  let userSelectedCustomerId = null;
  if (userTypeId == 2 || userTypeId == 3) { //user is agent or manager
    pressrelease = await modelPressrelease.getById({ id: parseInt(params.id)! })
    const userCustomers = await modelUserCustomers.getCustomersByUserId({userId:pressrelease?.userId!})
    const customerIds = userCustomers.map(c => (c.customerId))
    customers = await modelUser.getCustomers({ customerIds })
    // userSelectedCustomerId = user.selectedCustomerId;
  } else { // user is client
    pressrelease = await modelPressrelease.getId({ id: parseInt(params.id)! })
  }  

  outlets = [];
  invariantResponse(pressrelease, "Post not found", { status: 404 })
  return json({ user, pressrelease, userSelectedCustomerId, outlets, customers, userTypeId })
}

interface Selected {
  value: string;
  label: string;
  potentialReach: number;
  onlineUniqueUsers: string;
}

const notifyError = (e:string) => toast.error(e ? e : "Something went wrong!");

function useFileUpload() {
  let { submit, data, state, formData } = useFetcher<typeof action>();
  let isUploading = state !== "idle";

  let uploadingFiles = formData
    ?.getAll("file")
    ?.filter((value: unknown): value is File => value instanceof File)
    .map((file) => {
      let name = file.name;
      // This line is important; it will create an Object URL, which is a `blob:` URL string
      // We'll need this to render the image in the browser as it's being uploaded
      let url = URL.createObjectURL(file);
      return { name, url };
    });
  
  // console.log('isUploading: ',isUploading)
  // console.log('data: ',data)
  let images = (data?.files ?? []).concat(uploadingFiles ?? []);

  return {    
    submit(files: FileList | null) {
      if (!files) return;
      let formData = new FormData();
      for (let file of files) formData.append("file", file);
      submit(formData, { method: "POST", encType: "multipart/form-data"});
    },
    isUploading,
    images,
  };  
}

function Image({ name, url }: { name: string; url: string}) {
  if (url == null || url == "")  return undefined;
  
  // Here we store the object URL in a state to keep it between renders
  let [objectUrl] = useState(() => {
    if (url.startsWith("blob:")) return url;
    return undefined;
  });

  React.useEffect(() => {
    // If there's an objectUrl but the `url` is not a blob anymore, we revoke it
    if (objectUrl && !url.startsWith("blob:")) URL.revokeObjectURL(objectUrl);
  }, [objectUrl, url]);
  

  return (
    <>
      {
        url.toLocaleLowerCase().includes(".pdf") ?
        <Link to={url+"?download=1"}>
          <img
            alt={name}
            src="/images/pdfLogo.jpg"
            width={100}
          />
        </Link>
        :
        <Link to={url+"?download=1"}>
          <img
            alt={name}
            src={url}
            width={320}
            height={240}
            style={{
              // Some styles; here we apply a blur filter when it's being uploaded
              transition: "filter 300ms ease",
              filter: url.startsWith("blob:") ? "blur(4px)" : "blur(0)",
            }}
          />
        </Link>  
      }
    </>
  );
}

export default function UserPressreleasesIdRoute() {
  // const { posts, ...loaderData } = useLoaderData<typeof loader>()
  // const { id } = useParams();
  let actionData = useActionData<typeof action>()
  // let {pressrelease, ...loaderData }   = useLoaderData<typeof loader>();
  const { user, pressrelease, userSelectedCustomerId, outlets, customers, userTypeId } = useLoaderData<typeof loader>()
  const [release, setRelease] = React.useState(pressrelease);  
  const fetcher = useFetcher<typeof loader>();
  // const [outlet, setOutlet] = React.useState(outlets); 
  // console.log("actionResultData: ", actionResultData)
  // console.log("customers: ", customers)   
  // let navigate = useNavigate()
  // let submit = useSubmit()
  const [viewType, setViewType] = React.useState(release.isTemp ? "add" : "edit")
  const formRef = React.useRef<HTMLFormElement>(null)
  const [actionResult, setActionResult] = React.useState({
    success: true,
    message: "Successfully Saved",
  })
  const today = new Date()
  const [selectedDateRelease, setSelectedDateRelease] = React.useState<string>()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === "submitting"
  const [isLoaded, setIsLoaded] = React.useState(false)
  const [isRequesting, setIsRequesting] = React.useState(false)
  const [circulation, setCirculation] = React.useState("")
  const [pReach, setPReach] = React.useState(0)
  const [
    form,
    { id, userId, customerId, dateRelease, brand, publication, potentialReach, score, link, linkly, linkClicks, isTemp },
  ] = useForm<z.infer<typeof schemaPressrelease>>({
    id: "update-pressrelease",
    lastSubmission: actionData?.submission,
    shouldRevalidate: "onInput",
    constraint: getFieldsetConstraint(schemaPressrelease),
    onValidate({ formData }) {
      return parse(formData, { schema: schemaPressrelease })
    },
    defaultValue: { ...pressrelease, userId: pressrelease ? pressrelease.userId! : 0, isTemp: false },
  })
  const dateReleasePickerRef = useRef<HTMLInputElement>(null)
  const dateReleasePickerControl = useInputEvent({ ref: dateReleasePickerRef })

  const [outletOption, setOutletOption] =  React.useState<Selected []>([]) //{value: "", label:"", potentialReach: 0}
  let tempOutletOption = [{value: release.publication, label:release.publication, potentialReach: release.potentialReach}];
  let [selectedOutletOption, setSelectedOutletOption] = React.useState<Selected>();
  const [isFieldReadOnly, setIsFieldReadOnly] = React.useState(userTypeId == 4 ? true : false)
  let { submit, isUploading, images } = useFileUpload();  
  function handleUpdateDateRelease(value: Date) {
    // brandControl.change(brand)
    // console.log("handleUpdateDateRelease: ", value)
    // setRelease(prevValues => ({
    //   ...release,
    //   dateRelease: value,
    // }))
  }
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setRelease(prevValues => ({
      ...release,
      [name]: value,
    }))
  }

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement> ) => {
    const { name, value } = event.target
    setRelease(prevValues => ({
      ...release,
      [name]: value,
    }))
  } 

  const handleSelectedOutlet = (selected:any) => {
    if (selected) {
      console.log('selected: ', selected)
      setSelectedOutletOption(selected);    
      setRelease(prevValues => ({
        ...release,
        potentialReach: selected.potentialReach,
      }))
    } else {
      // console.log('false-selected: ', selected)
      setSelectedOutletOption({value: "", label: "", potentialReach: 0, onlineUniqueUsers: ""});  
      setRelease(prevValues => ({
        ...release,
        potentialReach: 0,
      }))
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

  const getMonth = (value: any) => {
    return month[new Date(value).getMonth()]
  }

  const notify = (msg:string = '') => msg ? toast(msg) : toast("Successfully saved");
  
  const processSubmit = (files:any) => {
    // console.log("size: ",files[0]?.size);
    if (files && files[0]?.size! <= 4.5 * 1024 * 1024) {
      submit(files)
    } else {
      notifyError("Upload file is too large to handle. Please limit to 4.5 mb file size.");
    }   
  }

  React.useEffect(() => {
    if (actionData && actionData?.ok) {
      notify()
    } else if (actionData && actionData?.ok == false) {
      notifyError(actionData.message);
    }  
  },[actionData]) 


  React.useEffect(() => {
    if (fetcher.data && fetcher.data.outlets?.length) {
       
      setOutletOption(fetcher.data.outlets.map(item => {
        let container = {value: "", label:"", potentialReach: 0, onlineUniqueUsers: ""};
        // console.log('item: ', item)
        container["value"] = item.name; 
        container["label"] = item.name;
        container["onlineUniqueUsers"] = item.onlineUniqueUsers;
        if(Number(item.circulation) && !isNaN(item.circulation)) {
          container["potentialReach"] = Number(item.circulation);
        } else {
          container["potentialReach"] = 0;
        }
        // console.log('container: ', container)
        return container;
        })        
      );
      
      setIsRequesting(false)
    }
  },[fetcher.data])

  return (
    <div className="app-container">
      <header className="app-header justify-between gap-4">
        <div>
          <h2>Press Coverage</h2>
        </div>
      </header>

      <section className="app-section">
        <ToastContainer />
        <Form replace method="POST" {...form.props}>
          <input type="hidden" {...conform.input(id)} />
          <input type="hidden" {...conform.input(userId)} />
          <input type="hidden" {...conform.input(isTemp)}/>
          {userTypeId == 4 ? "" : <div className="mb-4 flex max-w-xs flex-col">
            <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-white">
              Client Name
            </label>
            <select {...conform.input(customerId)} className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500  p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                onChange={handleSelectChange} disabled={isFieldReadOnly}
              >
                { customers && customers.map((c:any,i:number) => (
                  <option selected={userSelectedCustomerId === c.id}  key={i} value={c.id} >{c.fullname}</option>
                  ))
                }
              </select> 
          </div> }
          <div className="mb-4 flex max-w-xs flex-col">
            <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-white">
              Client Id
            </label>
            <p className="inline-block">
              {(release.customerId == user.id) ? customers ? customers[0]!.id : "" : release.customerId}
            </p>
            
          </div>
          <div className="mb-4 flex max-w-xs flex-col">            
            <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-white">
              Date of Publication
            </label>
            <DatePicker
              id={form.id + "-dateRelease"}
              formId={form.id!}
              className="w-full"
              required={true}
              name="dateRelease"
              onSelect={handleUpdateDateRelease}
              _defaultDate={new Date(dateRelease.defaultValue ?? "")}
              disabled={isFieldReadOnly}
            />            
            <FormErrors>{dateRelease}</FormErrors>
          </div>
          <div className="mb-4 flex max-w-xs flex-col">
            <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-white">
              Campaign
            </label>
            <Input
              {...conform.input(brand)}
              placeholder="Brand"
              defaultValue={release.brand!}
              onChange={handleChange}
              readOnly={isFieldReadOnly}
            />
            <FormErrors>{brand}</FormErrors>            
          </div>
          <div className="mb-4 flex max-w-xs flex-col remove-input-txt-border">
            <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-white">
              Publication
            </label>
            
            <Select
              className="my-react-select-container"
              classNamePrefix="my-react-select"
              name="publication"
              defaultValue={tempOutletOption}
              onInputChange={onInputChange}
              onChange={handleSelectedOutlet}
              options={outletOption}
              isClearable
              isDisabled={isFieldReadOnly}
            />
            <Link to="/user/settings-publication" className="text-primary underline-offset-4 hover:underline"> Add / Edit Publication</Link>
            <FormErrors>{publication}</FormErrors>
          </div>
          <div className="mb-4 flex max-w-xs flex-col">
            <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-white">
              Potential Reach / Online Users
            </label>
            <Input
              placeholder="Potential Reach"
              name="potentialReach"
              value={release.potentialReach}
              onChange={handleChange}
              readOnly={isFieldReadOnly}
            />
            <label className="">{selectedOutletOption?.onlineUniqueUsers}</label>
            <FormErrors>{potentialReach}</FormErrors>
          </div>
          <div className="mb-4 flex max-w-xs flex-col">
            <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-white">
              Quality Score
            </label> 
            <select disabled={isFieldReadOnly} id="score" name="score" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
              <option selected>Select Score</option>
              <option value="1" selected={release?.score == 1}>1</option>
              <option value="2" selected={release?.score == 2}>2</option>
              <option value="3" selected={release?.score == 3}>3</option>
            </select>
            <FormErrors>{score}</FormErrors>
          </div>
          <div className="mb-4 flex max-w-xs flex-col">
            <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-white">
              Link
            </label>
            <Input placeholder="Link" name="link" defaultValue={release.link!} onChange={handleChange} readOnly={isFieldReadOnly} />
            <FormErrors>{link}</FormErrors>
          </div>
          <div className="mb-4 flex max-w-xs flex-col">
            <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-white">
              PR Image or PDF
            </label>
            <label className="mb-2">
            {/* Here we use our boolean to change the label text */}
            {isUploading ? <p>Uploading file...</p> : <p className={`text-blue-600 dark:text-blue-500 cursor-pointer ${user.typeId == 4 ? 'invisible' : ''}`} > Select File </p>}

            <input
              name="file"
              type="file"
              accept="image/jpeg,image/gif,image/png,application/pdf,image/x-eps"
              // We hide the input so we can use our own label as a trigger  invisible
              style={{ display: "none" }}
              onChange={(event) => processSubmit(event.currentTarget.files)}
            />
             <Input type="hidden" className="" name="linkly" defaultValue={images.length ? images[0].url : ""} />
          </label>

        
            {/*
            * Here we render the list of images, including the ones we're uploading
            * and the ones we've already uploaded
            */}
          
        
          { ( images.length ) ? 
              images.map((file:any) => {
              return <Image key="prImage" name={file.name} url={file.url} />;
            })
           : <Image key={release.linkly} name={release.linkly!} url={release.linkly!} />          
        }
          
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {userTypeId == 4 ? "" : 
            <>
              <ButtonLoading
                variant="default"
                size="sm"
                loadingText="Saving"
                isLoading={isSubmitting}
                icon={<IconMatch icon="floppy-disk" />}
              >
                <span>Save</span>
              </ButtonLoading>
              <FormDelete
                action="/user/pressrelease/delete"
                intentValue="pressrelease-delete"
                defaultValue={String(pressrelease.id)}
                itemText={`a release: ${pressrelease.id}`}            
              />
            </>  
            }
            <ButtonLink to={`/user/pressreleases`} prefetch="intent" variant="outline" size="sm">
              <IconMatch icon="x-circle" />
              <span>Cancel</span>
            </ButtonLink>
          </div>
        </Form>
      </section>
    </div>
  )
}


export const action = async ({ request }: ActionFunctionArgs) => {
  const { userId } = await requireUser(request)
  // console.log("action request 0: ")

  if (request.headers.get('content-type')?.includes('multipart/form-data')) {
    // console.log('action-1')
    const form = await request.formData();
    const file = form.get('file') as File;

    if (file.size <= 4.5 * 1024 * 1024) {
      const blob = await put(file.name, file, { access: 'public' });
    
      return json({
        ok: true, submission: null, message: "", files: [{ name: blob.pathname, url: blob.url}],
      }); 

    } else {
      return json({
        ok: false, submission: null, message: "Upload file is too large to handle. Please limit to 4.5 mb file size.", files: [],
      }); 
    }
  
  } else {
    // console.log('action-a')
    let formData = await request.formData()
    let submission = await parse(formData, {schema: schemaPressrelease})
 
    if (!submission.value || submission.intent !== "submit") {
      return json({ ok: false, submission, message: "Error data" }, { status: 400 })
    }  

    const pressrelease = await modelPressrelease.update({...submission.value, isTemp: false })
    await modelUser.updateSelectedCustomerId({id: submission.value.userId, selectedCustomerId: submission.value.customerId})
    return json({
      ok: true, submission, message: "", files: null,
    });

  }
}