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
          className="inline-flex h-9 cursor-default items-center rounded-sm border border-solid bg-secondary pl-2 text-sm font-medium text-secondary-foreground transition-all hover:bg-secondary/80 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {value}
          <button
            type="button"
            onClick={() => remove(value)}
            className="i-mingcute-close-line inline-flex h-full items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          />
        </span>
      ))}
      <input
        className="flex h-9 min-w-fit flex-1 resize-none bg-background px-3 py-2 placeholder:text-muted-foreground focus-visible:outline-none"
        onChange={(event) => {
          console.log(event.type)
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
