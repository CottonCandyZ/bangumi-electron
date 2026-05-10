import { Image } from '@renderer/components/image/image'
import { useSubjectInfoQuery } from '@renderer/data/hooks/db/subject'
import { SubjectId } from '@renderer/data/types/bgm'
import { Header } from '@renderer/modules/header/title/static'
import { subjectCoverImageInViewAtom } from '@renderer/state/in-view'
import { AnimatePresence, motion } from 'motion/react'
import { useAtomValue } from 'jotai'

export function SubjectHeaderTitle({ subjectId }: { subjectId: SubjectId }) {
  const subjectInfoQuery = useSubjectInfoQuery({ subjectId, needKeepPreviousData: false })
  const subjectInfo = subjectInfoQuery.data
  const isInView = useAtomValue(subjectCoverImageInViewAtom)
  if (!subjectInfo) return null
  return (
    <div className="flex h-full items-center overflow-hidden select-none">
      <AnimatePresence key={subjectId}>
        {!isInView && (
          <motion.div
            className="flex flex-row items-center gap-3"
            animate={{ y: 0, opacity: 1 }}
            initial={{ y: '120%', opacity: 0 }}
            exit={{ y: '120%', opacity: 0 }}
          >
            <Image
              className="size-9 shrink-0 overflow-hidden rounded-lg"
              imageSrc={subjectInfo.images.common}
            />
            <Header {...subjectInfo} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
