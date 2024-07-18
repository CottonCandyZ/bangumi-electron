import { cn } from '@renderer/lib/utils'
import { motion } from 'framer-motion'

type TabsOnlyProps = {
  currentSelect: string
  setCurrentSelect: React.Dispatch<React.SetStateAction<string>>
  tabsContent: Set<string>
  layoutId: string
  className?: string
}

export default function TabsOnly({
  currentSelect,
  setCurrentSelect,
  tabsContent,
  className,
  layoutId,
}: TabsOnlyProps) {
  return (
    <motion.div
      className={cn(
        'inline-flex min-h-9 flex-wrap items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground',
        className,
      )}
      layout
      layoutRoot
    >
      {[...tabsContent].map((item) => (
        <button
          className={cn(
            'relative inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
            item === currentSelect && 'cursor-default text-foreground',
          )}
          key={item}
          onClick={() => setCurrentSelect(item)}
        >
          {currentSelect === item && (
            <motion.div
              className="absolute inset-0 rounded-md bg-background shadow"
              layoutId={layoutId}
            />
          )}
          <span className="z-10">{item}</span>
        </button>
      ))}
    </motion.div>
  )
}
