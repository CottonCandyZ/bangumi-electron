export type AppConfig = {
  general: {
    downloadDirectory: string
    enableNsfw: boolean
    showEpisodeQuickMark: boolean
  }
  update: {
    channel: AppUpdateChannel
  }
  shortcuts: {
    openSettings: string
    toggleLeftPanel: string
    openCommandPanel: string
    openCommandPanelGlobal: string
    openSubjectSearch: string
    navigateBack: string
    navigateForward: string
    toggleRightPanel: string
    openNotifications: string
    syncCollections: string
    openWebPage: string
  }
}

export type AppConfigPatch = {
  general?: Partial<AppConfig['general']>
  update?: Partial<AppConfig['update']>
  shortcuts?: Partial<AppConfig['shortcuts']>
}

export type AppUpdateChannel = 'beta' | 'stable'

export type AppShortcutKey = keyof AppConfig['shortcuts']

export type AppShortcutGroup = 'general' | 'command' | 'desktop'

export type AppShortcutDefinition = {
  key: AppShortcutKey
  description: string
  group: AppShortcutGroup
  title: string
}

export type AppConfigExportData = {
  version: 1
  exportedAt: string
  config: AppConfig
}

export const DEFAULT_APP_CONFIG: AppConfig = {
  general: {
    downloadDirectory: '',
    enableNsfw: false,
    showEpisodeQuickMark: false,
  },
  update: {
    channel: 'beta',
  },
  shortcuts: {
    openSettings: 'mod+comma',
    toggleLeftPanel: 'mod+b',
    openCommandPanel: 'mod+p',
    openCommandPanelGlobal: 'mod+shift+alt+b',
    openSubjectSearch: 'mod+k',
    navigateBack: 'alt+left',
    navigateForward: 'alt+right',
    toggleRightPanel: 'mod+alt+b',
    openNotifications: 'mod+shift+n',
    syncCollections: 'mod+shift+s',
    openWebPage: 'mod+shift+o',
  },
}

export const APP_SHORTCUT_GROUPS: readonly { id: AppShortcutGroup; label: string }[] = [
  { id: 'general', label: '通用' },
  { id: 'command', label: '命令' },
  { id: 'desktop', label: '桌面' },
]

export const APP_SHORTCUT_DEFINITIONS: readonly AppShortcutDefinition[] = [
  {
    key: 'openSettings',
    group: 'general',
    title: '打开设置',
    description: '从任意页面打开设置页',
  },
  {
    key: 'toggleLeftPanel',
    group: 'general',
    title: '切换左侧面板',
    description: '展开或收起左侧面板',
  },
  {
    key: 'toggleRightPanel',
    group: 'general',
    title: '切换右边栏',
    description: '展开或收起当前页面的右边栏',
  },
  {
    key: 'navigateBack',
    group: 'general',
    title: '后退',
    description: '返回上一个页面',
  },
  {
    key: 'navigateForward',
    group: 'general',
    title: '前进',
    description: '前往下一个页面',
  },
  {
    key: 'openNotifications',
    group: 'general',
    title: '打开通知',
    description: '展开或收起顶栏的通知列表',
  },
  {
    key: 'syncCollections',
    group: 'general',
    title: '同步收藏',
    description: '打开收藏同步面板',
  },
  {
    key: 'openWebPage',
    group: 'general',
    title: '打开网页版',
    description: '在浏览器中打开当前页面对应的 Bangumi 网页',
  },
  {
    key: 'openCommandPanel',
    group: 'command',
    title: '打开命令面板',
    description: '打开命令和导航面板',
  },
  {
    key: 'openSubjectSearch',
    group: 'command',
    title: '搜索条目',
    description: '打开本地条目搜索',
  },
  {
    key: 'openCommandPanelGlobal',
    group: 'desktop',
    title: '桌面打开命令面板',
    description: '应用不在前台时唤起命令面板',
  },
]

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

export function mergeAppConfig(
  base: AppConfig = DEFAULT_APP_CONFIG,
  patch: AppConfigPatch = {},
): AppConfig {
  return {
    general: {
      ...DEFAULT_APP_CONFIG.general,
      ...base.general,
      ...patch.general,
    },
    update: {
      ...DEFAULT_APP_CONFIG.update,
      ...base.update,
      ...patch.update,
    },
    shortcuts: {
      ...DEFAULT_APP_CONFIG.shortcuts,
      ...base.shortcuts,
      ...patch.shortcuts,
    },
  }
}

export function normalizeAppConfig(value: unknown): AppConfig {
  if (!isRecord(value)) return DEFAULT_APP_CONFIG

  const general = isRecord(value.general) ? value.general : {}
  const update = isRecord(value.update) ? value.update : {}
  const shortcuts = isRecord(value.shortcuts) ? value.shortcuts : {}
  const normalizeShortcut = (key: keyof AppConfig['shortcuts']) => {
    const value = shortcuts[key]

    if (typeof value === 'string') return value
    if (value === false) return ''
    if (value === true) return DEFAULT_APP_CONFIG.shortcuts[key]

    return DEFAULT_APP_CONFIG.shortcuts[key]
  }

  return mergeAppConfig(DEFAULT_APP_CONFIG, {
    general: {
      downloadDirectory:
        typeof general.downloadDirectory === 'string'
          ? general.downloadDirectory
          : DEFAULT_APP_CONFIG.general.downloadDirectory,
      enableNsfw:
        typeof general.enableNsfw === 'boolean'
          ? general.enableNsfw
          : DEFAULT_APP_CONFIG.general.enableNsfw,
      showEpisodeQuickMark:
        typeof general.showEpisodeQuickMark === 'boolean'
          ? general.showEpisodeQuickMark
          : DEFAULT_APP_CONFIG.general.showEpisodeQuickMark,
    },
    update: {
      channel:
        update.channel === 'stable' || update.channel === 'beta'
          ? update.channel
          : DEFAULT_APP_CONFIG.update.channel,
    },
    shortcuts: {
      openSettings: normalizeShortcut('openSettings'),
      toggleLeftPanel: normalizeShortcut('toggleLeftPanel'),
      openCommandPanel: normalizeShortcut('openCommandPanel'),
      openCommandPanelGlobal: normalizeShortcut('openCommandPanelGlobal'),
      openSubjectSearch: normalizeShortcut('openSubjectSearch'),
      navigateBack: normalizeShortcut('navigateBack'),
      navigateForward: normalizeShortcut('navigateForward'),
      toggleRightPanel: normalizeShortcut('toggleRightPanel'),
      openNotifications: normalizeShortcut('openNotifications'),
      syncCollections: normalizeShortcut('syncCollections'),
      openWebPage: normalizeShortcut('openWebPage'),
    },
  })
}

export function createAppConfigExportData(config: AppConfig): AppConfigExportData {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    config: normalizeAppConfig(config),
  }
}

export function parseImportedAppConfig(value: unknown): AppConfig {
  if (!isRecord(value)) {
    throw new Error('Invalid config file')
  }

  const maybeConfig = isRecord(value.config) ? value.config : value

  if (!isRecord(maybeConfig.general) && !isRecord(maybeConfig.shortcuts)) {
    throw new Error('Invalid config file')
  }

  return normalizeAppConfig(maybeConfig)
}
