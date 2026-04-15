"use client";

import type React from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Car,
  Users,
  FileSignature,
  BarChart3,
  LogOut,
  BriefcaseBusiness,
  Calendar,
  CalendarRange,
  FileText,
  Menu,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";

const COLLAPSED_KEY = "car-rental-sidebar-collapsed";

const navigation = [
  { name: "Dashboard", href: "/reports", icon: BarChart3 },
  { name: "Cars", href: "/cars", icon: Car },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Contracts", href: "/contracts", icon: FileSignature },
  { name: "Planner", href: "/planner", icon: Calendar },
  { name: "Planner 2", href: "/planner-2", icon: CalendarRange },
  { name: "Vehicle Registration", href: "/vehicle-registration", icon: FileText },
  { name: "Company", href: "/company", icon: BriefcaseBusiness },
];

type AppSidebarProps = {
  children: React.ReactNode;
};

export function AppSidebar({ children }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSED_KEY) === "true");
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(COLLAPSED_KEY, collapsed ? "true" : "false");
    } catch {
      /* ignore */
    }
  }, [collapsed, hydrated]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = prev;
    }
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const handleLogout = async () => {
    await logout();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    router.push("/login");
  };

  const onLogoutClick = async () => {
    const result = await Swal.fire({
      title: "Logout?",
      text: "Are you sure you want to logout?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, logout",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      handleLogout();
    }
  };

  const navLinkClass = (active: boolean) =>
    cn(
      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
      collapsed && "md:justify-center md:gap-0 md:px-2 md:py-2.5",
      active
        ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
        : "text-sidebar-foreground hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground"
    );

  return (
    <div className="flex h-screen min-h-0 w-full overflow-hidden bg-background">
      {/* Mobile overlay */}
      <button
        type="button"
        aria-label="Close menu"
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity md:hidden",
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setMobileOpen(false)}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-full max-w-[min(100vw,16rem)] flex-col border-r border-sidebar-border bg-sidebar shadow-lg transition-[transform,width] duration-200 ease-out md:relative md:z-0 md:max-w-none md:shadow-none",
          "w-64 md:shrink-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          collapsed ? "md:w-[4.5rem] md:min-w-[4.5rem] md:max-w-[4.5rem]" : "md:w-64"
        )}
      >
        {/* Brand */}
        <div
          className={cn(
            "flex h-16 shrink-0 items-center border-b border-sidebar-border bg-sidebar/80 px-3 backdrop-blur md:px-4",
            collapsed ? "md:justify-center md:px-2" : "justify-between gap-2"
          )}
        >
          <div
            className={cn(
              "min-w-0 flex-1 truncate text-sm font-semibold leading-tight tracking-tight text-sidebar-foreground",
              collapsed && "md:sr-only"
            )}
          >
            Claire Sailesh
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="hidden md:flex"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              onClick={() => setCollapsed((c) => !c)}
            >
              {collapsed ? (
                <ChevronRight className="h-5 w-5" />
              ) : (
                <ChevronLeft className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3 md:p-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                title={collapsed ? item.name : undefined}
                onClick={() => setMobileOpen(false)}
                className={navLinkClass(isActive)}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span className={cn("truncate", collapsed && "md:sr-only")}>{item.name}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={onLogoutClick}
            title={collapsed ? "Logout" : undefined}
            className={cn(
              "mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              collapsed && "md:justify-center md:gap-0 md:px-2"
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span className={cn("truncate", collapsed && "md:sr-only")}>Logout</span>
          </button>

          <div
            className={cn(
              "mt-auto flex flex-col items-center gap-1 border-t border-sidebar-border/60 pt-4 text-xs text-muted-foreground",
              collapsed && "md:hidden"
            )}
          >
            <span>Powered by</span>
            <Image
              src="/logo1.png"
              alt="Powered by Light Logo"
              width={90}
              height={90}
              className="mt-1 opacity-80 dark:hidden"
            />
            <Image
              src="/logo.png"
              alt="Powered by Dark Logo"
              width={90}
              height={90}
              className="mt-1 hidden opacity-80 dark:block"
            />
          </div>
        </nav>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-3 md:hidden">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
            Claire Sailesh
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
