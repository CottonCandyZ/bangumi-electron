import ScrollWrapper from '@renderer/components/base/scroll-warpper'
import PersonsTable from '@renderer/components/subject/person/table'
import { Separator } from '@renderer/components/ui/separator'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useWebInfoBoxQuery } from '@renderer/data/hooks/web/subject'
import { SubjectId } from '@renderer/data/types/bgm'
import { Fragment } from 'react/jsx-runtime'

export default function SubjectPersonTable({ subjectId }: { subjectId: SubjectId }) {
  const personsQuery = useWebInfoBoxQuery({ subjectId })
  const persons = personsQuery.data
  return (
    <ScrollWrapper
      className="h-[calc(100dvh-64px)] w-full pr-0"
      options={{ scrollbars: { autoHide: 'leave' } }}
    >
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
  )
}
