import { CarouselNext, CarouselPrevious } from '@renderer/components/ui/carousel'
import { cn } from '@renderer/lib/utils'

export function CarouselNavigation({ label, className }: { label: string; className?: string }) {
  return (
    <div
      className={cn(
        'border-border/60 flex shrink-0 items-center rounded-md border p-0.5',
        className,
      )}
      role="group"
      aria-label={`浏览${label}`}
    >
      <CarouselPrevious
        variant="ghost"
        aria-label={`向前浏览${label}`}
        className="text-muted-foreground relative top-auto left-auto size-7 translate-y-0 rounded-sm shadow-none disabled:opacity-25 [&_svg]:size-3.5"
      />
      <CarouselNext
        variant="ghost"
        aria-label={`向后浏览${label}`}
        className="text-muted-foreground relative top-auto right-auto size-7 translate-y-0 rounded-sm shadow-none disabled:opacity-25 [&_svg]:size-3.5"
      />
    </div>
  )
}
