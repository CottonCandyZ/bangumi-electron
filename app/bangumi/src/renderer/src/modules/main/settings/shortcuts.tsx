import { Button } from '@renderer/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@renderer/components/ui/dialog'
import {
  createHotkeyFromKeyboardEvent,
  isHotkeyEnabled,
  splitHotkeyForDisplay,
} from '@renderer/lib/shortcut'
import { cn } from '@renderer/lib/utils'
import { useAppConfig } from '@renderer/state/app-config'
import {
  APP_SHORTCUT_DEFINITIONS,
  APP_SHORTCUT_GROUPS,
  DEFAULT_APP_CONFIG,
  type AppShortcutDefinition,
} from '@shared/config'
import { RotateCcw, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export function ShortcutSettings() {
  const [recordingSetting, setRecordingSetting] = useState<AppShortcutDefinition | null>(null)

  return (
    <section className="rounded-lg border">
      <div className="flex flex-col">
        {APP_SHORTCUT_GROUPS.map((group, index) => (
          <ShortcutSection
            key={group.id}
            title={group.label}
            settings={APP_SHORTCUT_DEFINITIONS.filter((setting) => setting.group === group.id)}
            separated={index > 0}
            onRecord={setRecordingSetting}
          />
        ))}
      </div>
      <ShortcutRecorderDialog
        setting={recordingSetting}
        open={recordingSetting !== null}
        onOpenChange={(open) => {
          if (!open) setRecordingSetting(null)
        }}
      />
    </section>
  )
}

function ShortcutSection({
  title,
  settings,
  separated,
  onRecord,
}: {
  title: string
  settings: readonly AppShortcutDefinition[]
  separated: boolean
  onRecord: (setting: AppShortcutDefinition) => void
}) {
  return (
    <section className={cn(separated && 'border-t')}>
      <div className="px-4 pt-4 pb-2">
        <h3 className="text-muted-foreground text-xs font-medium">{title}</h3>
      </div>
      {settings.map((setting, index) => (
        <ShortcutSettingRow
          key={setting.key}
          setting={setting}
          separated={index > 0}
          onRecord={() => onRecord(setting)}
        />
      ))}
    </section>
  )
}

function ShortcutSettingRow({
  setting,
  separated,
  onRecord,
}: {
  setting: AppShortcutDefinition
  separated: boolean
  onRecord: () => void
}) {
  const { config, loaded, updateConfig } = useAppConfig()
  const [saving, setSaving] = useState(false)
  const currentHotkey = config.shortcuts[setting.key]

  const updateShortcut = async (hotkey: string, successMessage?: string) => {
    setSaving(true)
    try {
      await updateConfig({ shortcuts: { [setting.key]: hotkey } })
      if (successMessage) toast.success(successMessage)
    } catch (error) {
      toast.error('保存快捷键设置失败')
      throw error
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className={cn(
        'flex min-h-16 items-center justify-between gap-4 px-4 py-3',
        separated && 'border-t',
      )}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <span className="font-medium">{setting.title}</span>
        <span className="text-muted-foreground text-sm">{setting.description}</span>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <Button
          variant="outline"
          className="h-9 min-w-32 rounded-md shadow-none"
          disabled={!loaded || saving}
          onClick={onRecord}
        >
          <ShortcutKeys hotkey={currentHotkey} />
        </Button>
        <Button
          variant="ghost"
          className="size-8 rounded-md p-0 shadow-none"
          disabled={!loaded || saving || !currentHotkey}
          aria-label="清除绑定"
          onClick={(event) => {
            event.stopPropagation()
            updateShortcut('', '已清除快捷键')
          }}
        >
          <X className="size-4" />
        </Button>
        <Button
          variant="ghost"
          className="size-8 rounded-md p-0 shadow-none"
          disabled={
            !loaded || saving || currentHotkey === DEFAULT_APP_CONFIG.shortcuts[setting.key]
          }
          aria-label="还原默认"
          onClick={(event) => {
            event.stopPropagation()
            updateShortcut(DEFAULT_APP_CONFIG.shortcuts[setting.key], '已还原默认快捷键')
          }}
        >
          <RotateCcw className="size-4" />
        </Button>
      </div>
    </div>
  )
}

function ShortcutRecorderDialog({
  setting,
  open,
  onOpenChange,
}: {
  setting: AppShortcutDefinition | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { updateConfig } = useAppConfig()
  const [pressedHotkey, setPressedHotkey] = useState('')

  useEffect(() => {
    if (!open || !setting) return

    setPressedHotkey('')

    const onKeyDown = async (event: KeyboardEvent) => {
      event.preventDefault()
      event.stopPropagation()

      if (event.key === 'Escape') {
        onOpenChange(false)
        return
      }

      const hotkey = createHotkeyFromKeyboardEvent(event)
      if (!hotkey) return

      setPressedHotkey(hotkey)

      try {
        await updateConfig({ shortcuts: { [setting.key]: hotkey } })
        onOpenChange(false)
      } catch (error) {
        toast.error('保存快捷键设置失败')
        throw error
      }
    }

    window.addEventListener('keydown', onKeyDown, true)

    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [onOpenChange, open, setting, updateConfig])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>设置快捷键</DialogTitle>
          <DialogDescription>
            {setting ? `按下用于「${setting.title}」的新快捷键。` : '按下新的快捷键。'}
          </DialogDescription>
        </DialogHeader>
        <div className="bg-muted/40 flex h-20 items-center justify-center rounded-md border text-sm">
          {pressedHotkey ? <ShortcutKeys hotkey={pressedHotkey} /> : '等待按键输入'}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ShortcutKeys({ hotkey }: { hotkey: string }) {
  const keys = splitHotkeyForDisplay(hotkey)

  if (!isHotkeyEnabled(hotkey)) {
    return <span className="text-muted-foreground text-sm">未绑定</span>
  }

  return (
    <span className="flex shrink-0 items-center gap-1">
      {keys.map((key) => (
        <kbd
          key={key}
          className="bg-background text-muted-foreground pointer-events-none inline-flex h-5 min-w-5 items-center justify-center rounded border px-1.5 font-sans text-[11px] leading-none"
        >
          {key}
        </kbd>
      ))}
    </span>
  )
}
