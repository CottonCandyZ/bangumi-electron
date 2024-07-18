import Item from '@renderer/components/subject/related/item'
import { Separator } from '@renderer/components/ui/separator'
import { RelatedSubject } from '@renderer/data/types/subject'
import { Fragment } from 'react/jsx-runtime'

export default function RelatedSubjectsContent({
  relatedSubjects,
  filter,
}: {
  relatedSubjects: Map<string, RelatedSubject[]>
  filter: string
}) {
  const res =
    filter !== '全部'
      ? new Map<string, RelatedSubject[] | undefined>([[filter, relatedSubjects.get(filter)]])
      : relatedSubjects
  return (
    <div className="grid grid-cols-[repeat(auto-fill,_minmax(8rem,_1fr))] gap-x-2 gap-y-5 py-2">
      {[...res].map(([key, items]) => (
        <Fragment key={`${key}-fag`}>
          {items?.map((item, index) => (
            <div key={item.id} className="flex flex-row">
              {index === 0 ? (
                <div className="flex w-full flex-row gap-3 text-sm">
                  <Separator orientation="vertical" />
                  <div className="flex w-full flex-col gap-2">
                    <span className="font-semibold">{key}</span>
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
  )
}
