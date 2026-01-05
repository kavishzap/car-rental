"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { isAuthenticated } from "@/lib/auth"
import { AppSidebar } from "@/components/app-sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuth, setIsAuth] = useState<boolean | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const authed = await isAuthenticated()
      setIsAuth(authed)
      if (!authed) {
        router.push("/login")
      }
    }

    checkAuth()
  }, [router, pathname])

  // Show nothing while checking authentication
  if (isAuth === null) {
    return null
  }

  // If not authenticated, don't render (redirect is happening)
  if (!isAuth) {
    return null
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
