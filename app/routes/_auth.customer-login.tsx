import { conform, useForm } from "@conform-to/react"
import { getFieldsetConstraint, parse } from "@conform-to/zod"
import { json, type ActionFunctionArgs, type MetaFunction } from "@remix-run/node"
import { Form, useActionData, useNavigation, useSearchParams, useLoaderData } from "@remix-run/react"
import { z } from "zod"
import { IconMatch } from "~/components/libs/icon"
import { ButtonLoading } from "~/components/ui/button-loading"
import { FormErrors, FormField, FormLabel } from "~/components/ui/form"
import { Input } from "~/components/ui/input"
import { useAppMode } from "~/hooks/use-app-mode"
import { db } from "~/libs/db.server"
import { schemaCustomerLogIn } from "~/schemas/user"
import { authService } from "~/services/auth.server"
import { createMeta } from "~/utils/meta"

export const meta: MetaFunction = () =>
  createMeta({
    title: `Log In`,
    description: `Continue to dashboard`,
  })

export const loader = ({ request }: ActionFunctionArgs) => {
  const url = new URL(request.url);
  const uid = url.searchParams.get("uid"); 

  if (uid) {
    return json({
      uid
    })
  } 
  
  return authService.isAuthenticated(request, {
    successRedirect: "/user/dashboard",
  })
}

export default function customerLoginRoute() {
  const actionData = useActionData<typeof action>()
  let data = useLoaderData<typeof loader>()
  console.log('data: ', data)
  
  const { isModeDevelopment } = useAppMode() 

  const navigation = useNavigation()
  const isSubmitting = navigation.state === "submitting"

  const [searchParams] = useSearchParams()
  const redirectTo = searchParams.get("redirectTo")

  const [form, { id }] = useForm<z.infer<typeof schemaCustomerLogIn>>({
    id: "login",
    lastSubmission: actionData?.submission,
    shouldRevalidate: "onInput",
    constraint: getFieldsetConstraint(schemaCustomerLogIn),
    onValidate({ formData }) {
      return parse(formData, { schema: schemaCustomerLogIn })
    },
    defaultValue: isModeDevelopment
      ? { id: data?.uid }
      : { id: data?.uid },
  
  })

  return (
    <div className="site-container">
      <div className="site-section-md space-y-4 mt-8">
        <header className="site-header">
          <h1 className="inline-flex items-center gap-2">
            <IconMatch icon="sign-in" />
            <span>Link verification</span>
          </h1>
        </header>

        <section>
          <Form
            replace
            action="/customer-login"
            method="POST"
            className="flex flex-col gap-2"
            {...form.props}
          >
            <fieldset className="flex flex-col gap-2" disabled={isSubmitting}>
              {redirectTo ? <input type="hidden" name="redirectTo" value={redirectTo} /> : null}

              <FormField>
                {/* <FormLabel htmlFor={id.id}>User ID</FormLabel> */}
                <Input
                  {...conform.input(id, {
                    type: "text",
                    description: true,
                  })}
                  id={id.id}
                  placeholder="User ID"
                  autoCapitalize="none"
                  autoCorrect="off"
                  autoFocus={id.error ? true : undefined}
                  required
                  className="hidden"
                />
                
                <FormErrors>{id}</FormErrors>
              </FormField> 
              <ButtonLoading type="submit" loadingText="Logging In..." isLoading={isSubmitting}>
                Click to continue
              </ButtonLoading>
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
  console.log('formData: ', formData)
  const submission = await parse(formData, {
    async: true,
    schema: schemaCustomerLogIn.superRefine(async (data, ctx) => {
      const existingUser = await db.user.findUnique({
        where: { id: data.id, isActive: true },
      })
      // console.log('existingUser: ', existingUser)
      if (!existingUser) {
        ctx.addIssue({
          path: ["id"],
          code: z.ZodIssueCode.custom,
          message: "User ID does not exist.",
        })
        return
      }
    }),
  })

  // await timer.delay()
  console.log('submission.value: ', submission.value)
  console.log('submission.intent: ', submission.intent)
  if (!submission.value || submission.intent !== "submit") {
    return json({ status: "error", submission }, { status: 400 })
  }
  // console.log('request: ', request)
  return authService.authenticate("form", request, {
    successRedirect: "/user/dashboard",
    failureRedirect: "/customer-login",
  })
}
