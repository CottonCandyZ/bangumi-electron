import { Image } from '@renderer/components/image/image'
import ScrollWrapper from '@renderer/components/scroll/scroll-wrapper'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useQueryPersonsById } from '@renderer/data/hooks/api/pesron'
import { PersonId } from '@renderer/data/types/bgm'
import { renderBBCode } from '@renderer/lib/utils/bbcode'
import { isEmpty } from '@renderer/lib/utils/string'

export function Detail({ personId }: { personId: PersonId }) {
  const personDetailQuery = useQueryPersonsById({ id: personId })
  const personDetail = personDetailQuery.data

  if (!personDetail)
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-row gap-4">
          <Skeleton className="aspect-square basis-1/4" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-10" />
          </div>
        </div>
        <Skeleton className="h-10" />
      </div>
    )
  let cn_name: string | null = null
  for (const item of personDetail.infobox) {
    if (item.key === '简体中文名') {
      cn_name = item.value as string
    }
  }
  const renderSummery = renderBBCode(personDetail.summary)
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row gap-4">
        {!isEmpty(personDetail.img) && (
          <Image
            imageSrc={personDetail.img}
            className="basis-1/3 overflow-hidden rounded-md"
            loadingClassName="aspect-square"
            loading="eager"
          />
        )}
        <section className="flex flex-col">
          <h3 className="text-base font-medium">{personDetail.name}</h3>
          {cn_name && <h4 className="font-medium text-muted-foreground">{cn_name}</h4>}
        </section>
      </div>
      <section>
        {personDetail.summary !== '' ? (
          <ScrollWrapper
            className="bbcode max-h-40 whitespace-pre-line"
            options={{ overflow: { x: 'hidden' } }}
          >
            {renderSummery}
          </ScrollWrapper>
        ) : (
          <p>暂时还没有说明哦～</p>
        )}
      </section>
    </div>
  )
}
