import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@renderer/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center select-none whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        wantToWatch:
          'bg-(--want-to-watch-accent) text-(--want-to-watch-accent-foreground) shadow-inner hover:bg-(--want-to-watch) hover:text-(--want-to-watch-foreground)',
        watched:
          'border border-input bg-(--watched-accent) text-(--watched-accent-foreground) shadow-inner hover:shadow-none hover:bg-(--watched) hover:text-(--watched-foreground)',
        abandoned:
          'border border-primary-foreground line-through shadow-inner hover:bg-accent hover:text-accent-foreground text-muted-foreground',
        noAired:
          'hover:bg-accent hover:text-accent-foreground text-muted-foreground hover:shadow-sm',
        onAir:
          'border border-input bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        aired:
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:shadow-inner',
        wantToWatchHover: 'shadow-inner bg-(--want-to-watch) text-(--want-to-watch-foreground)',
        watchedHover:
          'border border-input shadow-inner hover:shadow-none bg-(--watched) text-(--watched-foreground)',
        abandonedHover:
          'border border-primary-foreground line-through shadow-inner bg-accent text-accent-foreground text-muted-foreground',
        noAiredHover: 'bg-accent text-accent-foreground shadow-sm',
        onAirHover: 'border border-input text-muted-foreground bg-accent text-accent-foreground',
        airedHover: 'border border-input bg-accent text-accent-foreground shadow-inner',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'aired',
      size: 'default',
    },
  },
)

function EpisodeButton({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { EpisodeButton, buttonVariants }
