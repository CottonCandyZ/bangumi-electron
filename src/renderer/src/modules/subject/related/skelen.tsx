import { Skeleton } from '@renderer/components/ui/skeleton'

export default function RelatedGridSkeleton() {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,_minmax(8rem,_1fr))] gap-3 py-2">
      {Array(5)
        .fill(0)
        .map((_, index) => (
          <Skeleton className="aspect-square" key={index} />
        ))}
    </div>
  )
}
