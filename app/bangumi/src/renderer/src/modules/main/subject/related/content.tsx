import { Button } from '@renderer/components/ui/button'
import { Separator } from '@renderer/components/ui/separator'
import { RelatedSubject } from '@renderer/data/types/subject'
import { Item } from '@renderer/modules/main/subject/related/item'
import { useState } from 'react'
import { Fragment } from 'react/jsx-runtime'

export function RelatedSubjectsGrid({
  relatedSubjects,
  filter,
}: {
  relatedSubjects: Map<string, RelatedSubject[]>
  filter: string
}) {
  const [fold, setFold] = useState(true)
  const res =
    filter !== '全部'
      ? new Map<string, RelatedSubject[]>([[filter, relatedSubjects.get(filter)!]])
      : relatedSubjects
  const needFold = [...res].some(([, items]) => items.length > 5)
  return (
    <div className="relative flex flex-row gap-2">
      <div className="grid w-full grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] gap-x-2 gap-y-5 py-2">
        {[...res].map(([key, items]) => (
          <Fragment key={`${key}-fag`}>
            {items
              .slice(0, needFold && fold && items.length > 5 ? 5 : items.length)
              .map((item, index) => (
                <div key={item.id} className="flex flex-row">
                  {index === 0 ? (
                    <div className="flex w-full flex-row gap-3 text-sm">
                      <Separator orientation="vertical" />
                      <div className="flex w-full flex-col gap-2">
                        <span className="font-medium">{key}</span>
                        <Item relatedSubject={item} />
                      </div>
                    </div>
                  ) : (
                    <div className="mt-7 ml-3 w-full">
                      <Item relatedSubject={item} />
                    </div>
                  )}
                </div>
              ))}
          </Fragment>
        ))}
      </div>
      {needFold && (
        <div className="py-9">
          <Button
            variant="outline"
            className="h-full rounded-xl whitespace-normal"
            onClick={() => setFold((fold) => !fold)}
          >
            {fold ? '展开' : '收起'}
          </Button>
        </div>
      )}
    </div>
  )
}
