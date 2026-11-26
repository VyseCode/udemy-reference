"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  BookIcon,
  CertificateIcon,
  CompassIcon,
  DashboardIcon,
  LogoMark,
  LogoutIcon,
  MenuIcon,
  SearchIcon,
  TeachIcon,
  CloseIcon,
} from "@/components/Icons";

type ShellUser = { name: string; email: string; role: "student" | "instructor" };

const allLinks = [
  { href: "/browse", label: "Browse courses", Icon: CompassIcon, roles: ["student", "instructor"] },
  { href: "/dashboard", label: "My learning", Icon: BookIcon, roles: ["student"] },
  { href: "/certificates", label: "Certificates", Icon: CertificateIcon, roles: ["student"] },
  { href: "/teach", label: "Instructor studio", Icon: TeachIcon, roles: ["instructor"] },
];

export function AppShell({ user, children }: { user: ShellUser; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const links = allLinks.filter((link) => link.roles.includes(user.role));

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  function search(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const term = query.trim();
    router.push(term ? `/browse?q=${encodeURIComponent(term)}` : "/browse");
    setOpen(false);
  }

  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen">
      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-ink/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line bg-surface px-4 py-6 transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-2">
          <Link href="/browse" className="flex items-center gap-3" onClick={() => setOpen(false)}>
            <LogoMark className="h-8 w-8" />
            <span className="font-serif text-xl tracking-tight">Lumen</span>
          </Link>
          <button
            type="button"
            className="rounded p-1 text-muted lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-8 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
          Workspace
        </p>
        <nav className="mt-3 space-y-1">
          {links.map(({ href, label, Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition ${
                  active
                    ? "bg-accent/10 font-semibold text-accent-deep"
                    : "text-muted hover:bg-paper hover:text-ink"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-line pt-4">
          <div className="flex items-center gap-3 px-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-olive text-xs font-semibold text-white">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-muted">{user.role === "instructor" ? "Instructor" : "Learner"}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="mt-3 flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted transition hover:bg-paper hover:text-ink"
          >
            <LogoutIcon className="h-5 w-5" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-paper/95 px-4 backdrop-blur sm:px-8">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-md border border-line p-2 text-muted lg:hidden"
            aria-label="Open navigation"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
          <form onSubmit={search} className="relative max-w-md flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
              <SearchIcon className="h-4 w-4" />
            </span>
            <label htmlFor="global-search" className="sr-only">
              Search courses
            </label>
            <input
              id="global-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search courses..."
              className="w-full rounded-md border border-line bg-surface py-2 pl-9 pr-3 text-sm outline-none placeholder:text-muted/70 focus:border-accent"
            />
          </form>
          <div className="ml-auto flex items-center gap-2 text-xs text-muted">
            <DashboardIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Lumen learning workspace</span>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-8 sm:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
