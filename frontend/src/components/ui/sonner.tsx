"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-[var(--bg-surface-raised)] group-[.toaster]:text-[var(--neutral-ink)] group-[.toaster]:border-[var(--border-subtle)] group-[.toaster]:shadow-soft-raised font-sans font-medium rounded-xl p-4 flex gap-3",
          description: "group-[.toast]:opacity-80 font-normal text-sm",
          success: "group-[.toaster]:bg-emerald-50 group-[.toaster]:text-emerald-700 group-[.toaster]:border-emerald-200",
          error: "group-[.toaster]:bg-red-50 group-[.toaster]:text-red-700 group-[.toaster]:border-red-200",
          warning: "group-[.toaster]:bg-yellow-50 group-[.toaster]:text-yellow-700 group-[.toaster]:border-yellow-200",
          info: "group-[.toaster]:bg-blue-50 group-[.toaster]:text-blue-700 group-[.toaster]:border-blue-200",
          actionButton: "group-[.toast]:bg-[var(--brand-primary)] group-[.toast]:text-white",
          cancelButton: "group-[.toast]:bg-[var(--bg-surface-sunken)] group-[.toast]:text-[var(--neutral-ink)]",
          icon: "mt-0.5 size-5",
        }
      }}
      {...props}
    />
  )
}

export { Toaster }
