import { useRef } from 'react'

export function TagInput({
  tags,
  remove,
  add,
  placeholder = '添加标签，或从上方点选，最多 10 个',
}: {
  tags: string[]
  remove: (value: string) => void
  add: (value: string) => void
  placeholder?: string
}) {
  const onComposition = useRef(false)
  return (
    <div className="flex w-full flex-row flex-wrap gap-2 bg-transparent text-sm">
      {tags.map((value) => (
        <span
          key={value}
          className="bg-secondary text-secondary-foreground hover:bg-secondary/80 inline-flex h-9 cursor-default items-center gap-0.5 rounded-sm border border-solid pl-1.5 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50"
        >
          {value}
          <button
            type="button"
            onClick={() => remove(value)}
            className="focus-visible:ring-ring inline-flex h-full items-center justify-center rounded-md px-1.5 text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-1 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"
          >
            <span className="i-mingcute-close-line" />
          </button>
        </span>
      ))}
      <input
        className="bg-background placeholder:text-muted-foreground flex h-9 min-w-fit flex-1 resize-none px-3 py-2 focus-visible:outline-hidden"
        onChange={(event) => {
          const value = event.target.value
          if (value === ' ') {
            event.target.value = ''
            return
          }
          if (!onComposition.current && event.target.value.includes(' ')) {
            add(value)
            event.target.value = ''
          }
        }}
        onCompositionStart={() => (onComposition.current = true)}
        onCompositionEnd={() => (onComposition.current = false)}
        placeholder={placeholder}
      />
    </div>
  )
}
