import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:shadow-focus-glow disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-white shadow-soft-raised hover:bg-brand-primary-light active:shadow-soft-pressed active:bg-brand-primary-dark",
        accent:
          "bg-accent text-brand-primary-dark shadow-soft-raised hover:bg-brand-accent-pale active:shadow-soft-pressed",
        destructive:
          "bg-destructive text-white shadow-soft-raised hover:opacity-90 active:shadow-soft-pressed",
        outline:
          "border border-border bg-transparent text-foreground hover:bg-muted active:shadow-soft-pressed",
        secondary:
          "border border-border bg-transparent text-foreground hover:bg-muted active:shadow-soft-pressed",
        ghost: "bg-transparent text-foreground hover:bg-muted active:shadow-soft-pressed",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        xs: "h-6 rounded-md px-2 text-xs",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
        "icon-xs": "h-6 w-6 rounded-md",
        "icon-sm": "h-8 w-8 rounded-md",
        "icon-lg": "h-10 w-10 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  render?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, render, ...props }, ref) => {
    if (render && React.isValidElement(render)) {
      return React.cloneElement(render as React.ReactElement<{ className?: string }>, {
        className: cn(buttonVariants({ variant, size, className }), (render.props as { className?: string }).className),
        ...props,
      })
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
