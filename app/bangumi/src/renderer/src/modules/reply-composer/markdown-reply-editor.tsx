import { Button } from '@renderer/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@renderer/components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import { BangumiSmile, BANGUMI_SMILE_GROUPS } from '@renderer/components/comment/bangumi-smile'
import { DYNAMIC_SMILE_GROUPS, DynamicSmile } from '@renderer/components/comment/dynamic-smile'
import { cn } from '@renderer/lib/utils'
import { markdown } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import { EditorView } from '@codemirror/view'
import CodeMirror from '@uiw/react-codemirror'
import {
  Bold,
  EyeOff,
  ImageIcon,
  Italic,
  Link,
  Palette,
  SmilePlus,
  Strikethrough,
  Type,
  Underline,
} from 'lucide-react'
import { useCallback, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'

type MarkdownReplyEditorProps = {
  className?: string
  disabled?: boolean
  onChange: (value: string) => void
  value: string
}

export function MarkdownReplyEditor({
  className,
  disabled,
  onChange,
  value,
}: MarkdownReplyEditorProps) {
  const editorRef = useRef<EditorView | null>(null)
  const [emojiOpen, setEmojiOpen] = useState(false)
  const extensions = useMemo(
    () => [markdown({ codeLanguages: languages }), EditorView.lineWrapping],
    [],
  )
  const replaceSelection = useCallback(
    (createText: (selected: string) => string) => {
      const view = editorRef.current
      if (!view || disabled) return

      const selection = view.state.selection.main
      const selected = view.state.sliceDoc(selection.from, selection.to)
      const nextText = createText(selected || '文字')
      const cursor = selection.from + nextText.length
      view.dispatch({
        changes: { from: selection.from, insert: nextText, to: selection.to },
        selection: { anchor: cursor },
      })
      view.focus()
    },
    [disabled],
  )

  const actions = useMemo(
    () => [
      {
        icon: <Bold className="size-3.5" />,
        label: '粗体',
        onClick: () => replaceSelection((text) => `**${text}**`),
      },
      {
        icon: <Italic className="size-3.5" />,
        label: '斜体',
        onClick: () => replaceSelection((text) => `*${text}*`),
      },
      {
        icon: <Underline className="size-3.5" />,
        label: '下划线',
        onClick: () => replaceSelection((text) => `[u]${text}[/u]`),
      },
      {
        icon: <Strikethrough className="size-3.5" />,
        label: '删除线',
        onClick: () => replaceSelection((text) => `~~${text}~~`),
      },
      {
        icon: <Link className="size-3.5" />,
        label: '链接',
        onClick: () => replaceSelection((text) => `[${text}](https://)`),
      },
      {
        icon: <ImageIcon className="size-3.5" />,
        label: '图片',
        onClick: () => replaceSelection((text) => `![${text}](https://)`),
      },
      {
        icon: <EyeOff className="size-3.5" />,
        label: '剧透',
        onClick: () => replaceSelection((text) => `[mask]${text}[/mask]`),
      },
      {
        icon: <Palette className="size-3.5" />,
        label: '颜色',
        onClick: () => replaceSelection((text) => `[color=#f66]${text}[/color]`),
      },
      {
        icon: <Type className="size-3.5" />,
        label: '字号',
        onClick: () => replaceSelection((text) => `[size=16]${text}[/size]`),
      },
    ],
    [replaceSelection],
  )

  return (
    <div
      className={cn(
        'reply-md-editor flex min-h-0 flex-col overflow-hidden rounded-md border',
        className,
      )}
    >
      <div className="bg-muted/20 flex shrink-0 flex-row flex-wrap items-center gap-0.5 border-b p-1">
        {actions.map((action) => (
          <EditorActionButton
            disabled={disabled}
            icon={action.icon}
            key={action.label}
            label={action.label}
            onClick={action.onClick}
          />
        ))}
        <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
          <PopoverTrigger asChild>
            <Button
              aria-label="表情"
              className={cn(
                'text-muted-foreground hover:text-foreground size-7 rounded-sm shadow-none',
                emojiOpen && 'bg-accent text-foreground hover:bg-accent hover:text-foreground',
              )}
              disabled={disabled}
              size="icon"
              title="表情"
              type="button"
              variant="ghost"
            >
              <SmilePlus className="size-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-[28rem] max-w-[calc(100vw-2rem)] overflow-hidden p-2"
            collisionPadding={8}
          >
            <Tabs defaultValue={BANGUMI_SMILE_GROUPS[0].value} className="gap-2">
              <TabsList className="flex h-10 w-fit max-w-full flex-row gap-1 rounded-md p-1">
                {BANGUMI_SMILE_GROUPS.map((group) => (
                  <TabsTrigger
                    aria-label={group.label}
                    className="size-8 p-0"
                    key={group.value}
                    title={group.label}
                    value={group.value}
                  >
                    <BangumiSmile className="mx-0 size-5" code={group.iconCode} />
                  </TabsTrigger>
                ))}
                {DYNAMIC_SMILE_GROUPS.map((group) => (
                  <TabsTrigger
                    aria-label={group.label}
                    className="size-8 p-0"
                    key={group.value}
                    title={group.label}
                    value={group.value}
                  >
                    <DynamicSmile code={group.iconCode} size={24} />
                  </TabsTrigger>
                ))}
              </TabsList>
              {BANGUMI_SMILE_GROUPS.map((group) => (
                <TabsContent value={group.value} className="min-h-0" key={group.value}>
                  <div className="grid max-h-72 grid-cols-8 gap-1 overflow-x-hidden overflow-y-auto">
                    {group.codes.map((code) => (
                      <EmojiButton
                        code={code}
                        disabled={disabled}
                        key={code}
                        onSelect={() => replaceSelection(() => `(${code})`)}
                      >
                        <BangumiSmile code={code} />
                      </EmojiButton>
                    ))}
                  </div>
                </TabsContent>
              ))}
              {DYNAMIC_SMILE_GROUPS.map((group) => (
                <TabsContent value={group.value} className="min-h-0" key={group.value}>
                  <div className="max-h-80 overflow-x-hidden overflow-y-auto">
                    {group.sections.map((section, index) => (
                      <section className={cn(index > 0 && 'mt-2')} key={section.label}>
                        <div className="text-muted-foreground mb-1 px-0.5 text-xs font-medium">
                          {section.label}
                        </div>
                        <div className="grid grid-cols-6 gap-1">
                          {section.codes.map((code) => (
                            <EmojiButton
                              code={code}
                              disabled={disabled}
                              key={code}
                              onSelect={() => replaceSelection(() => `(${code})`)}
                              size="large"
                            >
                              <DynamicSmile className="size-12" code={code} />
                            </EmojiButton>
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </PopoverContent>
        </Popover>
      </div>
      <CodeMirror
        basicSetup={{
          foldGutter: false,
          highlightActiveLine: false,
          highlightActiveLineGutter: false,
          lineNumbers: false,
        }}
        className="min-h-0 flex-1"
        editable={!disabled}
        extensions={extensions}
        onChange={onChange}
        onCreateEditor={(view) => {
          editorRef.current = view
        }}
        placeholder="使用 Markdown 编写回复，也可以直接输入 [color]、[mask] 等 BBCode 标签。"
        theme="none"
        value={value}
      />
    </div>
  )
}

function EmojiButton({
  children,
  code,
  disabled,
  onSelect,
  size = 'default',
}: {
  children: ReactNode
  code: string
  disabled?: boolean
  onSelect: () => void
  size?: 'default' | 'large'
}) {
  return (
    <button
      aria-label={`插入 ${code}`}
      className={cn(
        'hover:bg-accent flex min-w-0 items-center justify-center overflow-hidden rounded-sm',
        size === 'large' ? 'size-14' : 'size-7',
      )}
      disabled={disabled}
      onClick={onSelect}
      title={`(${code})`}
      type="button"
    >
      {children}
    </button>
  )
}

function EditorActionButton({
  disabled,
  icon,
  label,
  onClick,
}: {
  disabled?: boolean
  icon: ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <Button
      aria-label={label}
      className="text-muted-foreground hover:text-foreground size-7 rounded-sm shadow-none"
      disabled={disabled}
      onClick={onClick}
      size="icon"
      title={label}
      type="button"
      variant="ghost"
    >
      {icon}
    </Button>
  )
}
