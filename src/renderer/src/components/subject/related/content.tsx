import Item from '@renderer/components/subject/related/item'
import { Button } from '@renderer/components/ui/button'
import { Separator } from '@renderer/components/ui/separator'
import { RelatedSubject } from '@renderer/data/types/subject'
import { useState } from 'react'
import { Fragment } from 'react/jsx-runtime'

export default function RelatedSubjectsContent({
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
      <div className="grid w-full grid-cols-[repeat(auto-fill,_minmax(8rem,_1fr))] gap-x-2 gap-y-5 py-2">
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
                    <div className="ml-3 mt-7 w-full">
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
            className="h-full whitespace-normal rounded-xl"
            onClick={() => setFold((fold) => !fold)}
          >
            {fold ? '展开' : '收起'}
          </Button>
        </div>
      )}
    </div>
  )
}
