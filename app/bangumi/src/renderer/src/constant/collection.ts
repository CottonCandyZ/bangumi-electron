export const EPISODE_COLLECTION_ACTION = ['看过', '看到', '想看', '抛弃'] as const

export type EpisodeCollectionAction = (typeof EPISODE_COLLECTION_ACTION)[number]
type EpisodeCollectionShortcutAction = Extract<EpisodeCollectionAction, '看过' | '看到'>
type EpisodeCollectionShortcutModifier = 'metaKey' | 'shiftKey' | 'ctrlKey' | 'altKey'
export type CollectionShortcutModifierState = Record<EpisodeCollectionShortcutModifier, boolean>

// TODO: 后续可直接改为从 settings 读取绑定配置。
export const EPISODE_COLLECTION_SHORTCUT_BINDINGS: Record<
  EpisodeCollectionShortcutAction,
  EpisodeCollectionShortcutModifier
> = {
  看过: 'metaKey',
  看到: 'shiftKey',
}

const EPISODE_COLLECTION_SHORTCUT_PRIORITY: EpisodeCollectionShortcutAction[] = ['看过', '看到']

export function resolveEpisodeCollectionActionByShortcut({
  defaultAction,
  modifierState,
}: {
  defaultAction: EpisodeCollectionAction
  modifierState: CollectionShortcutModifierState
}): EpisodeCollectionAction {
  for (const action of EPISODE_COLLECTION_SHORTCUT_PRIORITY) {
    if (modifierState[EPISODE_COLLECTION_SHORTCUT_BINDINGS[action]]) return action
  }
  return defaultAction
}
