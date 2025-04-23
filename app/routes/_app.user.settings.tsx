import { parse } from "@conform-to/zod"
import {
  json,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "@remix-run/node"
import { useLoaderData, Link, useFetcher } from "@remix-run/react"
import * as React from "react"
import { useState } from "react"
import { FormUpdateField } from "~/components/shared/form-update-field"
import { configSite } from "~/configs/site"
import { configUnallowedKeywords } from "~/configs/unallowed-keywords"
import { requireUser } from "~/helpers/auth"
import { modelUser } from "~/models/user.server"
import { schemaGeneralId } from "~/schemas/general"
import {
  issueUsernameUnallowed,
  schemaUserEmail,
  schemaUserFullName,
  schemaUserUsername,
} from "~/schemas/user"
import { createMeta } from "~/utils/meta"
import { createSitemap } from "~/utils/sitemap"
import { ThemeMenu } from "~/components/shared/theme-menu"
import { IconMatch } from "~/components/libs/icon"
import { ToastContainer, toast } from 'react-toastify';
import { put } from '@vercel/blob';
import Resizer from "react-image-file-resizer";

export const handle = createSitemap()

export const meta: MetaFunction = () =>
  createMeta({
    title: `User Settings`,
    description: `Manage user account settings`,
  })

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return json(await requireUser(request))
}

const notify = (msg = "Successfully saved") => toast(msg);
const notifyError = (msg = "Something went wrong!") => toast.error(msg);

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
    submit(files: File | null) {
      if (!files) return;
      let formData = new FormData();
      // for (let file of files) formData.append("file", file);
      formData.append("file", files);
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
    if (objectUrl && !url.startsWith("blob:")) {
      URL.revokeObjectURL(objectUrl); 
      notify()
    } 
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

export default function UserSettingsRoute() {
  const { user } = useLoaderData<typeof loader>()
  // let actionData = useActionData<typeof action>()
  // const fetcher = useFetcher<typeof loader>();
  let { submit, isUploading, images } = useFileUpload();  
  const resizer: typeof Resizer = (Resizer.default || Resizer);
  // console.log("actionData: ",actionData);

  const processSubmit = (files:any) => {
    // console.log("size: ",files[0]?.size);
    var fileInput = false;
    if (files[0]) {
      if (files && files[0]?.size! <= 4.5 * 1024 * 1024) {
        fileInput = true;
      } else {
        notifyError("Upload file is too large to handle. Please limit to 4.5 mb file size.");
      }   
    }
    // console.log("file[0]: ",files[0])
    if (fileInput) {
      try {
        resizer.imageFileResizer(
          files[0],
          300,
          300,
          "JPEG",
          100,
          0,
          (file) => {
            // console.log("file resized: ",file);
            submit(file)
          },
          "file",
          200,
          200
        );
      } catch (err) {
        console.log(err);
      }
    }    
  }

  return (
    <div className="app-container">
      <header className="app-header items-center gap-4">
        <div>
          <h2>User Settings</h2>
          <p>Manage user settings and profile</p>
        </div>
      </header>
      <ToastContainer />
      <section className="app-section max-w-md mt-4">
        <FormUpdateField
          label="Username"
          field="username"
          intentValue="user-update-username"
          description={`Public @username within ${configSite.name} 
          like ${configSite.domain}/yourname. Use 20 characters at maximum. 
          Only alphabet, number, dot, underscore allowed`}
          schema={schemaUserUsername}
          user={user}
        />
        <FormUpdateField
          label="Email"
          field="email"
          intentValue="user-update-email"
          description={`Please enter an email.`}
          schema={schemaUserEmail}
          user={user}
        />
        <FormUpdateField
          label="Full Name"
          field="fullname"
          intentValue="user-update-fullname"
          description="Display name you are comfortable with. It can be real name or a pseudonym."
          schema={schemaUserFullName}
          user={user}
        />
        <div className="mb-4 flex max-w-xs flex-col mt-3 ">
            <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-white">
              Profile / Logo 
            {/* Here we use our boolean to change the label text */}
            {isUploading ? <span>Uploading file...</span> : <span className="text-blue-600 dark:text-blue-500 cursor-pointer"> Select File </span>}

            <input
              name="file"
              type="file"
              accept="image/jpeg,image/gif,image/png,application/pdf,image/x-eps"
              // We hide the input so we can use our own label as a trigger  invisible
              style={{ display: "none" }}
              onChange={(event) => processSubmit(event.currentTarget.files)}
            />
             {/* <Input type="hidden" className="" name="profilePicUrl" defaultValue={images.length ? images[0].url : ""} /> */}
          </label>
          { ( images.length ) ? 
              images.map((file:any) => {
              return <Image key="profileImage" name={file.name} url={file.url} />;
            })
           : <Image key="profileImage" name="profileImage" url={user.profilePicUrl ?? ""} />          
        }
          
          </div>
        <div className="mb-4 flex max-w-xs flex-col">
            <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-white">
              <ThemeMenu variant="ghost" /> Switch Theme
            </label>            
        </div>

        <div className="mb-4 flex max-w-xs flex-col">
            <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-white">
              <Link to="/user/settings-publication" className="text-primary underline-offset-4 hover:underline"><IconMatch icon="storefront" className="inline mr-1" />Add / Edit Publication</Link>
            </label>            
        </div>
        
      </section>
    </div>
  )
}

export const action = async ({ request }: ActionFunctionArgs) => {
  // const timer = createTimer()
  const formData = await request.formData()
  const { userId } = await requireUser(request)

  if (request.headers.get('content-type')?.includes('multipart/form-data')) {
    // console.log('action-1')
    // console.log('action-2-formData: ', formData)
    const file = formData.get('file') as File;
    if (file.size <= 4.5 * 1024 * 1024) {
      const blob = await put(file.name, file, { access: 'public' });
      // console.log('blob: ', blob)
      await modelUser.updateUserPrifilePicUrl({id: userId, profilePicUrl: blob.url})
      return json({
        ok: true, submission: null, message: "", files: [{ name: blob.pathname, url: blob.url}],
      }); 

    } else {
      return json({
        ok: false, submission: null, message: "Upload file is too large to handle. Please limit to 4.5 mb file size.", files: null,
      }); 
    }
  
  } 
  
  
  const submission = parse(formData, { schema: schemaGeneralId })
  const intent = submission.value?.intent

  try {
    if (intent === "user-update-username") {
      const submission = parse(formData, {
        schema: schemaUserUsername.superRefine((data, ctx) => {
          const unallowedUsername = configUnallowedKeywords.find(keyword => keyword === data.username)
          if (unallowedUsername) {
            ctx.addIssue(issueUsernameUnallowed)
            return
          }
        }),
      })
      if (!submission.value) return json(submission, { status: 400})
      await modelUser.updateUsername(submission.value)
    }

    if (intent === "user-update-fullname") {
      const submission = parse(formData, { schema: schemaUserFullName })
      if (!submission.value) return json(submission, { status: 400})
      await modelUser.updateFullName(submission.value)
    }

    if (intent === "user-update-email") {
      const submission = parse(formData, { schema: schemaUserEmail })
      if (!submission.value) return json(submission, { status: 400})
      await modelUser.updateEmail(submission.value)
    }
  } catch (e:any) {
    return json(submission, { status: 400})
  }

  return json(submission, { status: 200})
}
