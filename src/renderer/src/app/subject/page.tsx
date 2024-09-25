import { useResizeObserver } from '@renderer/hooks/use-resize'
import { BackgroundImage } from '@renderer/modules/subject/background'
import { SubjectContent } from '@renderer/modules/subject/content'
import { subjectContentWidthAtom } from '@renderer/state/width'
import { useSetAtom } from 'jotai'
import { useRef } from 'react'
import { useParams } from 'react-router-dom'

export function Component() {
  const subjectId = useParams().subjectId
  const containerRef = useRef<HTMLDivElement | null>(null)
  const setWidth = useSetAtom(subjectContentWidthAtom)
  useResizeObserver({
    ref: containerRef,
    callback: (entry) => {
      setWidth(entry.target.getBoundingClientRect().width)
    },
    deps: [subjectId, setWidth],
  })
  if (!subjectId) throw Error('Get Params Error')
  return (
    <div ref={containerRef}>
      <BackgroundImage subjectId={subjectId} />
      <SubjectContent subjectId={subjectId} className="relative pb-10 pt-[60rem]" />
    </div>
  )
}
