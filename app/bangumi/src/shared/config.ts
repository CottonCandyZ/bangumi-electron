export type AppConfig = {
  general: {
    enableNsfw: boolean
  }
  shortcuts: {
    openSettings: string
    toggleLeftPanel: string
    openCommandPanel: string
    openCommandPanelGlobal: string
    openSubjectSearch: string
  }
}

export type AppConfigPatch = {
  general?: Partial<AppConfig['general']>
  shortcuts?: Partial<AppConfig['shortcuts']>
}

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
    enableNsfw: false,
  },
  shortcuts: {
    openSettings: 'mod+comma',
    toggleLeftPanel: 'mod+b',
    openCommandPanel: 'mod+p',
    openCommandPanelGlobal: 'mod+shift+alt+b',
    openSubjectSearch: 'mod+k',
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
      enableNsfw:
        typeof general.enableNsfw === 'boolean'
          ? general.enableNsfw
          : DEFAULT_APP_CONFIG.general.enableNsfw,
    },
    shortcuts: {
      openSettings: normalizeShortcut('openSettings'),
      toggleLeftPanel: normalizeShortcut('toggleLeftPanel'),
      openCommandPanel: normalizeShortcut('openCommandPanel'),
      openCommandPanelGlobal: normalizeShortcut('openCommandPanelGlobal'),
      openSubjectSearch: normalizeShortcut('openSubjectSearch'),
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
