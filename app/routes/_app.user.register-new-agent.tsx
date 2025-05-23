import * as React from "react"
import { conform, useForm } from "@conform-to/react"
import { getFieldsetConstraint, parse } from "@conform-to/zod"
import { json, type ActionFunctionArgs, type MetaFunction, redirect } from "@remix-run/node"
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
import { issueUsernameUnallowed, schemaUserSignUp } from "~/schemas/user"
import { authService } from "~/services/auth.server"
import { createMeta } from "~/utils/meta"
import { createTimer } from "~/utils/timer"
import { checkAllowance, requireUser } from "~/helpers/auth"
import { Button } from "~/components/ui/button"
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


export const meta: MetaFunction = () =>
  createMeta({
    title: `Sign Up`,
    description: `Create a new account`,
  })

export const loader = async ({ request }: ActionFunctionArgs) => {
  await authService.isAuthenticated(request, { failureRedirect: "/login" })
  const { user } = await requireUser(request)
  
  return json({user});
  
}

export default function UserRegisterNewAgentRoute() {
  const { user } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const { isModeDevelopment } = useAppMode()
  const navigate = useNavigate()

  const navigation = useNavigation()
  const isSubmitting = navigation.state === "submitting"

  const [searchParams] = useSearchParams()
  const redirectTo = searchParams.get("redirectTo")

  const [form, { email, fullname, password, isUserActive, pagingRowLimit }] = useForm<z.infer<typeof schemaUserSignUp>>(
    {
      id: "signup",
      lastSubmission: actionData?.submission,
      shouldRevalidate: "onInput",
      constraint: getFieldsetConstraint(schemaUserSignUp),
      onValidate({ formData }) {
        return parse(formData, { schema: schemaUserSignUp })
      },
      defaultValue: isModeDevelopment
        ? {
            email: "example@example.com",
            fullname: "Example Name",
            username: "example",
            password: "exampleexample",
            isUserActive: "1",
            pagingRowLimit: 15
          }
        : {},
    },
  )

  return (
    <div className="app-container">
      { user.typeId != 2 ? <section><h2 className="text-center">Page is not accessable using your account type.</h2></section> :
      <div className="w-1/2 mx-4 space-y-8">
        <header className="site-header">
          <h2 className="inline-flex items-center gap-4">
            <IconMatch icon="user-plus" />
            <span>Create new agent</span>
          </h2>
        </header>

        <section>
          <Form
            replace            
            method="POST"
            className="flex flex-col gap-2"
            {...form.props}
          >
            <input type="hidden" {...conform.input(isUserActive)} value={"1"}/>
            <input type="hidden" {...conform.input(pagingRowLimit)} value={15}/>
            <fieldset className="flex flex-col gap-2" disabled={isSubmitting}>
              <FormField>
                <FormLabel htmlFor={fullname.id}>Name</FormLabel>
                <Input
                  {...conform.input(fullname)}
                  id={fullname.id}
                  placeholder="Full Name"
                  autoFocus={fullname.error ? true : undefined}
                  required
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
                />
                <FormErrors>{email}</FormErrors>
              </FormField>

              {/* <FormField>
                <FormLabel htmlFor={username.id}>Username</FormLabel>
                <Input
                  {...conform.input(username)}
                  id={username.id}
                  placeholder="username"
                  autoFocus={username.error ? true : undefined}
                  required
                />
                <FormDescription id={password.descriptionId}>
                  4 to 20 characters (letters, numbers, dot, underscore)
                </FormDescription>
                <FormErrors>{username}</FormErrors>
              </FormField> */}

              <FormField>
                <FormLabel htmlFor={password.id}>Password</FormLabel>
                <InputPassword
                  {...conform.input(password, {
                    description: true,
                  })}
                  id={password.id}
                  placeholder="Enter password (at least 8 characters)"
                  autoComplete="current-password"
                  autoFocus={password.error ? true : undefined}
                  required
                  className="w-full"
                />
                <FormDescription id={password.descriptionId}>8 characters or more</FormDescription>
                <FormErrors>{password}</FormErrors>
              </FormField>              

              {redirectTo ? <input type="hidden" name="redirectTo" value={redirectTo} /> : null}
              <input type="hidden" name="typeId" value="3" />

              <div className="my-3">
                <ButtonLoading  type="submit" size="sm"   className="mr-3" loadingText="registering..." isLoading={isSubmitting}>
                  <IconMatch icon="floppy-disk" />
                  Save
                </ButtonLoading>

                <Button type="button" size="sm"  variant="outline" onClick={() => navigate(-1)} >
                  <IconMatch icon="x-circle" />
                  <span>Cancel</span>
                </Button> 
              
              </div>
            </fieldset>
          </Form>
        </section>
      </div>
    }
    </div>
  )
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const timer = createTimer()
  const clonedRequest = request.clone()
  const formData = await clonedRequest.formData()

  const submission = await parse(formData, {
    async: true,
    schema: schemaUserSignUp.superRefine(async (data, ctx) => {
   
      const existingEmail = await db.user.findUnique({
        where: { email: data.email },
        select: { id: true },
      })
      if (existingEmail) {
        ctx.addIssue({
          path: ["email"],
          code: z.ZodIssueCode.custom,
          message: "Email cannot be used",
        })
        return
      }
 
    }),
  })

  if (!submission.value || submission.intent !== "submit") {
    return json({ status: "error", submission }, { status: 400 })
  }

  const newUser = await modelUser.signup(submission.value)

  if (!newUser) {
    return json({ status: "error", submission }, { status: 500 })
  }
 
  return redirect(`/user/users/${newUser.id}?successNewUser=true`)
 
}

