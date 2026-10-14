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
          'bg-(--watched-accent) text-(--watched-accent-foreground) hover:bg-(--watched) hover:text-(--watched-foreground)',
        abandoned:
          'border border-primary-foreground line-through shadow-inner hover:bg-accent hover:text-accent-foreground text-muted-foreground',
        noAired:
          'hover:bg-accent hover:text-accent-foreground text-muted-foreground hover:shadow-sm',
        onAir:
          'bg-foreground/2.5 text-muted-foreground hover:bg-foreground/6 hover:text-foreground dark:bg-foreground/4 dark:hover:bg-foreground/8',
        aired:
          'bg-foreground/4.5 text-foreground/85 hover:bg-foreground/9 hover:text-foreground dark:bg-foreground/8 dark:hover:bg-foreground/14',
        wantToWatchHover: 'shadow-inner bg-(--want-to-watch) text-(--want-to-watch-foreground)',
        watchedHover: 'bg-(--watched) text-(--watched-foreground)',
        abandonedHover:
          'border border-primary-foreground line-through shadow-inner bg-accent text-accent-foreground text-muted-foreground',
        noAiredHover: 'bg-accent text-accent-foreground shadow-sm',
        onAirHover: 'bg-foreground/6 text-foreground dark:bg-foreground/8',
        airedHover: 'bg-foreground/9 text-foreground dark:bg-foreground/14',
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
