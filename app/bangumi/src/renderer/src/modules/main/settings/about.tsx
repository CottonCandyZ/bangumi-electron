import { Badge } from '@renderer/components/ui/badge'
import { Button } from '@renderer/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@renderer/components/ui/select'
import { client } from '@renderer/lib/client'
import { SettingRow } from '@renderer/modules/main/settings/general'
import {
  getUpdateActionText,
  getUpdateTitle,
  useUpdateActions,
  useUpdateState,
} from '@renderer/modules/update/menu'
import { useAppConfig } from '@renderer/state/app-config'
import type { AppUpdateChannel } from '@shared/config'
import type { AppBuildInfo, AppUpdateState } from '@shared/update'
import { Download, FileDown, RefreshCw, Trash2 } from 'lucide-react'
import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

export function AboutSettings() {
  const { config, loaded, updateConfig } = useAppConfig()
  const { state } = useUpdateState()
  const { busy, runUpdateAction } = useUpdateActions(state)
  const [buildInfo, setBuildInfo] = useState<AppBuildInfo | null>(null)
  const [savingChannel, setSavingChannel] = useState(false)
  const [exportingLogs, setExportingLogs] = useState(false)
  const [clearingDownloads, setClearingDownloads] = useState(false)
  const updateTitle = useMemo(() => getUpdateTitle(state), [state])

  useEffect(() => {
    let active = true

    client.getBuildInfo({}).then((info) => {
      if (active) setBuildInfo(info)
    })

    return () => {
      active = false
    }
  }, [])

  const updateChannel = async (channel: AppUpdateChannel) => {
    setSavingChannel(true)
    try {
      await updateConfig({ update: { channel } })
      await client.checkForUpdates({})
    } catch (error) {
      toast.error('保存更新通道失败')
      throw error
    } finally {
      setSavingChannel(false)
    }
  }

  const exportLogs = async () => {
    setExportingLogs(true)
    try {
      const result = await client.exportLogs({})
      if (!result.canceled) toast.success('log 已导出')
    } catch (error) {
      toast.error('导出 log 失败')
      throw error
    } finally {
      setExportingLogs(false)
    }
  }

  const clearUpdateDownloads = async () => {
    setClearingDownloads(true)
    try {
      await client.clearUpdateDownloads({})
      toast.success('更新下载包已清理')
    } catch (error) {
      toast.error('清理更新下载包失败')
      throw error
    } finally {
      setClearingDownloads(false)
    }
  }

  return (
    <section className="rounded-lg border">
      <div className="flex flex-col">
        <SettingRow
          title="Build"
          description="当前安装包的版本、构建时间和 commit hash。"
          control={
            <div className="grid min-w-72 gap-1 text-right text-sm">
              <div className="font-medium">{buildInfo?.version ?? '--'}</div>
              <div className="text-muted-foreground">{formatBuildTime(buildInfo?.buildTime)}</div>
              <div className="text-muted-foreground font-mono text-xs">
                {buildInfo?.hash ?? '--'}
              </div>
            </div>
          }
        />
        <SettingRow
          separated
          title="更新通道"
          description={
            config.update.channel === 'stable'
              ? '正式通道还没有发布包，当前可能检查不到更新。'
              : 'Beta 通道会接收预发布版本。'
          }
          control={
            <Select
              value={config.update.channel}
              disabled={!loaded || savingChannel}
              onValueChange={(value) => updateChannel(value as AppUpdateChannel)}
            >
              <SelectTrigger className="w-32 shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beta">Beta</SelectItem>
                <SelectItem value="stable">正式</SelectItem>
              </SelectContent>
            </Select>
          }
        />
        <SettingRow
          separated
          title="更新"
          description={getUpdateDescription(state, updateTitle)}
          control={
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
              {state?.status === 'available' && <Badge variant="secondary">新版本</Badge>}
              {state?.status === 'downloaded' && <Badge>已下载</Badge>}
              <Button
                variant="outline"
                className="h-9 rounded-md font-normal shadow-none"
                disabled={
                  clearingDownloads || state?.status === 'unsupported' || !state?.downloadDir
                }
                onClick={clearUpdateDownloads}
              >
                <Trash2 className="size-4" />
                清理下载包
              </Button>
              <Button
                variant="outline"
                className="h-9 rounded-md font-normal shadow-none"
                disabled={busy || state?.status === 'unsupported'}
                onClick={runUpdateAction}
              >
                {state?.status === 'downloaded' ? (
                  <RefreshCw className="size-4" />
                ) : (
                  <Download className="size-4" />
                )}
                {getUpdateActionText(state)}
              </Button>
            </div>
          }
        />
        <SettingRow
          separated
          title="Log"
          description="导出 renderer 日志，便于定位接口、登录和更新问题。"
          control={
            <Button
              variant="outline"
              className="h-9 rounded-md font-normal shadow-none"
              disabled={exportingLogs}
              onClick={exportLogs}
            >
              <FileDown className="size-4" />
              导出 log
            </Button>
          }
        />
      </div>
    </section>
  )
}

function formatBuildTime(value?: string) {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

function getUpdateDescription(state: AppUpdateState | null, title: string): ReactNode {
  if (!state) return '检查当前通道是否有可安装的新版本。'
  if (state.status === 'available' && state.version) {
    return withUpdatePath(
      `当前 ${state.currentVersion}，可下载 ${state.version}。通道：${state.packageChannel}`,
      '下载目录',
      state.downloadDir,
    )
  }
  if (state.status === 'downloaded' && state.version) {
    return withUpdatePath(
      `已下载 ${state.version}，点击后会重启并应用更新。`,
      '下载包',
      state.downloadPath,
    )
  }
  if (state.status === 'downloading' && state.version)
    return withUpdatePath(`正在下载 ${state.version}。`, '临时文件', state.downloadTempPath)
  if (state.status === 'error')
    return withUpdatePath(state.error ?? title, '下载目录', state.downloadDir)
  if (state.status === 'idle' && state.lastCheckedAt)
    return withUpdatePath(
      `当前已是最新版本。上次检查：${formatBuildTime(state.lastCheckedAt)}`,
      '下载目录',
      state.downloadDir,
    )
  return title
}

function withUpdatePath(text: string, label: string, value?: string): ReactNode {
  if (!value) return text

  return (
    <span className="space-y-1">
      <span>{text}</span>
      <span className="block font-mono text-xs break-all">
        {label}：{value}
      </span>
    </span>
  )
}
