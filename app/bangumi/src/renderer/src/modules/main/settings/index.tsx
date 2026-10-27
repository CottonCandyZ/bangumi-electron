import { Button } from '@renderer/components/ui/button'
import { cn } from '@renderer/lib/utils'
import { AboutSettings } from '@renderer/modules/main/settings/about'
import { GeneralSettings } from '@renderer/modules/main/settings/general'
import { ShortcutSettings } from '@renderer/modules/main/settings/shortcuts'
import { useUpdateState } from '@renderer/modules/update/menu'
import { useAppConfig } from '@renderer/state/app-config'
import { parseImportedAppConfig } from '@shared/config'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

type SettingsSection = 'general' | 'shortcuts' | 'about'

const SETTINGS_SECTIONS: {
  id: SettingsSection
  label: string
}[] = [
  { id: 'general', label: '通用' },
  { id: 'shortcuts', label: '快捷键' },
  { id: 'about', label: '关于' },
]

export function Settings() {
  const navigate = useNavigate()
  const { section: sectionParam } = useParams()
  const { updateConfig } = useAppConfig()
  const { visible: updateVisible } = useUpdateState()
  const [draggingConfigFile, setDraggingConfigFile] = useState(false)
  const dragDepthRef = useRef(0)
  const section: SettingsSection =
    sectionParam === 'shortcuts' || sectionParam === 'general' || sectionParam === 'about'
      ? sectionParam
      : 'general'
  const currentLabel = SETTINGS_SECTIONS.find((item) => item.id === section)?.label

  useEffect(() => {
    if (sectionParam === 'shortcuts' || sectionParam === 'general' || sectionParam === 'about')
      return

    navigate('/settings/general', { replace: true })
  }, [navigate, sectionParam])

  const setSection = (nextSection: SettingsSection) => {
    navigate(`/settings/${nextSection}`)
  }

  const hasDraggedFile = (event: React.DragEvent) =>
    Array.from(event.dataTransfer.types).includes('Files')

  const onDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    if (!hasDraggedFile(event)) return

    event.preventDefault()
    dragDepthRef.current += 1
    setDraggingConfigFile(true)
  }

  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    if (!hasDraggedFile(event)) return

    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }

  const onDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    if (!hasDraggedFile(event)) return

    event.preventDefault()
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1)
    if (dragDepthRef.current === 0) setDraggingConfigFile(false)
  }

  const onDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    if (!hasDraggedFile(event)) return

    event.preventDefault()
    dragDepthRef.current = 0
    setDraggingConfigFile(false)

    const file = event.dataTransfer.files.item(0)
    if (!file) return

    try {
      const importedConfig = parseImportedAppConfig(JSON.parse(await file.text()))
      await updateConfig(importedConfig)
      toast.success('设置已导入')
    } catch (error) {
      toast.error('导入设置失败，请检查文件格式')
      throw error
    }
  }

  return (
    <div
      className="relative h-full min-h-full w-full overflow-y-auto"
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {draggingConfigFile && (
        <div className="bg-background/80 pointer-events-none absolute inset-0 z-20 flex items-center justify-center backdrop-blur-sm">
          <div className="border-primary/60 bg-background rounded-lg border border-dashed px-8 py-6 text-sm font-medium shadow-lg">
            松开以导入设置
          </div>
        </div>
      )}
      <div className="mx-auto grid w-full max-w-4xl grid-cols-[9rem_1fr] gap-8 px-8 py-8 max-md:grid-cols-1 max-md:gap-4 max-md:px-4">
        <aside className="flex flex-col gap-0.5 md:sticky md:top-8 md:self-start">
          <h1 className="mb-3 px-3 text-lg font-semibold">设置</h1>
          {SETTINGS_SECTIONS.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              className={cn(
                'text-muted-foreground justify-start px-3 text-sm font-normal shadow-none',
                section === item.id && 'bg-accent text-foreground font-medium',
              )}
              onClick={() => setSection(item.id)}
            >
              <span>{item.label}</span>
              {item.id === 'about' && updateVisible && (
                <span className="bg-primary ml-auto size-1.5 rounded-full" aria-label="有新版本" />
              )}
            </Button>
          ))}
        </aside>

        <main className="flex min-w-0 flex-col gap-4">
          <h2 className="text-lg font-semibold max-md:hidden">{currentLabel}</h2>
          {section === 'general' && <GeneralSettings />}
          {section === 'shortcuts' && <ShortcutSettings />}
          {section === 'about' && <AboutSettings />}
        </main>
      </div>
    </div>
  )
}
