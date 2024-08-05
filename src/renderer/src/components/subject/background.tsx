import { mainPanelScrollPositionAtom } from '@renderer/state/scroll'
import { useAtomValue } from 'jotai'

const scrollRange = 500
const init = (top: number) => {
  return (top / scrollRange) * 100
}

export default function SubjectBackground() {
  const scrollPosition = useAtomValue(mainPanelScrollPositionAtom)
  const percent = init(scrollPosition)

  return (
    <div
      className="absolute inset-0"
      style={{
        background: `linear-gradient(to top, hsl(var(--background)) ${percent - 110}%, hsl(var(--background) / 0) ${percent + 30}%)`,
      }}
    />
  )
}
