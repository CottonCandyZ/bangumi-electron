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
import { client, handlers } from '@renderer/lib/client'
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
  const isCommandOverlayWindow =
    typeof window !== 'undefined' && window.location.hash.startsWith('#/command')

  const normalizeSearchText = useCallback((text: string) => text.trim().toLowerCase(), [])

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

  const openMainAndNavigate = useCallback(
    async (path: string) => {
      if (isCommandOverlayWindow) {
        setOpen(false)
        await client.openMainWindowAndNavigate({ path })
        await client.hideCommandWindow({})
      } else {
        setOpen(false)
        navigate(path)
      }
    },
    [isCommandOverlayWindow, navigate],
  )

  const paletteCommands = useMemo(() => {
    const items = [
      {
        value: 'go-home',
        keywords: ['主页', 'home', 'index'],
        icon: <span className="i-mingcute-home-2-line" />,
        label: '主页',
        onSelect: () => openMainAndNavigate('/'),
      },
      {
        value: 'go-search',
        keywords: ['搜索', 'search', 'find'],
        icon: <span className="i-mingcute-search-line" />,
        label: '搜索',
        onSelect: () => openMainAndNavigate('/search'),
      },
      {
        value: 'go-talk',
        keywords: ['讨论', 'talk', 'chat'],
        icon: <span className="i-mingcute-chat-3-line" />,
        label: '讨论',
        onSelect: () => openMainAndNavigate('/talk'),
      },
      {
        value: 'go-anime',
        keywords: ['动画', 'anime'],
        icon: <span className="i-mingcute-tv-2-line" />,
        label: '动画',
        onSelect: () => openMainAndNavigate('/anime'),
      },
      {
        value: 'go-game',
        keywords: ['游戏', 'game'],
        icon: <span className="i-mingcute-game-1-line" />,
        label: '游戏',
        onSelect: () => openMainAndNavigate('/game'),
      },
      {
        value: 'go-book',
        keywords: ['书籍', '图书', 'book'],
        icon: <span className="i-mingcute-book-6-line" />,
        label: '书籍',
        onSelect: () => openMainAndNavigate('/book'),
      },
      {
        value: 'go-music',
        keywords: ['音乐', 'music'],
        icon: <span className="i-mingcute-music-3-line" />,
        label: '音乐',
        onSelect: () => openMainAndNavigate('/music'),
      },
      {
        value: 'go-real',
        keywords: ['三次元', '现实', 'real'],
        icon: <span className="i-mingcute-tv-1-line" />,
        label: '三次元',
        onSelect: () => openMainAndNavigate('/real'),
      },
      {
        value: 'open-command-panel',
        keywords: ['command', 'palette', '命令', '面板', '快捷键'],
        label: '打开 Command Panel',
        shortcut: '⌘/Ctrl P',
        onSelect: () => {
          setMode('palette')
          setQuery('')
        },
      },
      {
        value: 'open-subject-search',
        keywords: ['搜索条目', '条目', 'subject', '本地'],
        label: '搜索条目',
        shortcut: '⌘/Ctrl K',
        onSelect: () => {
          setMode('subject-search')
          setQuery('')
        },
      },
    ]

    return items
  }, [openMainAndNavigate])

  const matchedPaletteCommandValue = useMemo(() => {
    if (mode !== 'palette') return null
    const normalizedQuery = normalizeSearchText(trimmedQuery)
    if (!normalizedQuery) return null
    if (normalizedQuery.length < 2 && !/[\u4e00-\u9fff]/.test(normalizedQuery)) return null

    let bestMatch: { value: string; score: number } | null = null

    for (const command of paletteCommands) {
      const candidates = [command.label, ...command.keywords]
        .filter(Boolean)
        .map((candidate) => normalizeSearchText(String(candidate)))

      for (const candidate of candidates) {
        const score =
          candidate === normalizedQuery
            ? 0
            : candidate.startsWith(normalizedQuery)
              ? 1
              : candidate.includes(normalizedQuery)
                ? 2
                : null
        if (score === null) continue

        if (!bestMatch || score < bestMatch.score) {
          bestMatch = { value: command.value, score }
          if (score === 0) return bestMatch.value
        }
      }
    }

    return bestMatch?.value ?? null
  }, [mode, paletteCommands, normalizeSearchText, trimmedQuery])

  useEffect(() => {
    // Triggered by main process (e.g. global shortcut).
    const unlisten = handlers.openCommandPanel.listen((payload) => {
      const nextMode: PanelMode = payload?.mode === 'subject-search' ? 'subject-search' : 'palette'
      setMode(nextMode)
      setQuery('')
      setSelectedValue(nextMode === 'subject-search' ? 'go-search-page' : 'go-home')
      userHasNavigatedRef.current = false
      setOpen(true)
    })
    return unlisten
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

    if (mode === 'palette' && matchedPaletteCommandValue) {
      setSelectedValue(matchedPaletteCommandValue)
      return
    }

    setSelectedValue(fallbackValue)
  }, [open, mode, trimmedQuery, matchedPaletteCommandValue, fallbackValue])

  useEffect(() => {
    if (!open) return
    if (userHasNavigatedRef.current) return
    if (trimmedQuery === '') return

    if (mode === 'palette' && matchedPaletteCommandValue) {
      setSelectedValue(matchedPaletteCommandValue)
      return
    }

    if (searching) {
      setSelectedValue(fallbackValue)
      return
    }

    if (subjectResults.length > 0) {
      setSelectedValue(getSubjectItemValue(subjectResults[0]))
      return
    }

    setSelectedValue(fallbackValue)
  }, [
    open,
    mode,
    trimmedQuery,
    searching,
    matchedPaletteCommandValue,
    subjectResults,
    fallbackValue,
  ])

  const placeholder = useMemo(() => {
    if (mode === 'subject-search') return '搜索条目...'
    return '输入以搜索条目或命令...'
  }, [mode])

  return (
    <CommandDialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen && isCommandOverlayWindow) {
          client.hideCommandWindow({})
        }
      }}
      title="Command Panel"
      description="Search and navigate quickly"
      hideOverlay={isCommandOverlayWindow}
      disableAnimation={isCommandOverlayWindow}
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
              {paletteCommands.slice(0, 3).map((command) => (
                <CommandItem
                  key={command.value}
                  value={command.value}
                  keywords={command.keywords}
                  onSelect={command.onSelect}
                >
                  {command.icon}
                  {command.label}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="分区">
              {paletteCommands.slice(3, 8).map((command) => (
                <CommandItem
                  key={command.value}
                  value={command.value}
                  keywords={command.keywords}
                  onSelect={command.onSelect}
                >
                  {command.icon}
                  {command.label}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="快捷键">
              {paletteCommands.slice(8).map((command) => (
                <CommandItem
                  key={command.value}
                  value={command.value}
                  keywords={command.keywords}
                  onSelect={command.onSelect}
                >
                  {command.label}
                  {command.shortcut ? <CommandShortcut>{command.shortcut}</CommandShortcut> : null}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {mode === 'palette' && trimmedQuery !== '' && (
          <CommandGroup heading="命令">
            {paletteCommands.map((command) => (
              <CommandItem
                key={command.value}
                value={command.value}
                keywords={command.keywords}
                onSelect={command.onSelect}
              >
                {command.icon}
                {command.label}
                {command.shortcut ? <CommandShortcut>{command.shortcut}</CommandShortcut> : null}
              </CommandItem>
            ))}
          </CommandGroup>
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
                openMainAndNavigate('/search')
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
                    keywords={[
                      String(subject.id),
                      subject.name_cn,
                      subject.name,
                      subject.name_cn_pinyin,
                    ].filter(
                      (keyword): keyword is string =>
                        typeof keyword === 'string' && keyword.length > 0,
                    )}
                    onSelect={() => {
                      openMainAndNavigate(`/subject/${subject.id}`)
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
                  openMainAndNavigate(`/search?keyword=${encodeURIComponent(trimmedQuery)}`)
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
