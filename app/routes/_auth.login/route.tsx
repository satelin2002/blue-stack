import {
  json,
  type V2_MetaFunction,
  type DataFunctionArgs,
} from "@remix-run/node";
import { GeneralErrorBoundary } from "~/components/error-boundary.tsx";
import { Spacer } from "~/components/spacer.tsx";
import { requireAnonymous } from "~/utils/auth.server.ts";
import { getSession } from "~/utils/session.server.ts";
import { ButtonLink } from "~/utils/forms.tsx";
import { ChevronLeft } from "lucide-react";
import { conform, useForm } from "@conform-to/react";
import { getFieldsetConstraint, parse } from "@conform-to/zod";
import { Link, useFetcher } from "@remix-run/react";
import { z } from "zod";
import {
  EMAIL_LINK_STRATEGY_NAME,
  authenticator,
} from "~/utils/auth.server.ts";
import { Button, ErrorList, Field } from "~/utils/forms.tsx";
import { emailSchema } from "~/utils/user-validation.ts";

export const meta: V2_MetaFunction = () => {
  return [{ title: "Login to Epic Notes" }];
};

export const LoginFormSchema = z.object({
  email: emailSchema.optional(),
  redirectTo: z.string().optional(),
});

export async function loader({ request }: DataFunctionArgs) {
  await requireAnonymous(request);
  const session = await getSession(request.headers.get("cookie"));
  const magicLinkSent = session.has("auth:magiclink");
  const magicLinkEmail = session.get("auth:email");

  return json({
    magicLinkSent,
    magicLinkEmail,
  });
}

export async function action({ request }: DataFunctionArgs) {
  const formData = await request.clone().formData();
  const submission = parse(formData, {
    schema: LoginFormSchema,
    acceptMultipleErrors: () => true,
  });
  if (!submission.value || submission.intent !== "submit") {
    return json(
      {
        status: "error",
        submission,
      } as const,
      { status: 400 }
    );
  }
  // The success redirect is required in this action, this is where the user is
  // going to be redirected after the magic link is sent, note that here the
  // user is not yet authenticated, so you can't send it to a private page.
  await authenticator.authenticate(EMAIL_LINK_STRATEGY_NAME, request, {
    // If the user was authenticated, we redirect them to their profile page
    // This redirect is optional, if not defined the user will be returned by
    // the `authenticate` function and you can render something on this page
    // manually redirect the user.
    successRedirect: "/login",
    // If something failed we take them back to the login page
    // This redirect is optional, if not defined any error will be throw and
    // the ErrorBoundary will be rendered.
    failureRedirect: "/login",
  });
}

export default function LoginPage() {
  const loginFetcher = useFetcher<typeof action>();

  const [form, fields] = useForm({
    id: "inline-login",
    constraint: getFieldsetConstraint(LoginFormSchema),
    onValidate({ formData }) {
      return parse(formData, { schema: LoginFormSchema });
    },
    shouldRevalidate: "onBlur",
  });

  return (
    <>
      <header className="container mx-auto px-4 py-6 sm:px-0">
        <nav className="flex justify-between">
          <div className="flex items-center gap-10">
            <ButtonLink to="/" size="sm" variant="outline">
              <ChevronLeft className="mr-0.5 h-5" aria-hidden="true" />
              Back
            </ButtonLink>
          </div>
        </nav>
      </header>
      <div className="flex flex-col justify-center pb-32 pt-20">
        <div className="mx-auto w-full max-w-md">
          <div className="flex flex-col gap-3 text-center">
            <h1 className="text-h1">Welcome back!</h1>
            <p className="text-body-md text-gray-400">
              Use your email address to login
            </p>
          </div>
          <Spacer size="xs" />
          <div>
            <div className="mx-auto w-full max-w-md px-8">
              <loginFetcher.Form method="POST" name="login" {...form.props}>
                <Field
                  labelProps={{
                    htmlFor: fields.email.id,
                    children: "Email address",
                  }}
                  inputProps={conform.input(fields.email)}
                  errors={fields.email.errors}
                />
                <ErrorList errors={form.errors} id={form.errorId} />

                <div className="flex items-center justify-start gap-6 pt-3">
                  <Button
                    className="w-full"
                    size="md"
                    variant="primary"
                    status={
                      loginFetcher.state === "submitting" ? "pending" : "idle"
                    }
                    type="submit"
                    disabled={loginFetcher.state !== "idle"}
                  >
                    Log in
                  </Button>
                </div>
              </loginFetcher.Form>
              <div className="flex items-center justify-center gap-2 pt-6">
                <span className="text-gray-400">New here?</span>
                <Link to="/signup">Create an account</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function ErrorBoundary() {
  return <GeneralErrorBoundary />;
}
