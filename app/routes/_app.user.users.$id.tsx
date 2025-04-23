import * as React from "react"
import { conform, useForm } from "@conform-to/react"
import { getFieldsetConstraint, parse } from "@conform-to/zod"
import { json, type ActionFunctionArgs, type MetaFunction, LoaderFunctionArgs, redirect } from "@remix-run/node"
import { Form, useActionData, useNavigation, useSearchParams, useNavigate } from "@remix-run/react"
import { z } from "zod"
import { useLoaderData } from "@remix-run/react"
import { IconMatch } from "~/components/libs/icon"
import { ButtonLoading } from "~/components/ui/button-loading"
import { FormDescription, FormErrors, FormField, FormLabel } from "~/components/ui/form"
import { Input } from "~/components/ui/input"
import { InputPassword } from "~/components/ui/input-password"
import { configUnallowedKeywords } from "~/configs/unallowed-keywords"
import { useAppMode } from "~/hooks/use-app-mode"
import { db } from "~/libs/db.server"
import { modelUser } from "~/models/user.server"
import { modelUserPassword } from "~/models/user-password.server"
import { hashPassword } from "~/utils/encryption.server"
import { schemaUserUpdateProperties } from "~/schemas/user"
import { authService } from "~/services/auth.server"
import { createMeta } from "~/utils/meta"
import { createTimer } from "~/utils/timer"
import { checkAllowance, requireUser } from "~/helpers/auth"
import { Button } from "~/components/ui/button"
import { invariant, invariantResponse } from "~/utils/invariant" 
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


export const meta: MetaFunction = () =>
  createMeta({
    title: `Sign Up`,
    description: `Create a new account`,
  })

// export const loader = async ({ request }: ActionFunctionArgs) => {
//   await authService.isAuthenticated(request, { failureRedirect: "/login" })
//   const { user } = await requireUser(request)
  
//   return json({user});
  
// }

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  invariant(params.id, "params.id unavailable")
  // const { userId } = await requireUser(request)
  const user = await modelUser.getById({ id: String(params.id)! })
  invariantResponse(user, "Post not found", { status: 404 })
  return json({ user })
}

// export async function action({request}: ActionFunctionArgs) {
//   const body = await request.formData();
//   const success = body.get("success");
//   return json({ success });
// }

