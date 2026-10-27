import { Button } from '@renderer/components/ui/button'
import { HotkeyKbd } from '@renderer/components/ui/kbd'
import {
  createHotkeyFromKeyboardEvent,
  isHotkeyEnabled,
  splitHotkeyTokens,
} from '@renderer/lib/shortcut'
import { cn } from '@renderer/lib/utils'
import { SettingGroup } from '@renderer/modules/main/settings/layout'
import { useAppConfig } from '@renderer/state/app-config'
import {
  APP_SHORTCUT_DEFINITIONS,
  APP_SHORTCUT_GROUPS,
  DEFAULT_APP_CONFIG,
  type AppConfig,
  type AppShortcutDefinition,
} from '@shared/config'
import { RotateCcw, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

type ShortcutKey = keyof AppConfig['shortcuts']

function findConflictingShortcut(
  shortcuts: AppConfig['shortcuts'],
  key: ShortcutKey,
  hotkey: string,
) {
  const normalize = (value: string) =>
    splitHotkeyTokens(value)
      .map((token) => token.trim().toLowerCase())
      .sort()
      .join('+')
  const normalizedHotkey = normalize(hotkey)

  return normalizedHotkey
    ? APP_SHORTCUT_DEFINITIONS.find(
        (setting) => setting.key !== key && normalize(shortcuts[setting.key]) === normalizedHotkey,
      )
    : undefined
}

export function ShortcutSettings() {
  const { config, loaded, updateConfig } = useAppConfig()
  const [recordingKey, setRecordingKey] = useState<ShortcutKey | null>(null)
  const [conflict, setConflict] = useState<{ key: ShortcutKey; title: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const modified = APP_SHORTCUT_DEFINITIONS.some(
    (setting) => config.shortcuts[setting.key] !== DEFAULT_APP_CONFIG.shortcuts[setting.key],
  )

  const saveShortcuts = useCallback(
    async (shortcuts: Partial<AppConfig['shortcuts']>) => {
      const nextShortcuts = { ...config.shortcuts, ...shortcuts }
      for (const setting of APP_SHORTCUT_DEFINITIONS) {
        const hotkey = shortcuts[setting.key]
        if (!hotkey) continue

        const conflicting = findConflictingShortcut(nextShortcuts, setting.key, hotkey)
        if (conflicting) {
          toast.error(`快捷键已被「${conflicting.title}」占用`)
          return false
        }
      }

      setSaving(true)
      try {
        await updateConfig({ shortcuts })
        return true
      } catch {
        toast.error('保存快捷键设置失败')
        return false
      } finally {
        setSaving(false)
      }
    },
    [config.shortcuts, updateConfig],
  )

  const stopRecording = () => {
    setRecordingKey(null)
    setConflict(null)
  }

  useEffect(() => {
    if (!recordingKey) return

    // 捕获阶段拦截，避免录制时触发其他全局快捷键
    const onKeyDown = (event: KeyboardEvent) => {
      event.preventDefault()
      event.stopPropagation()

      const noModifier = !event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey
      if (event.key === 'Escape' && noModifier) {
        stopRecording()
        return
      }
      if ((event.key === 'Backspace' || event.key === 'Delete') && noModifier) {
        stopRecording()
        saveShortcuts({ [recordingKey]: '' })
        return
      }

      const hotkey = createHotkeyFromKeyboardEvent(event)
      if (!hotkey) return

      const conflicting = findConflictingShortcut(config.shortcuts, recordingKey, hotkey)
      if (conflicting) {
        setConflict({ key: recordingKey, title: conflicting.title })
        return
      }

      stopRecording()
      saveShortcuts({ [recordingKey]: hotkey })
    }

    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [config.shortcuts, recordingKey, saveShortcuts])

  return (
    <div className="flex flex-col gap-6">
      {APP_SHORTCUT_GROUPS.map((group, index) => (
        <SettingGroup
          key={group.id}
          title={group.label}
          action={
            index === 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground h-7 px-2 font-normal shadow-none"
                disabled={!loaded || saving || !modified}
                onClick={async () => {
                  stopRecording()
                  if (await saveShortcuts(DEFAULT_APP_CONFIG.shortcuts)) {
                    toast.success('已还原全部快捷键')
                  }
                }}
              >
                <RotateCcw className="size-3.5" />
                全部还原
              </Button>
            )
          }
        >
          {APP_SHORTCUT_DEFINITIONS.filter((setting) => setting.group === group.id).map(
            (setting) => (
              <ShortcutSettingRow
                key={setting.key}
                setting={setting}
                hotkey={config.shortcuts[setting.key]}
                disabled={!loaded || saving}
                recording={recordingKey === setting.key}
                conflictTitle={conflict?.key === setting.key ? conflict.title : undefined}
                onRecordStart={() => {
                  setConflict(null)
                  setRecordingKey(setting.key)
                }}
                onRecordStop={stopRecording}
                onChange={(hotkey) => saveShortcuts({ [setting.key]: hotkey })}
              />
            ),
          )}
        </SettingGroup>
      ))}
    </div>
  )
}

function ShortcutSettingRow({
  setting,
  hotkey,
  disabled,
  recording,
  conflictTitle,
  onRecordStart,
  onRecordStop,
  onChange,
}: {
  setting: AppShortcutDefinition
  hotkey: string
  disabled: boolean
  recording: boolean
  conflictTitle?: string
  onRecordStart: () => void
  onRecordStop: () => void
  onChange: (hotkey: string) => void
}) {
  const defaultHotkey = DEFAULT_APP_CONFIG.shortcuts[setting.key]
  const bound = isHotkeyEnabled(hotkey)

  return (
    <div className="group flex h-12 items-center justify-between gap-4 px-4">
      <div className="flex min-w-0 items-center gap-2" title={setting.description}>
        <span className="truncate text-sm">{setting.title}</span>
        {hotkey !== defaultHotkey && (
          <span className="bg-primary size-1.5 shrink-0 rounded-full" aria-label="已修改" />
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <div className="flex items-center opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
          {bound && !recording && (
            <Button
              variant="ghost"
              className="text-muted-foreground size-7 rounded-md p-0 shadow-none"
              disabled={disabled}
              aria-label={`清除「${setting.title}」快捷键`}
              title="清除绑定"
              onClick={() => onChange('')}
            >
              <X className="size-3.5" />
            </Button>
          )}
          {hotkey !== defaultHotkey && !recording && (
            <Button
              variant="ghost"
              className="text-muted-foreground size-7 rounded-md p-0 shadow-none"
              disabled={disabled}
              aria-label={`还原「${setting.title}」默认快捷键`}
              title="还原默认"
              onClick={() => onChange(defaultHotkey)}
            >
              <RotateCcw className="size-3.5" />
            </Button>
          )}
        </div>
        <button
          type="button"
          aria-label={`修改「${setting.title}」快捷键`}
          aria-pressed={recording}
          title={recording ? 'Esc 取消 · Backspace 清除' : undefined}
          disabled={disabled}
          className={cn(
            'flex h-8 min-w-28 items-center justify-end rounded-md border border-transparent px-2 text-xs transition-colors outline-none',
            'hover:border-border hover:bg-accent/50 focus-visible:border-ring disabled:pointer-events-none disabled:opacity-50',
            recording && 'border-primary bg-primary/5 hover:border-primary hover:bg-primary/5',
            conflictTitle && 'border-destructive hover:border-destructive bg-destructive/5',
          )}
          onClick={() => (recording ? onRecordStop() : onRecordStart())}
          onBlur={() => recording && onRecordStop()}
        >
          {recording ? (
            <span className={cn('text-primary', conflictTitle && 'text-destructive')}>
              {conflictTitle ? `已被「${conflictTitle}」占用` : '按下快捷键…'}
            </span>
          ) : bound ? (
            <HotkeyKbd
              className="gap-1"
              hotkey={hotkey}
              keyClassName="h-6 min-w-6 px-1.5 text-xs"
            />
          ) : (
            <span className="text-muted-foreground">未绑定</span>
          )}
        </button>
      </div>
    </div>
  )
}
