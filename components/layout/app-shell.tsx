"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  LogOut,
  Menu,
  Plane,
  Printer,
  Settings2,
  ShoppingBag,
  Users,
  Wallet,
} from "lucide-react";

import { LoginScreen } from "@/components/auth/login-screen";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/trips", label: "Trip", icon: Plane },
  { href: "/orders", label: "Pesanan", icon: ShoppingBag },
  { href: "/customers", label: "Customer", icon: Users },
  { href: "/costs", label: "Biaya Operasional", icon: Wallet },
  { href: "/labels", label: "Label Resi", icon: Printer },
  { href: "/settings", label: "Pengaturan", icon: Settings2 },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

function Brand() {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-md shadow-emerald-950/40">
        <ShoppingBag className="size-5" />
      </div>
      <div className="min-w-0 leading-tight">
        <div className="truncate font-heading text-[15px] font-semibold text-white">
          {APP_NAME}
        </div>
        <div className="truncate text-[11px] text-white/45">{APP_TAGLINE}</div>
      </div>
    </div>
  );
}

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1 px-3">
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/60 hover:bg-white/5 hover:text-white",
            )}
          >
            <item.icon className="size-4 shrink-0" />
            {item.label}
            {active && (
              <span className="ml-auto size-1.5 rounded-full bg-emerald-400" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);
  const { ready, authed, logout } = useAuth();

  // Halaman cetak label berdiri sendiri (tanpa shell) — tetap wajib login.
  const isPrintRoute = pathname.startsWith("/labels/print");

  // Splash singkat sambil membaca status login dari localStorage
  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="flex size-11 animate-pulse items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-lg shadow-emerald-950/30">
          <ShoppingBag className="size-6" />
        </div>
      </div>
    );
  }

  if (!authed) {
    return <LoginScreen />;
  }

  if (isPrintRoute) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-dvh">
      {/* Sidebar desktop */}
      <aside className="print-hidden fixed inset-y-0 left-0 z-40 hidden w-60 flex-col bg-sidebar text-sidebar-foreground lg:flex">
        <div className="px-5 pt-6 pb-5">
          <Brand />
        </div>
        <NavLinks pathname={pathname} />
        <div className="mt-auto space-y-3 px-5 py-5">
          <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-[11px] leading-relaxed text-white/50">
            {APP_TAGLINE} — kelola trip, pesanan, dan keuangan dalam satu tempat.
          </div>
          <div className="flex items-center justify-between gap-2">
            <ThemeToggle className="text-sidebar-foreground/60 hover:bg-white/5 hover:text-white" />
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-sidebar-foreground/60 hover:bg-white/5 hover:text-white"
            >
              <LogOut /> Keluar
            </Button>
          </div>
        </div>
      </aside>

      {/* Header mobile */}
      <header className="print-hidden fixed inset-x-0 top-0 z-40 border-b bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur lg:hidden">
        <div className="flex h-14 items-center gap-1.5 px-3">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" aria-label="Buka menu" />
              }
            >
              <Menu />
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-72 border-0 bg-sidebar pt-[env(safe-area-inset-top)] text-sidebar-foreground"
            >
              <SheetTitle className="sr-only">Menu navigasi</SheetTitle>
              <div className="px-2 pt-6 pb-4">
                <Brand />
              </div>
              <NavLinks pathname={pathname} onNavigate={() => setSheetOpen(false)} />
            </SheetContent>
          </Sheet>
          <div className="min-w-0 flex-1">
            <Brand />
          </div>
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            aria-label="Keluar"
            title="Keluar"
          >
            <LogOut />
          </Button>
        </div>
      </header>

      {/* Konten */}
      <div className="flex w-full min-w-0 flex-col lg:pl-60">
        <main className="flex-1 px-4 pt-[calc(env(safe-area-inset-top)_+_5rem)] pb-10 md:px-8 lg:pt-8">
          {children}
        </main>
        <footer className="print-hidden px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center text-xs text-muted-foreground md:px-8 lg:text-left">
          © {new Date().getFullYear()} {APP_NAME} · Manajemen Jasa Titip
        </footer>
      </div>
    </div>
  );
}
