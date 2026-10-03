import { Toaster } from "@ciee-curriculos/ui/components/toast";
import { TooltipProvider } from "@ciee-curriculos/ui/components/tooltip";
import { cn } from "@ciee-curriculos/ui/lib/utils";
import {
  Link,
  useRouterState,
  HeadContent,
  Outlet,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { Plus, Users } from "lucide-react";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

import "../index.css";

const COPYRIGHT_YEAR = new Date().getFullYear();

export interface RouterAppContext {}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootComponent,
  head: () => ({
    meta: [
      {
        title: "Candidatos | CIEE/PR",
      },
      {
        name: "description",
        content: "Gestão de candidatos do CIEE/PR.",
      },
    ],
    links: [
      {
        rel: "icon",
        href: "/favicon.ico",
      },
    ],
  }),
});

function RootComponent() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const previousPath = useRef(pathname);
  useEffect(() => {
    if (previousPath.current !== pathname) {
      document
        .querySelector<HTMLElement>("#main-content")
        ?.focus({ preventScroll: true });
      previousPath.current = pathname;
    }
  }, [pathname]);
  return (
    <TooltipProvider>
      <HeadContent />
      <a className="skip-link" href="#main-content">
        Pular para o conteúdo
      </a>
      <div className="app-shell">
        <header className="topbar">
          <Link className="brand-lockup" to="/candidates">
            <img
              className="brand-logo"
              src="/brand/ciee-pr-white.svg"
              alt="CIEE/PR — Centro de Integração Empresa-Escola do Paraná"
              width={108}
              height={54}
            />
          </Link>
          <div className="topbar-user">
            <span className="avatar-dot">A</span>
            <span>Administrador</span>
          </div>
        </header>
        <aside className="app-sidebar">
          <nav aria-label="Navegação principal" className="sidebar-nav">
            <SidebarLink to="/candidates">
              <Users aria-hidden="true" />
              Candidatos
            </SidebarLink>
            <SidebarLink to="/candidates/new">
              <Plus aria-hidden="true" />
              Novo cadastro
            </SidebarLink>
          </nav>
        </aside>
        <div className="app-main">
          <main className="page-content" id="main-content" tabIndex={-1}>
            <Outlet />
          </main>
          <footer className="page-footer">
            <span>© {COPYRIGHT_YEAR} CIEE/PR</span>
            <span>Portal de gestão de candidatos</span>
          </footer>
        </div>
      </div>
      <Toaster />
    </TooltipProvider>
  );
}

function SidebarLink({
  children,
  to,
}: {
  children: ReactNode;
  to: "/" | "/candidates" | "/candidates/new";
}) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const isActive =
    to === "/candidates"
      ? pathname === "/" ||
        (pathname.startsWith("/candidates") &&
          !pathname.startsWith("/candidates/new"))
      : pathname.startsWith(to);

  let currentLocation: "page" | "location" | undefined;
  if (isActive) {
    currentLocation = pathname === to ? "page" : "location";
  }

  return (
    <Link
      activeOptions={{ exact: true }}
      aria-current={currentLocation}
      className={cn("sidebar-link", isActive && "sidebar-link-active")}
      to={to}
    >
      {children}
    </Link>
  );
}
