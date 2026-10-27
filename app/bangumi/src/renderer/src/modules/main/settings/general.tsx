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
import { client } from '@renderer/lib/client'
import { SettingGroup, SettingRow } from '@renderer/modules/main/settings/layout'
import { useAppConfig } from '@renderer/state/app-config'
import { DEFAULT_APP_CONFIG } from '@shared/config'
import { Download, FolderOpen, RotateCcw, Upload } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export function GeneralSettings() {
  const { config, loaded, updateConfig, exportConfig, importConfig } = useAppConfig()
  const [savingNsfw, setSavingNsfw] = useState(false)
  const [savingQuickMark, setSavingQuickMark] = useState(false)
  const [selectingDownloadDirectory, setSelectingDownloadDirectory] = useState(false)
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

  const updateQuickMark = async (checked: boolean) => {
    setSavingQuickMark(true)
    try {
      await updateConfig({ general: { showEpisodeQuickMark: checked } })
    } catch {
      toast.error('保存设置失败')
    } finally {
      setSavingQuickMark(false)
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

  const selectDownloadDirectory = async () => {
    setSelectingDownloadDirectory(true)
    try {
      const result = await client.selectDownloadDirectory({
        defaultPath: config.general.downloadDirectory || undefined,
      })
      if (result.canceled) return

      await updateConfig({ general: { downloadDirectory: result.directory } })
      toast.success('图片下载目录已更新')
    } catch (error) {
      toast.error('保存下载目录失败')
      throw error
    } finally {
      setSelectingDownloadDirectory(false)
    }
  }

  const resetDownloadDirectory = async () => {
    setSelectingDownloadDirectory(true)
    try {
      await updateConfig({ general: { downloadDirectory: '' } })
      toast.success('已恢复系统下载目录')
    } catch (error) {
      toast.error('保存下载目录失败')
      throw error
    } finally {
      setSelectingDownloadDirectory(false)
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
    <div className="flex flex-col gap-6">
      <SettingGroup>
        <SettingRow
          title="显示 NSFW 内容"
          description="搜索时默认包含 NSFW 条目"
          control={
            <Switch
              checked={config.general.enableNsfw}
              disabled={!loaded || savingNsfw}
              onCheckedChange={updateNsfw}
            />
          }
        />
        <SettingRow
          title="显示章节快速标记"
          description="输入集数批量更新进度；Shift + 点击章节可直接标记"
          control={
            <Switch
              aria-label="显示章节快速标记"
              checked={config.general.showEpisodeQuickMark}
              disabled={!loaded || savingQuickMark}
              onCheckedChange={updateQuickMark}
            />
          }
        />
        <SettingRow
          title="图片下载目录"
          description={
            config.general.downloadDirectory ? (
              <span className="font-mono break-all">{config.general.downloadDirectory}</span>
            ) : (
              '系统默认'
            )
          }
          control={
            <div className="flex items-center gap-2">
              {config.general.downloadDirectory && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="font-normal shadow-none"
                  disabled={!loaded || selectingDownloadDirectory}
                  onClick={resetDownloadDirectory}
                >
                  <RotateCcw className="size-3.5" />
                  默认
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="font-normal shadow-none"
                disabled={!loaded || selectingDownloadDirectory}
                onClick={selectDownloadDirectory}
              >
                <FolderOpen className="size-3.5" />
                选择
              </Button>
            </div>
          }
        />
      </SettingGroup>

      <SettingGroup title="数据">
        <SettingRow
          title="导入 / 导出设置"
          description="JSON 文件，也可直接拖入此页面导入"
          control={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="font-normal shadow-none"
                disabled={!loaded || transferring}
                onClick={importSettings}
              >
                <Upload className="size-3.5" />
                导入
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="font-normal shadow-none"
                disabled={!loaded || transferring}
                onClick={exportSettings}
              >
                <Download className="size-3.5" />
                导出
              </Button>
            </div>
          }
        />
        <SettingRow
          title="还原默认设置"
          control={
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive font-normal shadow-none"
                  disabled={!loaded || resetting}
                >
                  还原
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>还原所有默认设置？</AlertDialogTitle>
                  <AlertDialogDescription>
                    通用设置和快捷键都会被覆盖，登录状态和缓存不受影响。
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
      </SettingGroup>
    </div>
  )
}
