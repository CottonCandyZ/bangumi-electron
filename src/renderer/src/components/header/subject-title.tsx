import { Image } from '@renderer/components/base/Image'
import { useQuerySubjectInfo } from '@renderer/data/hooks/api/subject'
import { SubjectId } from '@renderer/data/types/bgm'
import { Subject } from '@renderer/data/types/subject'
import { isEmpty } from '@renderer/lib/utils/string'
import { subjectCoverImageInViewAtom } from '@renderer/state/in-view'
import { AnimatePresence, motion } from 'framer-motion'
import { useAtomValue } from 'jotai'
import { useLocation } from 'react-router-dom'

export default function HeaderTitle() {
  const { pathname } = useLocation()
  if (!pathname.includes('subject')) return null
  const subjectId = pathname.split('/').at(-1)
  return subjectId && <SubjectHeaderTitle subjectId={subjectId} />
}

function SubjectHeaderTitle({ subjectId }: { subjectId: SubjectId }) {
  const subjectInfoQuery = useQuerySubjectInfo({ subjectId, needKeepPreviousData: false })
  const subjectInfo = subjectInfoQuery.data
  const isInView = useAtomValue(subjectCoverImageInViewAtom)
  if (!subjectInfo) return null
  return (
    <div className="flex h-full items-center overflow-hidden">
      <AnimatePresence>
        {!isInView && (
          <motion.div
            className="flex flex-row items-center gap-3"
            animate={{ y: 0, opacity: 1 }}
            initial={{ y: '120%', opacity: 0 }}
            exit={{ y: '120%', opacity: 0 }}
          >
            <Image
              className="aspect-square w-10 shrink-0 overflow-hidden rounded-lg"
              imageSrc={subjectInfo.images.small}
            />
            <Header {...subjectInfo} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Header({ name, name_cn }: Pick<Subject, 'name' | 'name_cn'>) {
  return (
    <header className="flex flex-auto flex-col">
      {isEmpty(name_cn) ? (
        <h1 className="line-clamp-2 font-medium">{name}</h1>
      ) : (
        <>
          <h1 className="line-clamp-1 font-medium">{name_cn}</h1>
          <h2 className="line-clamp-1 font-jp text-xs text-muted-foreground">{name}</h2>
        </>
      )}
    </header>
  )
}
