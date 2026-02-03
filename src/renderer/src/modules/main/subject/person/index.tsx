import { ScrollWrapper } from '@renderer/components/scroll/scroll-wrapper'
import { useWebInfoBoxQuery } from '@renderer/data/hooks/web/subject'
import { SubjectId } from '@renderer/data/types/bgm'
import { PersonsTable } from '@renderer/modules/main/subject/person/table'
import { LoaderCircle } from 'lucide-react'

export function SubjectPersonTable({ subjectId }: { subjectId: SubjectId }) {
  const personsQuery = useWebInfoBoxQuery({ subjectId })
  const persons = personsQuery.data
  return (
    <div className="h-full pr-1">
      <ScrollWrapper className="h-full w-full pr-1">
        {persons === undefined ? (
          <div className="flex h-full w-full items-center justify-center p-6" role="status">
            <LoaderCircle className="text-muted-foreground h-8 w-8 animate-spin" />
            <span className="sr-only">Loading</span>
          </div>
        ) : (
          persons.size !== 0 && <PersonsTable persons={persons} />
        )}
      </ScrollWrapper>
    </div>
  )
}
