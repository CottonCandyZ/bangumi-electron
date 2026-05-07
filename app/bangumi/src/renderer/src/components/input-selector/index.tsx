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
  inputValue: string
  selectList: string[]
  setValue: (value: string) => void
  onDelete: (value: string) => void
  onSelectAction?: (value: string) => void
} & HTMLProps<HTMLInputElement>

export function InputSelector(props: InputSelectorProps) {
  const {
    inputValue,
    onDelete,
    setValue,
    onSelectAction = () => {},
    selectList,
    ...resProps
  } = props
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
    onSelectAction(select)
    setIsOpen(false)
  }

  const highlightMatch = (text: string, query: string | undefined) => {
    if (!query) return text
    const parts = text.split(new RegExp(`(${query})`, 'gi'))
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={index} className="bg-accent rounded-sm">
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
      e.preventDefault()
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
    <div className="relative w-full" ref={containerRef}>
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
          type="button"
          onClick={handleClear}
          data-input-empty={inputValue === ''}
          className="text-muted-foreground hover:text-primary absolute top-1/2 right-8 -translate-y-1/2 opacity-100 transition-[opacity_color] duration-300 data-[input-empty=true]:opacity-0"
        >
          <X size={15} />
        </button>
        <button
          type="button"
          data-open={isOpen && filtered.length !== 0}
          disabled={filtered.length === 0}
          onClick={handleToggleDropdown}
          className="text-muted-foreground hover:text-primary absolute top-1/2 right-2 -translate-y-1/2 transition-[transform_colors] disabled:opacity-50 data-[open=true]:rotate-180"
        >
          <ChevronDown size={18} />
        </button>
      </div>
      {isOpen && filtered.length !== 0 && (
        <ul
          ref={dropdownRef}
          className="bg-popover absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border shadow-lg"
        >
          {filtered.map((item, index) => (
            <li
              key={index}
              data-selected={index === selectedIndex}
              data-is-latest={index === filtered.length - 1}
              className="data-[selected=true]:bg-muted data-[selected=false]:hover:bg-muted relative cursor-pointer px-4 py-2 data-[is-latest=false]:border-b"
              onClick={() => handleSelect(item)}
            >
              <span>{highlightMatch(item, inputValue?.toString())}</span>
              <button
                type="button"
                onClick={(e) => deleteItem(item, e)}
                className="text-muted-foreground hover:text-destructive absolute top-1/2 right-4 flex shrink-0 -translate-y-1/2"
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
