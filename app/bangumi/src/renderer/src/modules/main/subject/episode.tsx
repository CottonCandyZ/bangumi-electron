import { EpisodesGrid } from '@renderer/modules/common/episodes/grid'
import { SubjectId } from '@renderer/data/types/bgm'
import { SubjectType } from '@renderer/data/types/subject'
import { Tankobon } from '@renderer/modules/main/subject/tankobon'
import { useSubjectInfoQuery } from '@renderer/data/hooks/db/subject'

export function SubjectEpisodes({ subjectId }: { subjectId: SubjectId }) {
  const subjectInfoQuery = useSubjectInfoQuery({ subjectId, needKeepPreviousData: false })
  const subjectInfo = subjectInfoQuery.data
  if (!subjectInfo) {
    return null
  }
  // 如果不是动画或者三次元的话
  if (subjectInfo.type === SubjectType.book) return <Tankobon subjectId={subjectId} />
  if (subjectInfo.type !== SubjectType.anime && subjectInfo.type !== SubjectType.music) return null
  // TODO:音乐的章节待做...
  return (
    <section className="flex flex-col gap-5">
      <EpisodesGrid subjectId={subjectId} eps={subjectInfo.eps} />
    </section>
  )
}
