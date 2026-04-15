"use client"

import type React from "react"

import { Moon, Sun, Search } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface PageHeaderProps {
  title: string
  actions?: React.ReactNode
  showSearch?: boolean
  onSearch?: (value: string) => void
}

export function PageHeader({ title, actions, showSearch, onSearch }: PageHeaderProps) {
  const { setTheme, theme } = useTheme()

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-card px-4 py-3 sm:px-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
        <h1 className="shrink-0 text-xl font-semibold text-card-foreground sm:text-2xl md:min-w-0 md:truncate">
          {title}
        </h1>

        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-stretch sm:gap-3 md:justify-end">
          {showSearch && (
            <div className="relative min-w-0 w-full sm:min-w-0 sm:flex-1 md:w-64 md:max-w-xs md:flex-none lg:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="w-full pl-9"
                onChange={(e) => onSearch?.(e.target.value)}
              />
            </div>
          )}

          <div className="flex w-full min-w-0 items-stretch gap-2 sm:w-auto sm:items-center sm:justify-end">
            {actions != null && (
              <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-initial sm:flex-row sm:items-center sm:gap-2 [&>*]:w-full sm:[&>*]:w-auto">
                {actions}
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="relative shrink-0"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
