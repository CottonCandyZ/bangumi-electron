import ScrollWrapper from '@renderer/components/base/scroll-warpper'
import PersonsTable from '@renderer/components/subject/person/table'
import { useWebInfoBoxQuery } from '@renderer/data/hooks/web/subject'
import { SubjectId } from '@renderer/data/types/bgm'

export default function SubjectPersonTable({ subjectId }: { subjectId: SubjectId }) {
  const personsQuery = useWebInfoBoxQuery({ subjectId })
  const persons = personsQuery.data
  if (!persons) return null
  if (persons.size === 0) return null
  return (
    <ScrollWrapper className="h-[calc(100dvh-64px)]">
      <PersonsTable persons={persons} />
    </ScrollWrapper>
  )
}
