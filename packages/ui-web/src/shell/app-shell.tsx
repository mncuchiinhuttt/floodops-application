import type { ReactNode } from "react";
import { cn } from "../lib/utils";

export type ShellNavItem = { id: string; label: string; /** Single short word for the bottom tab bar; defaults to label. */ shortLabel?: string | undefined; href: string; icon?: ReactNode; current?: boolean };
export type ShellLinkProps = { className: string; "aria-current"?: "page"; children: ReactNode };
export type AppShellProps = {
  brand: ReactNode; navLabel: string; nav: readonly ShellNavItem[]; children: ReactNode;
  /** Right side of the top bar: clock chip, Simulation pill, role chip, refresh. */
  actions?: ReactNode; sidebarFooter?: ReactNode;
  /** Router adapters pass a client-side link; ui-web stays router-free. */
  renderLink?: (item: ShellNavItem, props: ShellLinkProps) => ReactNode;
};
const defaultLink = (item: ShellNavItem, props: ShellLinkProps) => <a href={item.href} {...props} />;
const sideClass = (current?: boolean) => cn("flex min-h-10 items-center gap-2.5 rounded-lg px-3 text-sm no-underline outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50",
  current ? "bg-secondary font-medium text-foreground" : "text-foreground/70 hover:bg-accent hover:text-foreground");
const tabClass = (current?: boolean) => cn("flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-xs leading-tight no-underline outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50",
  current ? "font-medium text-primary" : "text-muted-foreground hover:text-foreground");
/** Left sidebar from 1024px, bottom tab bar below (max 5 items). Content is the only scroll region. */
export function AppShell({ brand, navLabel, nav, children, actions, sidebarFooter, renderLink = defaultLink }: AppShellProps) {
  const tabs = nav.slice(0, 5);
  return <div className="min-h-dvh bg-background lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
    <aside className="sticky top-0 hidden h-dvh flex-col border-r bg-card lg:flex">
      <div className="flex h-14 shrink-0 items-center gap-2 border-b px-4 text-base font-semibold tracking-tight">{brand}</div>
      <nav aria-label={navLabel} className="grid gap-0.5 overflow-y-auto p-3">
        {nav.map(item => <span key={item.id} className="contents">{renderLink(item, { className: sideClass(item.current), "aria-current": item.current ? "page" : undefined,
          children: <>{item.icon}<span className="min-w-0 truncate">{item.label}</span></> })}</span>)}
      </nav>
      {sidebarFooter && <div className="mt-auto border-t p-4 text-xs text-muted-foreground">{sidebarFooter}</div>}
    </aside>
    <div className="flex min-w-0 flex-col">
      <header className="sticky top-0 z-30 flex min-h-14 flex-wrap items-center gap-x-3 gap-y-2 border-b bg-card px-4 py-2 sm:px-6">
        <div className="mr-auto flex items-center gap-2 text-base font-semibold tracking-tight lg:hidden">{brand}</div>
        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">{actions}</div>
      </header>
      <main className="mx-auto w-full max-w-[1400px] min-w-0 flex-1 p-4 pb-24 sm:p-6 sm:pb-24 lg:pb-6">{children}</main>
    </div>
    <nav aria-label={navLabel} className="fixed inset-x-0 bottom-0 z-30 border-t bg-card pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className="mx-auto grid max-w-xl" style={{ gridTemplateColumns: `repeat(${Math.max(tabs.length, 1)}, minmax(0, 1fr))` }}>
        {tabs.map(item => <span key={item.id} className="contents">{renderLink(item, { className: tabClass(item.current), "aria-current": item.current ? "page" : undefined,
          children: <>{item.icon}<span className="max-w-full truncate">{item.shortLabel ?? item.label}</span></> })}</span>)}
      </div>
    </nav>
  </div>;
}
