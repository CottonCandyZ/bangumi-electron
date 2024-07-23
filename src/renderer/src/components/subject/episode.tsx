import EpisodesGrid from '@renderer/components/episodes/grid'
import { useQuerySubjectInfo } from '@renderer/data/hooks/api/subject'
import { SubjectId } from '@renderer/data/types/bgm'

export default function SubjectEpisodes({ subjectId }: { subjectId: SubjectId }) {
  const subjectInfoQuery = useQuerySubjectInfo({ id: subjectId, needKeepPreviousData: false })
  const subjectInfo = subjectInfoQuery.data
  if (!subjectInfo) {
    return null
  }
  // 如果不是动画或者三次元的话
  if (subjectInfo.type !== 2 && subjectInfo.type !== 6) return null
  // TODO:音乐的章节待做...
  return (
    <section className="flex flex-col gap-5">
      <h2 className="text-2xl font-semibold">章节</h2>
      <EpisodesGrid subjectId={subjectId} eps={subjectInfo.eps} />
    </section>
  )
}
