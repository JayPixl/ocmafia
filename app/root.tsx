import { cssBundleHref } from "@remix-run/css-bundle";
import type { LinksFunction, V2_MetaFunction } from "@remix-run/node";
import {
  Link,
  LinkProps,
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useRouteError,
} from "@remix-run/react";

import stylesheet from './tailwind.css'
import Layout from "./components/layout";
import { V2_ErrorBoundaryComponent } from "@remix-run/react/dist/routeModules";

//<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
//<link ></link>

const googleFonts: any = [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
  { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Ubuntu:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400;1,500;1,700&family=Ysabeau+Office:ital,wght@0,1;0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;0,1000;1,1;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900;1,1000&display=swap&family=Dancing+Script:wght@400;500;600;700" }
]

export const links: LinksFunction = () => [
  ...googleFonts,
  { rel: "stylesheet", href: stylesheet },
  { rel: "icon", href: '/images/ocm_website_icon.ico' },
  ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
];

export const meta: V2_MetaFunction = () => {
  return [
    { title: "OC Mafia Home" },
    { name: "description", content: "Welcome to OC Mafia!" },
  ];
};

export const ErrorBoundary: V2_ErrorBoundaryComponent = () => {
  const error: any = useRouteError();
  console.error(error)

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <Layout navigation={true}>
          <div className="flex flex-col justify-center items-center p-5">
            <h1 className="font-semibold text-5xl py-5">Something went wrong...</h1>
            <Link to='/' className="text-neonblue font-semibold p-2">Back to home</Link>
            <p>{error?.message || ''}</p>
          </div>

        </Layout>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
