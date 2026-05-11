import { BackToTopButton } from '@renderer/components/button/back-to-top'
import { mainContainerRight } from '@renderer/state/main-bounding-box'
import { scrollViewportAtom } from '@renderer/state/scroll'
import { useAtomValue } from 'jotai'

export function MainBackToTopButton() {
  const viewport = useAtomValue(scrollViewportAtom)
  const mainRight = useAtomValue(mainContainerRight)

  return (
    <BackToTopButton
      viewport={viewport}
      style={mainRight > 0 ? { right: `calc(100vw - ${mainRight}px + 1.5rem)` } : undefined}
    />
  )
}
