import { Image } from '@renderer/components/image/image'
import { MyLink } from '@renderer/components/my-link'
import { Button } from '@renderer/components/ui/button'
import { Card } from '@renderer/components/ui/card'
import { SearchData } from '@renderer/data/types/search'
import { SubjectType } from '@renderer/data/types/subject'
import { isEmpty } from '@renderer/lib/utils/string'
import { ScoreStarHalf } from '@renderer/modules/main/search/score-half'

const ICON_MAP = {
  [SubjectType.anime]: <span className="i-mingcute-tv-2-fill" />,
  [SubjectType.book]: <span className="i-mingcute-book-2-fill" />,
  [SubjectType.game]: <span className="i-mingcute-game-2-fill" />,
  [SubjectType.music]: <span className="i-mingcute-music-2-fill" />,
  [SubjectType.real]: <span className="i-mingcute-tv-1-fill" />,
}

export function SearchItemList({ searchItem }: { searchItem: SearchData }) {
  return (
    <div className="flex flex-row gap-3">
      <MyLink to={`/subject/${searchItem.id}`}>
        <Card className="w-32 shrink-0 overflow-hidden hover:-translate-y-0.5 hover:shadow-xl hover:duration-700">
          <Image
            imageSrc={searchItem.image}
            className="h-fit w-full"
            loadingClassName="aspect-[2/3]"
          />
        </Card>
      </MyLink>
      <div className="flex flex-col gap-1">
        <div className="flex flex-row justify-between">
          {/* 标题 */}
          <section className="flex flex-row items-center gap-1">
            <div className="mt-[3px] text-base text-muted-foreground">
              {ICON_MAP[searchItem.type]}
            </div>
            <Header {...searchItem} />
          </section>

          <span>{searchItem.rank}</span>
        </div>
        <span>{searchItem.date}</span>
        {/* 评分 */}
        <section className="flex flex-row items-center gap-1">
          <div className="mt-[1px]">
            <ScoreStarHalf score={searchItem.score} />
          </div>
          <span
            className="font-medium"
            style={{ color: `hsl(var(--chart-score-${Math.floor(searchItem.score)}))` }}
          >
            {searchItem.score}
          </span>
        </section>
        <div className="mt-1 flex flex-row flex-wrap gap-1.5 after:grow-[999]">
          {searchItem.tags.map((item) => (
            <Button
              variant="outline"
              size="sm"
              key={item.name}
              className="h-auto flex-auto px-1.5 py-1"
            >
              {item.name}
            </Button>
          ))}
        </div>
        {/* <ScrollWrapper className="max-h-20">{searchItem.summary}</ScrollWrapper> */}
      </div>
    </div>
  )
}

function Header({ name, name_cn, id }: { name: string; name_cn: string; id: number }) {
  if (isEmpty(name_cn))
    return (
      <MyLink to={`/subject/${id}`}>
        <h2 className="font-medium text-sky-500">{name}</h2>
      </MyLink>
    )
  else
    return (
      <div className="flex flex-row items-baseline gap-2">
        <MyLink to={`/subject/${id}`}>
          <h2 className="font-medium text-sky-600 hover:text-sky-900">{name_cn}</h2>
        </MyLink>
        <h3 className="text-sm font-medium text-muted-foreground">{name}</h3>
      </div>
    )
}
