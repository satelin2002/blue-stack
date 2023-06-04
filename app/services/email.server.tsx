import { renderToString } from "react-dom/server";
import type { SendEmailFunction } from "remix-auth-email-link";
import type { User } from "~/utils/auth.server.ts";
import * as emailProvider from "~/utils/email.server.ts";

export let sendEmail: SendEmailFunction<User> = async (options) => {
  let subject = "Here's your Magic sign-in link";
  let body = renderToString(
    <p>
      Hi {options.user?.name || "there"},<br />
      <br />
      <a href={options.magicLink}>Click here to login on example.app</a>
    </p>
  );
  console.log("Sending email to", options.emailAddress);
  console.log("magicLink", options.magicLink);

  await emailProvider.sendEmail({
    to: options.emailAddress,
    subject: subject,
    html: body,
  });
};
