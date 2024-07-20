import { cn } from '@renderer/lib/utils'
import { HTMLMotionProps, motion } from 'framer-motion'

function MotionSkeleton({ className, ...props }: HTMLMotionProps<'div'>) {
  return (
    <motion.div className={cn('animate-pulse rounded-md bg-primary/10', className)} {...props} />
  )
}

export { MotionSkeleton }
