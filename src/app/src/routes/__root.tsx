import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRoute,
  useLocation,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { useEffect } from "react";

import { AppHeader } from "@/components/layout/AppHeader";
import { useAuthStore } from "@/stores/authStore";
import { storeRedirectPath } from "@/lib/authRedirect";

import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Peabee",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),

  component: RootComponent,
  notFoundComponent: RootNotFound,
});

function RootComponent() {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    const search = location.search;
    const searchString = (() => {
      if (!search) return "";
      if (typeof search === "string") {
        return search.startsWith("?") ? search : `?${search}`;
      }

      const params = new URLSearchParams(search as Record<string, string>);
      const serialized = params.toString();
      return serialized ? `?${serialized}` : "";
    })();

    const path = `${location.pathname}${searchString}${location.hash ?? ""}`;
    storeRedirectPath(path);
  }, [location.pathname, location.search, location.hash]);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-background antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {isAuthenticated && <AppHeader />}
          <main>
            <Outlet />
          </main>
          <Toaster position="bottom-right" />
          {/* <TanStackDevtools
            config={{
              position: 'bottom-right',
            }}
            plugins={[
              {
                name: 'Tanstack Router',
                render: <TanStackRouterDevtoolsPanel />,
              },
            ]}
          /> */}
          <Scripts />
        </ThemeProvider>
      </body>
    </html>
  );
}

function RootNotFound() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="text-muted-foreground">
          The page you requested doesn&apos;t exist or was moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center rounded-md bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700 transition-colors"
        >
          Go to home
        </Link>
      </div>
    </div>
  );
}
