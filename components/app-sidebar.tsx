"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Car, Users, FileSignature, BarChart3, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import Image from "next/image";
import Swal from "sweetalert2";

const navigation = [
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Cars", href: "/cars", icon: Car },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Contracts", href: "/contracts", icon: FileSignature },
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
      reverseButtons: true
    });

    if (result.isConfirmed) {
      handleLogout();
    }
  };

  return (
    <div className="flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
        <span className="text-lg font-semibold text-sidebar-foreground">
          Cartract Back Office
        </span>
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
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
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
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>

        <div className="mt-6 flex flex-col items-center text-xs text-muted-foreground">
          <span>Powered by</span>

          {/* Light logo */}
          <Image
            src="/logo1.png"
            alt="Powered by Light Logo"
            width={90}
            height={90}
            className="opacity-80 mt-1 dark:hidden"
          />
          {/* Dark logo */}
          <Image
            src="/logo.png"
            alt="Powered by Dark Logo"
            width={90}
            height={90}
            className="opacity-80 mt-1 hidden dark:block"
          />
        </div>
      </nav>
    </div>
  );
}
