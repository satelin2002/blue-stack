import { type User } from "@prisma/client";
import bcrypt from "bcryptjs";
import { Authenticator } from "remix-auth";
import invariant from "tiny-invariant";
import { prisma } from "./db.server.ts";
import { sessionStorage } from "./session.server.ts";
import { redirect } from "@remix-run/node";
import { EmailLinkStrategy } from "remix-auth-email-link";
import { sendEmail } from "~/services/email.server.tsx";

export type { User };

// This secret is used to encrypt the token sent in the magic link and the
// session used to validate someone else is not trying to sign-in as another
// user.
let secret = process.env.MAGIC_LINK_SECRET;
if (!secret) throw new Error("Missing MAGIC_LINK_SECRET env variable.");

export const authenticator = new Authenticator<User>(sessionStorage);

const SESSION_EXPIRATION_TIME = 1000 * 60 * 60 * 24 * 30;

export const EMAIL_LINK_STRATEGY_NAME = "email-link";

// Here we need the sendEmail, the secret and the URL where the user is sent
// after clicking on the magic link
authenticator.use(
  new EmailLinkStrategy(
    {
      sendEmail,
      secret,
      callbackURL: "/magic",
      validateSessionMagicLink: true,
    },
    // In the verify callback,
    // you will receive the email address, form data and whether or not this is being called after clicking on magic link
    // and you should return the user instance
    async ({
      email,
      magicLinkVerify,
    }: {
      email: string;
      form: FormData;
      magicLinkVerify: boolean;
    }) => {
      invariant(typeof email === "string", "email must be a string");
      invariant(email.length > 0, "email must not be empty");
      let user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
          },
        });
      }
      // Create a session for the user after clicking on the magic link.
      if (magicLinkVerify) {
        await prisma.session.create({
          data: {
            expirationDate: new Date(Date.now() + SESSION_EXPIRATION_TIME),
            userId: user.id,
          },
          select: { id: true },
        });
      }
      return user;
    }
  )
);

export async function requireUserId(
  request: Request,
  { redirectTo }: { redirectTo?: string | null } = {}
) {
  const requestUrl = new URL(request.url);
  redirectTo =
    redirectTo === null
      ? null
      : redirectTo ?? `${requestUrl.pathname}${requestUrl.search}`;
  const loginParams = redirectTo
    ? new URLSearchParams([["redirectTo", redirectTo]])
    : null;
  const failureRedirect = ["/login", loginParams?.toString()]
    .filter(Boolean)
    .join("?");
  const sessionId = await authenticator.isAuthenticated(request, {
    failureRedirect,
  });
  if (!sessionId) {
    throw redirect(failureRedirect);
  }
  return sessionId.id;
}

export async function getUser(request: Request) {
  const userSession = await authenticator.isAuthenticated(request);
  if (!userSession) return null;
  return userSession;
}

export async function requireAnonymous(request: Request) {
  await authenticator.isAuthenticated(request, {
    successRedirect: "/",
  });
}

export async function signup({
  email,
  name,
}: {
  email: User["email"];

  name: User["name"];
  password: string;
}) {
  const session = await prisma.session.create({
    data: {
      expirationDate: new Date(Date.now() + SESSION_EXPIRATION_TIME),
      user: {
        create: {
          email,
          name,
        },
      },
    },
    select: { id: true, expirationDate: true },
  });
  return session;
}

export async function getPasswordHash(password: string) {
  const hash = await bcrypt.hash(password, 10);
  return hash;
}
