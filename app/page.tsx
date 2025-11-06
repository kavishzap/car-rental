"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { isAuthenticated } from "@/lib/auth"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const authed = await isAuthenticated()
      if (authed) {
        router.push("/reports")
      } else {
        router.push("/login")
      }
    }

    checkAuth()
  }, [router])

  return null
}
