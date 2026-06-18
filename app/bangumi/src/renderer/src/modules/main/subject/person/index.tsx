import { useWebInfoBoxQuery } from '@renderer/data/hooks/web/subject'
import { SubjectId } from '@renderer/data/types/bgm'
import { PersonsTable } from '@renderer/modules/main/subject/person/table'
import { LoaderCircle } from 'lucide-react'

export function SubjectPersonTable({ subjectId }: { subjectId: SubjectId }) {
  const personsQuery = useWebInfoBoxQuery({ subjectId })
  const persons = personsQuery.data
  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="h-full w-full overflow-x-hidden overflow-y-auto focus-visible:outline-hidden">
        <div className="min-h-full w-full">
          {persons === undefined ? (
            <div className="flex h-full w-full items-center justify-center p-6" role="status">
              <LoaderCircle className="text-muted-foreground h-8 w-8 animate-spin" />
              <span className="sr-only">Loading</span>
            </div>
          ) : (
            persons.size !== 0 && <PersonsTable persons={persons} />
          )}
        </div>
      </div>
    </div>
  )
}
