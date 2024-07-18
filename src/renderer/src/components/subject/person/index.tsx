import PersonsTable from '@renderer/components/subject/person/table'
import { SubjectId } from '@renderer/data/types/bgm'

export default function SubjectPersonTable({ subjectId }: { subjectId: SubjectId }) {
  


  return (
    <section className="flex flex-col gap-5">
      <h2 className="text-2xl font-semibold">相关信息</h2>
      <PersonsTable subjectId={subjectId} />
    </section>
  )
}
