import { Input } from '@renderer/components/ui/input'
import { ChevronDown, X } from 'lucide-react'
import {
  ChangeEvent,
  HTMLProps,
  KeyboardEvent,
  MouseEvent,
  useEffect,
  useRef,
  useState,
} from 'react'

type InputSelectorProps = {
  selectList: string[]
  setValue: (value: string) => void
  onDelete: (value: string) => void
} & HTMLProps<HTMLInputElement>

export function InputSelector(props: InputSelectorProps) {
  const { value: inputValue, onDelete, setValue, selectList, ...resProps } = props
  const [isOpen, setIsOpen] = useState(false)
  const [filtered, setFiltered] = useState<string[]>(selectList)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLUListElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const filtered =
      inputValue === '' || inputValue === undefined
        ? selectList
        : selectList.filter((item) =>
            item.toLowerCase().includes(inputValue.toString().toLowerCase()),
          )
    setFiltered(filtered)
    setSelectedIndex(-1)
  }, [inputValue, selectList])

  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value)
    setIsOpen(true)
  }

  const handleSelect = (select: string) => {
    setValue(select)
    setIsOpen(false)
  }

  const highlightMatch = (text: string, query: string | undefined) => {
    if (!query) return text
    const parts = text.split(new RegExp(`(${query})`, 'gi'))
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={index} className="rounded-sm bg-accent">
          {part}
        </span>
      ) : (
        part
      ),
    )
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : prev))
      setIsOpen(true)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev))
      setIsOpen(true)
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      handleSelect(filtered[selectedIndex])
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const handleClear = () => {
    setValue('')
    setIsOpen(true)
    inputRef.current?.focus()
  }
  const handleToggleDropdown = () => {
    setIsOpen(!isOpen)
    if (!isOpen) inputRef.current?.focus()
  }

  const deleteItem = (value: string, e: MouseEvent) => {
    e.stopPropagation()
    onDelete(value)
  }
  return (
    <div className="relative w-full max-w-sm" ref={containerRef}>
      <div>
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          className="w-full pr-20"
          {...resProps}
        />
        <button
          onClick={handleClear}
          data-input-empty={inputValue === ''}
          className="absolute right-8 top-1/2 -translate-y-1/2 text-muted-foreground opacity-100 transition-[opacity_color] duration-300 hover:text-primary data-[input-empty=true]:opacity-0"
        >
          <X size={15} />
        </button>
        <button
          data-open={isOpen && filtered.length !== 0}
          disabled={filtered.length === 0}
          onClick={handleToggleDropdown}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground transition-[transform_colors] hover:text-primary disabled:opacity-50 data-[open=true]:rotate-180"
        >
          <ChevronDown size={18} />
        </button>
      </div>
      {isOpen && filtered.length !== 0 && (
        <ul
          ref={dropdownRef}
          className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover shadow-lg"
        >
          {filtered.map((item, index) => (
            <li
              key={index}
              data-selected={index === selectedIndex}
              data-isLatest={index === filtered.length - 1}
              className="relative cursor-pointer px-4 py-2 data-[isLatest=false]:border-b data-[selected=true]:bg-muted data-[selected=false]:hover:bg-muted"
              onClick={() => handleSelect(item)}
            >
              <span>{highlightMatch(item, inputValue?.toString())}</span>
              <button
                onClick={(e) => deleteItem(item, e)}
                className="absolute right-4 top-1/2 flex shrink-0 -translate-y-1/2 text-muted-foreground hover:text-destructive"
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
