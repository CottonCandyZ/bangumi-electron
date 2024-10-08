import { CollectionHeader } from '@renderer/components/headers'
import { Image } from '@renderer/components/image/image'
import { MyLink } from '@renderer/components/my-link'
import { EpisodesGrid } from '@renderer/modules/common/episodes/grid'
import { Card, CardContent } from '@renderer/components/ui/card'
import { CollectionData } from '@renderer/data/types/collection'
import { SubjectType } from '@renderer/data/types/subject'
import { cn } from '@renderer/lib/utils'
import { useLocation } from 'react-router-dom'

export function CollectionItem({ collectionItemInfo }: { collectionItemInfo: CollectionData }) {
  const { pathname } = useLocation()
  const mainSubjectId = pathname.split('/').at(-1)

  // 判断是否要显示 episode
  const needEpisodes =
    collectionItemInfo.subject.type === SubjectType.anime ||
    collectionItemInfo.subject.type === SubjectType.real

  return (
    <MyLink
      to={`/subject/${collectionItemInfo.subject_id}`}
      className={cn('group cursor-default')}
      onClick={(e) =>
        mainSubjectId === collectionItemInfo.subject_id.toString() && e.preventDefault()
      }
    >
      <Card
        className={cn(
          'h-full rounded border-none shadow-none group-hover:bg-accent group-hover:duration-500',
          mainSubjectId === collectionItemInfo.subject_id.toString() && 'bg-accent',
        )}
      >
        <CardContent className="p-2">
          <div className="flex flex-row gap-2">
            <Image
              imageSrc={collectionItemInfo.subject.images.grid}
              className="size-12 shrink-0 overflow-hidden rounded-md border shadow-sm"
            />
            <div className="flex flex-col gap-2">
              <CollectionHeader {...collectionItemInfo.subject} />
              {needEpisodes && (
                <section>
                  <EpisodesGrid
                    eps={collectionItemInfo.subject.eps}
                    size="small"
                    selector={false}
                    subjectId={collectionItemInfo.subject_id.toString()}
                    collectionType={collectionItemInfo.type}
                  />
                </section>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </MyLink>
  )
}
