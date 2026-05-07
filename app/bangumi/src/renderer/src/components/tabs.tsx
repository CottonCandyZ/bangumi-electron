import { cn } from '@renderer/lib/utils'
import { motion } from 'motion/react'

type TabsOnlyProps = {
  currentSelect: string
  setCurrentSelect: (id: string, value: string) => void
  tabsContent: Set<string>
  layoutId: string
  className?: string
}

export function Tabs({
  currentSelect,
  setCurrentSelect,
  tabsContent,
  className,
  layoutId,
}: TabsOnlyProps) {
  return (
    <motion.div
      className={cn(
        'bg-muted text-muted-foreground inline-flex min-h-9 flex-wrap items-center justify-center rounded-lg p-1',
        className,
      )}
      key={layoutId}
      layout
      layoutRoot
    >
      {[...tabsContent].map((item) => (
        <button
          className={cn(
            'ring-offset-background focus-visible:ring-ring relative inline-flex items-center justify-center rounded-md px-3 py-1 text-sm font-medium whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50',
            item === currentSelect && 'text-foreground cursor-default',
          )}
          key={item}
          onClick={() => setCurrentSelect(layoutId, item)}
        >
          {currentSelect === item && (
            <motion.div
              layoutId={layoutId}
              className="bg-background absolute inset-0 rounded-md shadow-sm"
              style={{ originY: 'top' }}
            />
          )}
          <span className="z-10">{item}</span>
        </button>
      ))}
    </motion.div>
  )
}
