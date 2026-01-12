import {
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@renderer/components/ui/command'
import { searchSubjectsInDb, SubjectSearchItem } from '@renderer/data/fetch/db/subject'
import { SUBJECT_TYPE_MAP } from '@renderer/lib/utils/map'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { useNavigate } from 'react-router-dom'

type PanelMode = 'palette' | 'subject-search'

const getSubjectItemValue = (subject: SubjectSearchItem) =>
  `${subject.id} ${subject.name_cn} ${subject.name}`

const TYPE_ICON_MAP: Record<SubjectSearchItem['type'], React.ReactNode> = {
  1: <span className="i-mingcute-book-2-line" />,
  2: <span className="i-mingcute-tv-2-line" />,
  3: <span className="i-mingcute-music-2-line" />,
  4: <span className="i-mingcute-game-2-line" />,
  6: <span className="i-mingcute-tv-1-line" />,
}

export function CommandPanel() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<PanelMode>('palette')
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [subjectResults, setSubjectResults] = useState<SubjectSearchItem[]>([])
  const [selectedValue, setSelectedValue] = useState('go-home')
  const userHasNavigatedRef = useRef(false)

  const trimmedQuery = query.trim()
  const fallbackValue = useMemo(() => `search-page:${trimmedQuery}`, [trimmedQuery])

  const onCommandKeyDownCapture = useCallback((e: React.KeyboardEvent) => {
    if (
      e.key === 'ArrowDown' ||
      e.key === 'ArrowUp' ||
      e.key === 'PageDown' ||
      e.key === 'PageUp' ||
      e.key === 'Home' ||
      e.key === 'End'
    ) {
      userHasNavigatedRef.current = true
    }
  }, [])

  useHotkeys(
    'mod+p',
    (e) => {
      e.preventDefault()
      setQuery('')
      setMode('palette')
      setSelectedValue('go-home')
      userHasNavigatedRef.current = false
      setOpen((wasOpen) => {
        if (wasOpen && mode === 'palette') return false
        return true
      })
    },
    { enableOnFormTags: true },
    [mode],
  )

  useHotkeys(
    'mod+k',
    (e) => {
      e.preventDefault()
      setQuery('')
      setMode('subject-search')
      setSelectedValue('go-search-page')
      userHasNavigatedRef.current = false
      setOpen((wasOpen) => {
        if (wasOpen && mode === 'subject-search') return false
        return true
      })
    },
    { enableOnFormTags: true },
    [mode],
  )

  useEffect(() => {
    if (!open) return
    if (!trimmedQuery) {
      setSearching(false)
      setSubjectResults([])
      return
    }

    let cancelled = false
    setSearching(true)
    setSubjectResults([])

    const timer = window.setTimeout(async () => {
      try {
        const results = await searchSubjectsInDb({ keyword: trimmedQuery, limit: 20 })
        if (!cancelled) setSubjectResults(results)
      } catch {
        if (!cancelled) setSubjectResults([])
      } finally {
        if (!cancelled) setSearching(false)
      }
    }, 150)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [open, trimmedQuery])

  useEffect(() => {
    if (!open) return
    userHasNavigatedRef.current = false

    if (trimmedQuery === '') {
      if (mode === 'palette') setSelectedValue('go-home')
      if (mode === 'subject-search') setSelectedValue('go-search-page')
      return
    }

    setSelectedValue(fallbackValue)
  }, [open, mode, trimmedQuery, fallbackValue])

  useEffect(() => {
    if (!open) return
    if (userHasNavigatedRef.current) return
    if (trimmedQuery === '') return

    if (searching) {
      setSelectedValue(fallbackValue)
      return
    }

    if (subjectResults.length > 0) {
      setSelectedValue(getSubjectItemValue(subjectResults[0]))
      return
    }

    setSelectedValue(fallbackValue)
  }, [open, trimmedQuery, searching, subjectResults, fallbackValue])

  const placeholder = useMemo(() => {
    if (mode === 'subject-search') return '搜索条目...'
    return '输入以搜索条目或命令...'
  }, [mode])

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Command Panel"
      description="Search and navigate quickly"
      commandProps={{
        value: selectedValue,
        onValueChange: setSelectedValue,
        onKeyDownCapture: onCommandKeyDownCapture,
        shouldFilter: mode !== 'subject-search',
      }}
    >
      <CommandInput
        placeholder={placeholder}
        autoFocus
        value={query}
        onValueChange={setQuery}
        onCompositionUpdate={(e) => setQuery(e.currentTarget.value)}
        onCompositionEnd={(e) => setQuery(e.currentTarget.value)}
      />
      <CommandList className="h-[min(60vh,420px)] max-h-none">
        {mode === 'palette' && trimmedQuery === '' && (
          <>
            <CommandGroup heading="导航">
              <CommandItem
                value="go-home"
                onSelect={() => {
                  setOpen(false)
                  navigate('/')
                }}
              >
                <span className="i-mingcute-home-2-line" />
                主页
              </CommandItem>
              <CommandItem
                value="go-search"
                onSelect={() => {
                  setOpen(false)
                  navigate('/search')
                }}
              >
                <span className="i-mingcute-search-line" />
                搜索
              </CommandItem>
              <CommandItem
                value="go-talk"
                onSelect={() => {
                  setOpen(false)
                  navigate('/talk')
                }}
              >
                <span className="i-mingcute-chat-3-line" />
                讨论
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="分区">
              <CommandItem
                value="go-anime"
                onSelect={() => {
                  setOpen(false)
                  navigate('/anime')
                }}
              >
                <span className="i-mingcute-tv-2-line" />
                动画
              </CommandItem>
              <CommandItem
                value="go-game"
                onSelect={() => {
                  setOpen(false)
                  navigate('/game')
                }}
              >
                <span className="i-mingcute-game-1-line" />
                游戏
              </CommandItem>
              <CommandItem
                value="go-book"
                onSelect={() => {
                  setOpen(false)
                  navigate('/book')
                }}
              >
                <span className="i-mingcute-book-6-line" />
                书籍
              </CommandItem>
              <CommandItem
                value="go-music"
                onSelect={() => {
                  setOpen(false)
                  navigate('/music')
                }}
              >
                <span className="i-mingcute-music-3-line" />
                音乐
              </CommandItem>
              <CommandItem
                value="go-real"
                onSelect={() => {
                  setOpen(false)
                  navigate('/real')
                }}
              >
                <span className="i-mingcute-tv-1-line" />
                三次元
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="快捷键">
              <CommandItem
                value="open-command-panel"
                onSelect={() => {
                  setMode('palette')
                  setQuery('')
                }}
              >
                打开 Command Panel
                <CommandShortcut>⌘/Ctrl P</CommandShortcut>
              </CommandItem>
              <CommandItem
                value="open-subject-search"
                onSelect={() => {
                  setMode('subject-search')
                  setQuery('')
                }}
              >
                搜索条目
                <CommandShortcut>⌘/Ctrl K</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          </>
        )}

        {mode === 'subject-search' && trimmedQuery === '' && (
          <CommandGroup heading="提示">
            <CommandItem value="subject-search-hint" disabled>
              输入关键词以搜索本地条目（支持中文名/原名/ID）
              <CommandShortcut>Esc</CommandShortcut>
            </CommandItem>
            <CommandItem
              value="go-search-page"
              onSelect={() => {
                setOpen(false)
                navigate('/search')
              }}
            >
              <span className="i-mingcute-search-line" />
              打开搜索页
            </CommandItem>
          </CommandGroup>
        )}

        {trimmedQuery !== '' && (
          <>
            <CommandGroup heading="条目">
              {searching && (
                <CommandItem value="subject-searching" disabled>
                  正在搜索本地条目...
                </CommandItem>
              )}
              {!searching && subjectResults.length === 0 && (
                <CommandItem value="subject-no-results" disabled>
                  本地未找到匹配条目
                </CommandItem>
              )}

              {subjectResults.map((subject) => {
                const title = subject.name_cn || subject.name
                const subtitle =
                  subject.name_cn && subject.name ? subject.name : SUBJECT_TYPE_MAP[subject.type]
                return (
                  <CommandItem
                    key={subject.id}
                    value={getSubjectItemValue(subject)}
                    keywords={[String(subject.id), subject.name_cn, subject.name].filter(Boolean)}
                    onSelect={() => {
                      setOpen(false)
                      navigate(`/subject/${subject.id}`)
                    }}
                  >
                    <span className="text-muted-foreground flex items-center text-base">
                      {TYPE_ICON_MAP[subject.type]}
                    </span>
                    <span className="flex flex-col gap-0.5">
                      <span className="leading-tight">{title}</span>
                      <span className="text-muted-foreground text-xs leading-tight">
                        {subtitle}
                      </span>
                    </span>
                  </CommandItem>
                )
              })}
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="更多">
              <CommandItem
                value={`search-page:${trimmedQuery}`}
                keywords={[trimmedQuery]}
                onSelect={() => {
                  setOpen(false)
                  navigate(`/search?keyword=${encodeURIComponent(trimmedQuery)}`)
                }}
              >
                <span className="i-mingcute-search-line" />
                在搜索页中查找 “{trimmedQuery}”<CommandShortcut>Enter</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}
