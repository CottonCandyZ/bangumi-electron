import PersonsTable from '@renderer/components/subject/person/table'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useWebInfoBoxQuery } from '@renderer/data/hooks/web/subject'
import { SubjectId } from '@renderer/data/types/bgm'

export default function SubjectPersonTable({ subjectId }: { subjectId: SubjectId }) {
  const personsQuery = useWebInfoBoxQuery({ subjectId })
  const persons = personsQuery.data
  if (!persons) return <Skeleton className="h-[28rem] w-64 shrink-0" />
  if (persons.size === 0) return null
  return (
    <section className="flex flex-col gap-5">
      {/* <h2 className="text-2xl font-semibold">相关信息</h2> */}
      <PersonsTable persons={persons} />
    </section>
  )
}
