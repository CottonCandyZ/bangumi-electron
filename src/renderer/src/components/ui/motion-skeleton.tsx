import { cn } from '@renderer/lib/utils'
import { HTMLMotionProps, motion } from 'motion/react'

function MotionSkeleton({ className, ...props }: HTMLMotionProps<'div'>) {
  return (
    <motion.div className={cn('bg-primary/10 animate-pulse rounded-md', className)} {...props} />
  )
}

export { MotionSkeleton }
