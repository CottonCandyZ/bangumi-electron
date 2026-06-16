import { Image } from '@renderer/components/image/image'
import { MyLink } from '@renderer/components/my-link'
import { Button } from '@renderer/components/ui/button'
import { Card, CardContent } from '@renderer/components/ui/card'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useSubjectRecommendationsQuery } from '@renderer/data/hooks/api/subject'
import type { SubjectId } from '@renderer/data/types/bgm'
import type { SubjectRecommendation } from '@renderer/data/types/subject'
import {
  formatCompactSubjectCount,
  formatRecommendationSimilarity,
  getRecommendationSubjectImage,
  getRecommendationSubjectSubtitle,
  getRecommendationSubjectTitle,
} from '@renderer/modules/common/subject-recommendation-meta'
import {
  OpenMonoListPanelButton,
  useMonoListPanelOpenHandler,
} from '@renderer/modules/panel/left-panel/open-mono-list-panel'
import type { MonoListPanelTab } from '@renderer/state/panel'

const SUBJECT_RECOMMENDATIONS_PREVIEW_LIMIT = 10

export function SubjectRecommendations({ subjectId }: { subjectId: SubjectId }) {
  const query = useSubjectRecommendationsQuery({
    id: subjectId,
    limit: SUBJECT_RECOMMENDATIONS_PREVIEW_LIMIT,
    refetchPageLimit: 1,
  })
  const loadedRecommendations = query.data?.pages.flatMap((page) => page.data) ?? []
  const recommendations = loadedRecommendations.slice(0, SUBJECT_RECOMMENDATIONS_PREVIEW_LIMIT)
  const total = query.data?.pages[0]?.total ?? loadedRecommendations.length
  const hasMore = total > recommendations.length
  const panelTab = {
    id: `subject-recommendations-${subjectId}`,
    panelTitle: '推荐条目',
    sourceTitle: `条目 #${subjectId}`,
    sourceTo: `/subject/${subjectId}`,
    subjectId,
    title: '推荐条目',
    type: 'subjectRecommendations',
  } satisfies MonoListPanelTab
  const openInSidePanel = useMonoListPanelOpenHandler(panelTab)

  if (query.isLoading) return <SubjectRecommendationsSkeleton />
  if (query.isError || recommendations.length === 0) return null

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-row items-center justify-between gap-3">
        <div className="flex min-w-0 flex-row items-center gap-2">
          <h2 className="text-2xl font-medium">推荐条目</h2>
          <OpenMonoListPanelButton
            className="mt-1 size-8"
            tab={panelTab}
            title="在侧栏打开推荐条目"
          />
        </div>
        {total > 0 && <span className="text-muted-foreground text-sm">{total}</span>}
      </div>
      <div className="grid w-full grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] gap-x-2 gap-y-5 py-2">
        {recommendations.map((item) => (
          <SubjectRecommendationCard item={item} key={item.subject.id} />
        ))}
      </div>
      {hasMore ? (
        <div className="flex justify-center">
          <Button onClick={openInSidePanel} variant="outline">
            在侧栏查看更多 {recommendations.length}/{total}
          </Button>
        </div>
      ) : null}
    </section>
  )
}

function SubjectRecommendationCard({ item }: { item: SubjectRecommendation }) {
  const title = getRecommendationSubjectTitle(item)
  const subtitle = getRecommendationSubjectSubtitle(item)
  const image = getRecommendationSubjectImage(item)
  const score = item.subject.rating?.score
  const ratingTotal = item.subject.rating?.total

  return (
    <MyLink
      className="group flex min-w-0 cursor-default flex-col gap-2"
      to={`/subject/${item.subject.id}`}
    >
      <Card className="relative overflow-hidden rounded-md shadow-none transition-shadow group-hover:-translate-y-0.5 group-hover:shadow-xl group-hover:duration-700">
        {image ? (
          <Image className="aspect-square" imageSrc={image} />
        ) : (
          <div className="bg-muted text-muted-foreground flex aspect-square items-center justify-center text-xs">
            暂无图片
          </div>
        )}
        <CardContent className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-1 bg-gradient-to-t from-black/85 via-black/55 to-transparent px-2 pt-10 pb-2 text-white">
          <div className="flex flex-row items-end justify-between gap-2">
            {score !== undefined && score > 0 ? (
              <span className="text-lg leading-none font-semibold">{score.toFixed(1)}</span>
            ) : (
              <span className="text-xs leading-none text-white/80">暂无评分</span>
            )}
            <span className="text-[0.65rem] leading-none whitespace-nowrap text-white/85">
              相似 {formatRecommendationSimilarity(item.sim)}
            </span>
          </div>
          <div className="flex min-w-0 flex-row items-center gap-1 text-[0.65rem] leading-none text-white/80">
            {ratingTotal !== undefined && ratingTotal > 0 ? (
              <span>{formatCompactSubjectCount(ratingTotal)} 评分</span>
            ) : null}
            {item.count > 0 ? <span>共现 {item.count}</span> : null}
          </div>
        </CardContent>
      </Card>
      <div className="flex min-w-0 flex-col">
        <span className="line-clamp-3 text-xs font-medium">{title}</span>
        {subtitle && <span className="text-muted-foreground line-clamp-1 text-xs">{subtitle}</span>}
      </div>
    </MyLink>
  )
}

function SubjectRecommendationsSkeleton() {
  return (
    <section className="flex flex-col gap-5">
      <Skeleton className="h-8 w-28" />
      <div className="grid w-full grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] gap-x-3 gap-y-5 py-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <div className="flex flex-col gap-2" key={index}>
            <Skeleton className="aspect-square rounded-md" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    </section>
  )
}
