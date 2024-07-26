import { useScrollPosition } from '@renderer/components/base/page-scroll-wrapper'

const scrollRange = 500
const init = (top: number) => {
  return (top / scrollRange) * 100
}

export default function SubjectBackground() {
  const scrollPosition = useScrollPosition((state) => state.scrollPosition)
  const percent = init(scrollPosition)

  return (
    <div
      className="absolute inset-0"
      style={{
        background: `linear-gradient(to top, hsl(var(--background)) ${percent - 100}%, hsl(var(--background) / 0) ${percent + 30}%)`,
      }}
    />
  )
}
