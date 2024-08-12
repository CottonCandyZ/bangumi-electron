import { Image } from '@renderer/components/base/Image'
import { MyLink } from '@renderer/components/base/my-link'
import ScrollWrapper from '@renderer/components/base/scroll-warpper'
import ScoreStarHalf from '@renderer/components/search/score-half'
import { Badge } from '@renderer/components/ui/badge'
import { Button } from '@renderer/components/ui/button'
import { Card } from '@renderer/components/ui/card'
import { Separator } from '@renderer/components/ui/separator'
import { SearchData } from '@renderer/data/types/search'
import { SubjectType } from '@renderer/data/types/subject'
import { isEmpty } from '@renderer/lib/utils/string'

const ICON_MAP = {
  [SubjectType.anime]: <span className="i-mingcute-tv-2-fill mt-[6px]" />,
  [SubjectType.book]: <span className="i-mingcute-book-2-fill mt-[6px]" />,
  [SubjectType.game]: <span className="i-mingcute-game-2-fill mt-[6px]" />,
  [SubjectType.music]: <span className="i-mingcute-music-2-fill mt-[6px]" />,
  [SubjectType.real]: <span className="i-mingcute-tv-1-fill mt-[6px]" />,
}

export default function SearchItemCard({ searchItem }: { searchItem: SearchData }) {
  return (
    <MyLink to={`/subject/${searchItem.id}`}>
      <Card className="flex h-full max-h-52 shrink-0 flex-col gap-2 overflow-hidden p-2 shadow-none hover:shadow-lg hover:duration-500">
        <div className="flex h-full flex-row gap-2">
          {!isEmpty(searchItem.image) ? (
            <Image
              imageSrc={searchItem.image}
              className="h-fit w-24 shrink-0 overflow-hidden rounded-lg shadow"
              loadingClassName="aspect-[2/3]"
              isLoadInit
            />
          ) : (
            <div className="flex size-24 shrink-0 items-center justify-center rounded-lg border text-xs shadow">
              还没有图片哦
            </div>
          )}
          <div className="flex h-full w-full flex-col">
            <div className="flex w-full flex-col">
              <section className="w-fll flex flex-row items-start justify-between gap-1">
                <Header {...searchItem} />
                {searchItem.rank !== 0 && (
                  <Badge className="shrink-0 bg-sky-600 text-white shadow-none hover:bg-sky-600">
                    Rank {searchItem.rank}
                  </Badge>
                )}
              </section>
              <div className="flex flex-row items-center gap-1">
                <div className="text-base text-muted-foreground">{ICON_MAP[searchItem.type]}</div>
                <Separator orientation="vertical" className="h-4" />
                <section className="flex flex-row items-center gap-1">
                  {searchItem.score !== 0 ? (
                    <>
                      <div className="mt-[1px]">
                        <ScoreStarHalf score={searchItem.score} />
                      </div>
                      <span
                        className="font-medium"
                        style={{ color: `hsl(var(--chart-score-${Math.floor(searchItem.score)}))` }}
                      >
                        {searchItem.score}
                      </span>
                    </>
                  ) : (
                    <span>--</span>
                  )}
                </section>
                <Separator orientation="vertical" className="h-4" />
                {!isEmpty(searchItem.date) ? (
                  <span className="text-xs font-medium text-muted-foreground">
                    {searchItem.date}
                  </span>
                ) : (
                  <span>--</span>
                )}
              </div>
            </div>
            <div className="h-full overflow-hidden">
              <ScrollWrapper className="h-full pb-2 pr-1">
                <div className="mt-1 flex flex-row flex-wrap gap-1.5 after:grow-[999]">
                  {searchItem.tags.map((item) => (
                    <Button
                      variant="outline"
                      size="sm"
                      key={item.name}
                      className="h-auto flex-auto whitespace-normal px-1 py-1 shadow-none"
                    >
                      {item.name}
                    </Button>
                  ))}
                </div>
              </ScrollWrapper>
            </div>
          </div>
        </div>
      </Card>
    </MyLink>
  )
}

function Header({ name, name_cn, id }: { name: string; name_cn: string; id: number }) {
  if (isEmpty(name_cn))
    return (
      <MyLink to={`/subject/${id}`} className="flex flex-row gap-2">
        <h2 className="line-clamp-2 font-semibold text-sky-600">{name}</h2>
      </MyLink>
    )
  else
    return (
      <div className="flex flex-col items-baseline">
        <MyLink to={`/subject/${id}`} className="flex flex-row gap-2">
          <h2 className="line-clamp-2 font-semibold text-sky-600">{name_cn}</h2>
        </MyLink>
        <h3 className="line-clamp-2 text-xs font-medium text-muted-foreground">{name}</h3>
      </div>
    )
}
