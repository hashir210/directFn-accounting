import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-sm px-2.5 py-1 text-xs font-medium transition-colors focus:outline-none focus:shadow-focus-glow border border-transparent",
  {
    variants: {
      variant: {
        default: "bg-primary text-white hover:bg-brand-primary-light",
        secondary: "bg-status-neutral-bg text-status-neutral-text",
        outline: "text-foreground border-border",
        success: "bg-status-success-bg text-status-success-text",
        warning: "bg-status-warning-bg text-status-warning-text",
        danger: "bg-status-danger-bg text-status-danger-text",
        destructive: "bg-status-danger-bg text-status-danger-text",
        neutral: "bg-status-neutral-bg text-status-neutral-text",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
