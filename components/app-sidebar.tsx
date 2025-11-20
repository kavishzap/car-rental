"use client";

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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import Swal from "sweetalert2";

const navigation = [
  { name: "Dashboard", href: "/reports", icon: BarChart3 },
  { name: "Cars", href: "/cars", icon: Car },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Contracts", href: "/contracts", icon: FileSignature },
  { name: "Planner", href: "/planner", icon: Calendar },
  { name: "Company", href: "/company", icon: BriefcaseBusiness },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();

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

  return (
    <div className="flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Brand / Logo */}
      <div className="flex h-16 items-center border-b border-sidebar-border px-6 bg-sidebar/80 backdrop-blur">
        <div className="flex items-center gap-3">
          {/* Logo avatar */}
          <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-sidebar-border/70 bg-sidebar-accent/20">
            {/* If you have a static logo in /public, use it here */}
            <Image
              src="/Logo Paint retouched and resized.JPG" // TODO: replace with your logo path
              alt="Company Logo"
              fill
              className="object-contain p-1.5"
            />
          </div>

          {/* Company name */}
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
              Claire Sailesh
            </span>
            <span className="text-[11px] uppercase tracking-[0.18em] text-sidebar-foreground/70">
              Car Rental
            </span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}

        {/* Logout */}
        <button
          onClick={onLogoutClick}
          className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>

        {/* Powered by */}
        <div className="mt-6 flex flex-col items-center text-xs text-muted-foreground">
          <span>Powered by</span>

          {/* Light logo */}
          <Image
            src="/logo1.png"
            alt="Powered by Light Logo"
            width={90}
            height={90}
            className="mt-1 opacity-80 dark:hidden"
          />
          {/* Dark logo */}
          <Image
            src="/logo.png"
            alt="Powered by Dark Logo"
            width={90}
            height={90}
            className="mt-1 hidden opacity-80 dark:block"
          />
        </div>
      </nav>
    </div>
  );
}
