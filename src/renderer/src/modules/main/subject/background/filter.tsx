import { easingGradient } from '@renderer/lib/utils/easing-gradient'
import { useTheme } from '@renderer/modules/wrapper/theme-wrapper'
import { mainContainerHeight } from '@renderer/state/main-bounding-box'
import { mainPanelScrollPositionAtom } from '@renderer/state/scroll'
import { useAtomValue } from 'jotai'

const calculateGradientRange = (scrollTop: number, containerHeight: number) => {
  if (containerHeight <= 0) return { from: 10, to: 45 }

  const rawProgress = Math.max(scrollTop / (containerHeight * 2), 0)
  const clampedHeadProgress = Math.min(rawProgress, 1)
  const fastRange = 0.28
  const headProgress =
    clampedHeadProgress <= fastRange
      ? (() => {
          const fastT = clampedHeadProgress / fastRange
          const easedFastT = 1 - Math.pow(1 - fastT, 1.45)
          const blendedFastT = fastT + (easedFastT - fastT) * 0.45
          return blendedFastT * fastRange
        })()
      : fastRange + ((clampedHeadProgress - fastRange) / (1 - fastRange)) * (1 - fastRange)
  const easedProgress = rawProgress <= 1 ? headProgress : 1 + (rawProgress - 1) * 0.22
  const percent = easedProgress * 100
  const start = percent * (0.025 * percent)
  const end = percent * (0.11 * percent)

  // Only near the very top, make the gradient denser around title area.
  const nearTopProgress = Math.min(Math.max(scrollTop / (containerHeight * 0.24), 0), 1)
  const topDepthBoost = (1 - nearTopProgress) * 7

  const from = 10 + start + topDepthBoost
  const to = 45 + end + topDepthBoost * 0.4
  return { from, to }
}

export function SubjectBackground() {
  const scrollPosition = useAtomValue(mainPanelScrollPositionAtom)
  const containerHeight = useAtomValue(mainContainerHeight)
  const { from, to } = calculateGradientRange(scrollPosition, containerHeight)
  const { currentColor } = useTheme()
  return (
    <div
      className="absolute inset-0"
      style={{
        background: easingGradient(from, to, currentColor),
      }}
    />
  )
}