export default function UserUsersIdRoute() {
  const data = useLoaderData<typeof loader>()
  const [user, setUser] = React.useState(data.user);  
  const actionData:any = useActionData<typeof action>()
  // console.log('data: ', data)
  const { isModeDevelopment } = useAppMode()
  const navigate = useNavigate()

  const navigation = useNavigation()
  const isSubmitting = navigation.state === "submitting"
  const [searchParams] = useSearchParams()
  const redirectTo = searchParams.get("redirectTo")
  const successNewUser = searchParams.get("successNewUser")
  const [defaultPw, setDefaultPw] = React.useState("pass1234")
  const [setResetPw, setSetResetPw] = React.useState(false)
  const [chkUserActive, setChkUserActive] = React.useState(user.isActive)
  const [form, { id, email, fullname, password, isUserActive }] = useForm<z.infer<typeof schemaUserUpdateProperties>>(
    {
      id: "updateUser",
      lastSubmission: actionData?.submission,
      shouldRevalidate: "onInput",
      constraint: getFieldsetConstraint(schemaUserUpdateProperties),
      onValidate({ formData }) {
        return parse(formData, { schema: schemaUserUpdateProperties })
      },
      defaultValue: isModeDevelopment
        ? {
            email: "example@example.com",
            fullname: "full Name",
            username: "username",
            password: defaultPw,
            isActive: "0",
          }
        : {
          password: defaultPw,
        },
    },
  )
  const notify = () => toast("Successfully saved");

  const handleResetPw = () => {
    setSetResetPw(!setResetPw)
    // console.log("setResetPw: ", setResetPw)
    if (!setResetPw) {
      setDefaultPw("")
    } else {
      setDefaultPw("secret")
    }
    
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    // console.log('name: ',name)
    // console.log('value: ',value)
    // console.log('setResetPw: ',setResetPw)
    if (setResetPw) {
      setUser(prevValues => ({
        ...user,
        [name]: value,
      }))
    }
  }

  const handleCheckboxChange = () => {
    setChkUserActive(!chkUserActive)
  }

  React.useEffect(() => {
    // && actionData?.status! === "success"
    if ((actionData && actionData?.ok) || (successNewUser)) {
      // console.log('actionData:', actionData)
      notify()
    }
     
  },[actionData, successNewUser]) 
 

  return (
    <div className="app-container">
      <div className="w-1/2 mx-4 space-y-8">
        <header className="site-header">
          <h2 className="inline-flex items-center gap-4">
            <IconMatch icon="user-plus" />
            <span>Edit User {user.typeId == 3 ? "(Agent)" : "(Client)"} </span>
          </h2>
        </header>
        {/* action="/admin/users/update" */}
        <section>
          <ToastContainer />
          <Form replace  method="POST" className="flex flex-col gap-4" {...form.props}> 
            <input type="hidden" {...conform.input(id)} value={user.id}/>
            <input type="hidden" name="isResetPw" value={setResetPw.toString()}/>    
            <input type="hidden" {...conform.input(isUserActive)} value={chkUserActive ? "1" : "0"}/>
            <fieldset className="flex flex-col gap-4" disabled={isSubmitting}>
             <FormField>
                <FormLabel htmlFor={id.id}>Id</FormLabel>
                <Input
                  {...conform.input(id)}
                  id={id.id}
                  placeholder="Id"
                  autoFocus={id.error ? true : undefined}
                  readOnly={true}
                  defaultValue={user.id}
                />
                <FormErrors>{id}</FormErrors>
              </FormField>
              <FormField>
                <FormLabel htmlFor={fullname.id}>Full Name</FormLabel>
                <Input
                  {...conform.input(fullname)}
                  id={fullname.id}
                  placeholder="Full Name"
                  autoFocus={fullname.error ? true : undefined}
                  required
                  defaultValue={user.fullname}
                  onChange={handleChange}
                />
                <FormErrors>{fullname}</FormErrors>
              </FormField>

              <FormField>
                <FormLabel htmlFor={email.id}>Email</FormLabel>
                <Input
                  {...conform.input(email, {
                    type: "email",
                    description: true,
                  })}
                  id={email.id}
                  placeholder="yourname@example.com"
                  autoCapitalize="none"
                  autoCorrect="off"
                  autoFocus={email.error ? true : undefined}
                  required
                  defaultValue={user.email}
                  onChange={handleChange}
                />
                <FormErrors>{email}</FormErrors>
              </FormField>
              {/* <input type="hidden" name="username" value="" />
              <input type="hidden" name="typeId" /> */}
 
              <FormField>
                <FormLabel htmlFor={password.id}>Password</FormLabel>
                <InputPassword
                  {...conform.input(password, {
                    description: true,
                  })}
                  id={password.id}
                  placeholder="Temporary password"
                  className="w-full"
                  isShowPw={setResetPw}
                  readOnly={!setResetPw}
                  onChange={handleChange}
                />
                <div className="flex items-center mb-4">
                  <input id="default-checkbox" onChange={handleResetPw} type="checkbox" className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
                  <label htmlFor="default-checkbox" className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">Reset password</label>
                </div>
              </FormField>

              <FormField>
                {/* <FormLabel htmlFor={password.id}>Enable</FormLabel> */}
                <label className="inline-flex items-center cursor-pointer">
                  <input type="checkbox" name="chkIsActive" defaultChecked={chkUserActive ?? false}  onChange={handleCheckboxChange}  className="sr-only peer" />
                  {/* defaultChecked={user.isActive ?? false} */}
                  {/* <Input    
                  {...conform.input(isActive, {
                    type: "checkbox",
                    description: true,
                  })}
                  id={isActive.id}
                  placeholder=""
                  autoFocus={isActive.error ? true : undefined}
                  defaultChecked={user.isActive ?? false}
                  onChange={handleCheckboxChange} 
                  className="sr-only peer"
                /> */}
                  <div className="relative w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">Enable</span>
                </label>
                
                
                {/* <FormLabel htmlFor={fullname.id} className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">Enable</FormLabel> */}
              </FormField>
    
              <div className="my-3">
                  {/* <ButtonLoading  type="submit" size="sm" variant="outline" className="mr-3" loadingText="Signing Up..." isLoading={isSubmitting}>
                  <IconMatch icon="floppy-disk" />
                  Save
                </ButtonLoading> */}
                <ButtonLoading
                  className="mr-3"
                  variant="default"
                  size="sm"
                  loadingText="Saving"
                  isLoading={isSubmitting}
                  icon={<IconMatch icon="floppy-disk" />}
                >
                  <span>Save</span>
                </ButtonLoading>

                {/* <Button type="button" size="sm" variant="outline"  onClick={() => navigate(-1)} > */}
                <Button type="button" variant="outline" size="sm" onClick={() => navigate(-1)} >  
                  <IconMatch icon="x-circle" />
                  <span>Cancel</span>
                </Button> 
              
              </div>
            </fieldset>
          </Form>
        </section>
      </div>
    </div>
  )
}

