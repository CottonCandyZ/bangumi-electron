import { ScrollWrapper } from '@renderer/components/scroll/scroll-wrapper'
import { Separator } from '@renderer/components/ui/separator'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useWebInfoBoxQuery } from '@renderer/data/hooks/web/subject'
import { SubjectId } from '@renderer/data/types/bgm'
import { PersonsTable } from '@renderer/modules/subject/person/table'
import { Fragment } from 'react/jsx-runtime'

export function SubjectPersonTable({ subjectId }: { subjectId: SubjectId }) {
  const personsQuery = useWebInfoBoxQuery({ subjectId })
  const persons = personsQuery.data
  return (
    <div className="h-full pr-1">
      <ScrollWrapper className="h-full w-full pr-1" options={{ scrollbars: { autoHide: 'leave' } }}>
        {persons === undefined ? (
          <div className="flex w-full flex-col gap-1 p-2">
            {Array(10)
              .fill(0)
              .map((_, index) => (
                <Fragment key={index}>
                  <div className="flex flex-row gap-1">
                    <Skeleton className="h-9 w-full" />
                  </div>
                  {index !== 9 && <Separator />}
                </Fragment>
              ))}
          </div>
        ) : (
          persons.size !== 0 && <PersonsTable persons={persons} />
        )}
      </ScrollWrapper>
    </div>
  )
}
