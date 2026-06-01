import { JSONStore } from '@main/lib/store'
import { t } from '@main/tipc/_init'
import {
  AppConfigPatch,
  createAppConfigExportData,
  mergeAppConfig,
  normalizeAppConfig,
  parseImportedAppConfig,
} from '@shared/config'
import { app, dialog } from 'electron'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { updateGlobalCommandPanelShortcut } from '@main/shortcuts'

const APP_CONFIG_STORE_KEY = 'appConfig'

function readAppConfig() {
  return normalizeAppConfig(JSONStore.get(APP_CONFIG_STORE_KEY))
}

export const configIPC = {
  getAppConfig: t.procedure.input().action(async () => {
    return readAppConfig()
  }),
  setAppConfig: t.procedure.input<AppConfigPatch>().action(async ({ input }) => {
    const nextConfig = mergeAppConfig(readAppConfig(), input)

    JSONStore.set(APP_CONFIG_STORE_KEY, nextConfig)
    updateGlobalCommandPanelShortcut(nextConfig.shortcuts.openCommandPanelGlobal)

    return nextConfig
  }),
  exportAppConfig: t.procedure.input().action(async () => {
    const result = await dialog.showSaveDialog({
      title: '导出设置',
      defaultPath: join(app.getPath('downloads'), 'bangumi-electron-settings.json'),
      filters: [{ name: 'JSON', extensions: ['json'] }],
    })

    if (result.canceled || !result.filePath) {
      return { canceled: true as const }
    }

    await writeFile(
      result.filePath,
      `${JSON.stringify(createAppConfigExportData(readAppConfig()), null, 2)}\n`,
      'utf8',
    )

    return { canceled: false as const, filePath: result.filePath }
  }),
  importAppConfig: t.procedure.input().action(async () => {
    const result = await dialog.showOpenDialog({
      title: '导入设置',
      properties: ['openFile'],
      filters: [{ name: 'JSON', extensions: ['json'] }],
    })

    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true as const }
    }

    const content = await readFile(result.filePaths[0], 'utf8')
    const importedConfig = parseImportedAppConfig(JSON.parse(content))

    JSONStore.set(APP_CONFIG_STORE_KEY, importedConfig)
    updateGlobalCommandPanelShortcut(importedConfig.shortcuts.openCommandPanelGlobal)

    return {
      canceled: false as const,
      config: importedConfig,
      filePath: result.filePaths[0],
    }
  }),
}
