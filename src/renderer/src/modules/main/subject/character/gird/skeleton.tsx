import { Skeleton } from '@renderer/components/ui/skeleton'

export function CharactersGridSkeleton() {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,_minmax(14rem,_1fr))] gap-3 py-2">
      {Array(8)
        .fill(0)
        .map((_, index) => (
          <Skeleton className="h-20" key={index} />
        ))}
    </div>
  )
}
