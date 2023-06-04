import { cssBundleHref } from "@remix-run/css-bundle";
import type { DataFunctionArgs } from "@remix-run/node";
import {
  json,
  type LinksFunction,
  type V2_MetaFunction,
} from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import tailwindStylesheetUrl from "./styles/tailwind.css";
import { getUser } from "./utils/auth.server";
import { getEnv } from "./utils/env.server";
import { useNonce } from "./utils/nonce-provider";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: tailwindStylesheetUrl },
  ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
];

export const meta: V2_MetaFunction = () => {
  return [
    { title: "Epic Notes" },
    { name: "description", content: "Find yourself in outer space" },
  ];
};

export async function loader({ request }: DataFunctionArgs) {
  const user = await getUser(request);
  return json({ user, ENV: getEnv() });
}

export default function App() {
  const data = useLoaderData<typeof loader>();
  const nonce = useNonce();

  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(data.ENV)}`,
          }}
        />
        <LiveReload nonce={nonce} />
      </body>
    </html>
  );
}
