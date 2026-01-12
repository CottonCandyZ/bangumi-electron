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
import { useEffect, useMemo, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { useNavigate } from 'react-router-dom'

type PanelMode = 'palette' | 'subject-search'

const TYPE_ICON_MAP: Record<SubjectSearchItem['type'], React.ReactNode> = {
  1: <span className="i-mingcute-book-2-fill" />,
  2: <span className="i-mingcute-tv-2-fill" />,
  3: <span className="i-mingcute-music-2-fill" />,
  4: <span className="i-mingcute-game-2-fill" />,
  6: <span className="i-mingcute-tv-1-fill" />,
}

export function CommandPanel() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<PanelMode>('palette')
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [subjectResults, setSubjectResults] = useState<SubjectSearchItem[]>([])

  const trimmedQuery = query.trim()

  useHotkeys(
    'mod+p',
    (e) => {
      e.preventDefault()
      setQuery('')
      setMode('palette')
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

  const placeholder = useMemo(() => {
    if (mode === 'subject-search') return '搜索条目（优先中文名）...'
    return '输入以搜索条目或命令...'
  }, [mode])

  const showSubjectSearchFallback = trimmedQuery !== '' && !searching && subjectResults.length === 0

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Command Panel"
      description="Search and navigate quickly"
    >
      <CommandInput placeholder={placeholder} autoFocus value={query} onValueChange={setQuery} />
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
                <span className="i-mingcute-home-2-fill" />
                主页
              </CommandItem>
              <CommandItem
                value="go-search"
                onSelect={() => {
                  setOpen(false)
                  navigate('/search')
                }}
              >
                <span className="i-mingcute-search-fill" />
                搜索
              </CommandItem>
              <CommandItem
                value="go-talk"
                onSelect={() => {
                  setOpen(false)
                  navigate('/talk')
                }}
              >
                <span className="i-mingcute-chat-3-fill" />
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
                <span className="i-mingcute-tv-2-fill" />
                动画
              </CommandItem>
              <CommandItem
                value="go-game"
                onSelect={() => {
                  setOpen(false)
                  navigate('/game')
                }}
              >
                <span className="i-mingcute-game-1-fill" />
                游戏
              </CommandItem>
              <CommandItem
                value="go-book"
                onSelect={() => {
                  setOpen(false)
                  navigate('/book')
                }}
              >
                <span className="i-mingcute-book-6-fill" />
                书籍
              </CommandItem>
              <CommandItem
                value="go-music"
                onSelect={() => {
                  setOpen(false)
                  navigate('/music')
                }}
              >
                <span className="i-mingcute-music-3-fill" />
                音乐
              </CommandItem>
              <CommandItem
                value="go-real"
                onSelect={() => {
                  setOpen(false)
                  navigate('/real')
                }}
              >
                <span className="i-mingcute-tv-1-fill" />
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
              <span className="i-mingcute-search-fill" />
              打开搜索页
            </CommandItem>
          </CommandGroup>
        )}

        {trimmedQuery !== '' && (
          <CommandGroup heading="条目">
            {subjectResults.map((subject) => {
              const title = subject.name_cn || subject.name
              const subtitle =
                subject.name_cn && subject.name ? subject.name : SUBJECT_TYPE_MAP[subject.type]
              return (
                <CommandItem
                  key={subject.id}
                  value={`${subject.id} ${subject.name_cn} ${subject.name}`}
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
                    <span className="text-muted-foreground text-xs leading-tight">{subtitle}</span>
                  </span>
                </CommandItem>
              )
            })}

            {showSubjectSearchFallback && (
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
            )}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}
