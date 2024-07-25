import { useScrollPosition } from '@renderer/components/base/page-scroll-wrapper'

const initPercent = -60
const scrollRange = 1500
const init = (top: number | undefined) => {
  return top === undefined
    ? initPercent
    : top >= scrollRange
      ? 100
      : (top / scrollRange) * (100 - initPercent) + initPercent
}

export default function SubjectBackground() {
  const scrollPosition = useScrollPosition((state) => state.scrollPosition)
  const percent = init(scrollPosition)

  return (
    <>
      <div
        className="absolute left-0 right-0 top-0 -z-10 h-[100rem]"
        style={{
          background: `linear-gradient(to top, hsl(var(--background)) ${percent}%, hsl(var(--background) / 0) ${percent + 130}%)`,
        }}
      ></div>
      <div className="absolute inset-0 top-[100rem] -z-10 bg-background"></div>
    </>
  )
}
