import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@renderer/components/ui/alert-dialog'
import { Button } from '@renderer/components/ui/button'
import { Switch } from '@renderer/components/ui/switch'
import { cn } from '@renderer/lib/utils'
import { useAppConfig } from '@renderer/state/app-config'
import { DEFAULT_APP_CONFIG } from '@shared/config'
import { Download, Upload } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { toast } from 'sonner'

export function GeneralSettings() {
  const { config, loaded, updateConfig, exportConfig, importConfig } = useAppConfig()
  const [savingNsfw, setSavingNsfw] = useState(false)
  const [transferring, setTransferring] = useState(false)
  const [resetting, setResetting] = useState(false)

  const updateNsfw = async (checked: boolean) => {
    setSavingNsfw(true)
    try {
      await updateConfig({ general: { enableNsfw: checked } })
    } catch (error) {
      toast.error('保存设置失败')
      throw error
    } finally {
      setSavingNsfw(false)
    }
  }

  const exportSettings = async () => {
    setTransferring(true)
    try {
      const result = await exportConfig()
      if (!result.canceled) toast.success('设置已导出')
    } catch (error) {
      toast.error('导出设置失败')
      throw error
    } finally {
      setTransferring(false)
    }
  }

  const importSettings = async () => {
    setTransferring(true)
    try {
      const result = await importConfig()
      if (!result.canceled) toast.success('设置已导入')
    } catch (error) {
      toast.error('导入设置失败，请检查文件格式')
      throw error
    } finally {
      setTransferring(false)
    }
  }

  const resetSettings = async () => {
    setResetting(true)
    try {
      await updateConfig(DEFAULT_APP_CONFIG)
      toast.success('已还原默认设置')
    } catch (error) {
      toast.error('还原默认设置失败')
      throw error
    } finally {
      setResetting(false)
    }
  }

  return (
    <section className="rounded-lg border">
      <div className="flex flex-col">
        <SettingRow
          title="显示 NSFW 内容"
          description="开启后，支持 NSFW 参数的全局搜索会默认包含 NSFW 条目。"
          control={
            <Switch
              checked={config.general.enableNsfw}
              disabled={!loaded || savingNsfw}
              onCheckedChange={updateNsfw}
            />
          }
        />
        <SettingRow
          separated
          title="导入 / 导出设置"
          description="将当前全局设置保存为 JSON 文件，或从 JSON 文件恢复。"
          control={
            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="outline"
                className="h-9 rounded-md font-normal shadow-none"
                disabled={!loaded || transferring}
                onClick={importSettings}
              >
                <Upload className="size-4" />
                导入
              </Button>
              <Button
                variant="outline"
                className="h-9 rounded-md font-normal shadow-none"
                disabled={!loaded || transferring}
                onClick={exportSettings}
              >
                <Download className="size-4" />
                导出
              </Button>
            </div>
          }
        />
        <SettingRow
          separated
          title="还原默认设置"
          description="清除所有自定义设置，并恢复应用默认配置。"
          control={
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive h-9 rounded-md font-normal shadow-none"
                  disabled={!loaded || resetting}
                >
                  还原默认
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>还原所有默认设置？</AlertDialogTitle>
                  <AlertDialogDescription>
                    这会覆盖当前的通用设置和快捷键绑定。此操作不会影响登录状态和本地缓存数据。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <Button
                    variant="outline"
                    disabled={!loaded || transferring}
                    onClick={exportSettings}
                  >
                    备份设置
                  </Button>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive hover:bg-destructive/90 text-white"
                    onClick={resetSettings}
                  >
                    还原默认
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          }
        />
      </div>
    </section>
  )
}

export function SettingRow({
  title,
  description,
  control,
  separated = false,
}: {
  title: string
  description: string
  control: ReactNode
  separated?: boolean
}) {
  return (
    <div
      className={cn(
        'flex min-h-16 items-center justify-between gap-4 px-4 py-3',
        separated && 'border-t',
      )}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <div className="text-base font-medium">{title}</div>
        <div className="text-muted-foreground text-sm">{description}</div>
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  )
}