export const action = async ({ request }: ActionFunctionArgs) => {
  
  // const timer = createTimer()
  const clonedRequest = request.clone()
  const formData = await clonedRequest.formData()

  const submission = await parse(formData, {
    async: true,
    schema: schemaUserUpdateProperties.superRefine(async (data, ctx) => {
      // const unallowedUsername = configUnallowedKeywords.find(keyword => keyword === data.username)
      // if (unallowedUsername) {
      //   ctx.addIssue(issueUsernameUnallowed)
      //   return
      // }

      // const existingEmail = await db.user.findUnique({
      //   where: { email: data.email },
      //   select: { id: true },
      // })
      // if (existingEmail) {
      //   ctx.addIssue({
      //     path: ["email"],
      //     code: z.ZodIssueCode.custom,
      //     message: "Email cannot be used",
      //   })
      //   return
      // }

      // const existingUsername = await db.user.findUnique({
      //   where: { username: data.username },
      //   select: { id: true },
      // })
      // if (existingUsername) {
      //   ctx.addIssue(issueUsernameUnallowed)
      //   return
      // }
    }),
  })

  if (!submission.value || submission.intent !== "submit") {
    // await timer.delay()
    return json({ ok: true, submission }, { status: 400 })
  }
  // console.log('submission.value: ', submission.value) 
  if (!submission.value) return json({ ok: false, submission}, { status: 400 })
  // const { statusSymbol: symbol } = submission.value

  // const postStatus = await modelPostStatus.getBySymbol({ symbol })
  // console.log('submission.value', submission.value)
  await modelUser.update({
    id: submission.value?.id!,
    email: submission.value?.email!, 
    fullname: submission.value?.fullname!,
    isActive: submission.value?.isUserActive! === "1" ? true : false,
  })

  const isResetPw = (formData.get("isResetPw") === 'true')
  if (isResetPw) {  
    const password = formData.get("password")?.toString()
    await modelUserPassword.update({
      userId: submission.value?.id!,
      hash: await hashPassword(password!),
    })
  }
  

  // await timer.delay()
  return json({ ok: true, submission }, { status: 200 })

  // const newUser = await modelUser.update(submission.value)
  // console.log('newUser: ', newUser)
  // if (!newUser) {
  //   await timer.delay()
  //   return json({ status: "error", submission }, { status: 500 })
  // }

  // await timer.delay()
  // const body = await request.formData();
  // const success = body.get("status");
  // // return json({ success });
  
}

