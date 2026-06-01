export const isMac =
  typeof navigator !== 'undefined' &&
  /mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent)

const KEY_LABEL_MAP: Record<string, string> = {
  alt: isMac ? '⌥' : 'Alt',
  backspace: 'Backspace',
  comma: ',',
  ctrl: 'Ctrl',
  delete: 'Delete',
  down: '↓',
  enter: 'Enter',
  escape: 'Esc',
  left: '←',
  meta: isMac ? '⌘' : 'Win',
  mod: isMac ? '⌘' : 'Ctrl',
  period: '.',
  right: '→',
  shift: isMac ? '⇧' : 'Shift',
  slash: '/',
  space: 'Space',
  tab: 'Tab',
  up: '↑',
}

const CODE_KEY_MAP: Record<string, string> = {
  Backquote: 'backquote',
  Backslash: 'backslash',
  BracketLeft: 'bracketleft',
  BracketRight: 'bracketright',
  Comma: 'comma',
  Equal: 'equal',
  Minus: 'minus',
  Period: 'period',
  Quote: 'quote',
  Semicolon: 'semicolon',
  Slash: 'slash',
  Space: 'space',
}

const MODIFIER_KEYS = new Set(['alt', 'control', 'ctrl', 'meta', 'os', 'shift'])

function normalizeHotkeyValue(hotkey: unknown) {
  return typeof hotkey === 'string' ? hotkey : ''
}

export function getHotkeyForHook(hotkey: unknown) {
  return normalizeHotkeyValue(hotkey) || '*'
}

export function isHotkeyEnabled(hotkey: unknown) {
  return normalizeHotkeyValue(hotkey).trim().length > 0
}

export function formatHotkeyForDisplay(hotkey: unknown) {
  const normalizedHotkey = normalizeHotkeyValue(hotkey)

  if (!normalizedHotkey) return '未绑定'

  return normalizedHotkey
    .split('+')
    .filter(Boolean)
    .map((key) => KEY_LABEL_MAP[key] ?? key.toUpperCase())
    .join(isMac ? '' : ' + ')
}

export function splitHotkeyForDisplay(hotkey: unknown) {
  const normalizedHotkey = normalizeHotkeyValue(hotkey)

  if (!normalizedHotkey) return []

  return normalizedHotkey
    .split('+')
    .filter(Boolean)
    .map((key) => KEY_LABEL_MAP[key] ?? key.toUpperCase())
}

export function createHotkeyFromKeyboardEvent(event: KeyboardEvent) {
  const key = getKeyFromKeyboardEvent(event)

  if (!key || MODIFIER_KEYS.has(key)) return null

  const modifiers: string[] = []
  if (isMac ? event.metaKey : event.ctrlKey) modifiers.push('mod')
  if (isMac && event.ctrlKey) modifiers.push('ctrl')
  if (!isMac && event.metaKey) modifiers.push('meta')
  if (event.altKey) modifiers.push('alt')
  if (event.shiftKey) modifiers.push('shift')

  return [...modifiers, key].join('+')
}

function getKeyFromKeyboardEvent(event: KeyboardEvent) {
  if (/^Key[A-Z]$/.test(event.code)) return event.code.slice(3).toLowerCase()
  if (/^Digit\d$/.test(event.code)) return event.code.slice(5)
  if (/^Arrow/.test(event.code)) return event.code.replace('Arrow', '').toLowerCase()
  if (CODE_KEY_MAP[event.code]) return CODE_KEY_MAP[event.code]

  const key = event.key.toLowerCase()
  if (key === ',') return 'comma'
  if (key === '.') return 'period'
  if (key === '/') return 'slash'
  if (key === ' ') return 'space'

  return key
}
