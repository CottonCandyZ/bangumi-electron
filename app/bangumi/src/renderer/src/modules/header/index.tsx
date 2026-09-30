import { UI_CONFIG } from '@renderer/config'
import { client } from '@renderer/lib/client'
import { cn } from '@renderer/lib/utils'
import { CommandButton } from '@renderer/modules/header/command-button'
import { NavButton } from '@renderer/modules/header/nav-button'
import { OriginalLink } from '@renderer/modules/header/o-link'
import { RightPanelButton } from '@renderer/modules/header/right-panel-button'
import { HeaderTitle } from '@renderer/modules/header/subject-title'
import { HeaderUpdateIndicator } from '@renderer/modules/update/menu'
import { NotificationButton } from '@renderer/modules/header/notification-button'

import { LEFT_PANEL_MAX_WIDTH, LEFT_PANEL_MIN_WIDTH } from '@renderer/modules/panel/left-panel'
import { clamp } from '@renderer/lib/utils/tool'
import {
  leftPanelHeaderSlotAtom,
  leftPanelOpenAtom,
  leftPanelResizingAtom,
  leftPanelWidth,
} from '@renderer/state/panel'
import { useAtomValue, useSetAtom } from 'jotai'

const platform = await client.platform({})
const HEADER_PADDING_LEFT = platform === 'darwin' ? 88 : 8
// 左侧栏工具条与下方列表卡片左边缘对齐（导航栏宽度 + 列表内边距）；
// macOS 的红绿灯本身已经占据更宽的位置，此时只保留常规内边距。
const LEFT_PANEL_LIST_INSET = 4
const LEFT_PANEL_SLOT_PADDING_LEFT = Math.max(
  8,
  UI_CONFIG.NAV_WIDTH + LEFT_PANEL_LIST_INSET - HEADER_PADDING_LEFT,
)
// Keep in sync with the left panel's slide animation.
const LEFT_PANEL_TRANSITION = '300ms .05s'

/**
 * 左侧栏工具条 / 分隔线的淡入淡出：
 * 收起时立即快速淡出，避免跟着滑到最左边才消失；
 * 展开时在滑动接近终点时再淡入，避免从中间一路滑过去。
 */
function leftPanelSlotFade(open: boolean) {
  return open ? 'opacity 150ms 250ms, visibility 0s 250ms' : 'opacity 100ms, visibility 0s 100ms'
}

export function Header() {
  const leftPanelOpen = useAtomValue(leftPanelOpenAtom)
  const leftPanelResizing = useAtomValue(leftPanelResizingAtom)
  const width = useAtomValue(leftPanelWidth)
  const setLeftPanelHeaderSlot = useSetAtom(leftPanelHeaderSlotAtom)
  // Right edge of the left panel, where its border sits.
  const leftPanelEdge =
    UI_CONFIG.NAV_WIDTH + clamp(width, LEFT_PANEL_MIN_WIDTH, LEFT_PANEL_MAX_WIDTH)

  return (
    <header
      className={cn(
        'app-header bg-background drag-region @container/header relative z-10 flex shrink-0 flex-row items-center justify-between gap-3 border-b',
      )}
      style={{
        height: UI_CONFIG.HEADER_HEIGHT,
        paddingLeft: HEADER_PADDING_LEFT,
        viewTransitionName: 'app-header',
      }}
    >
      <div className="flex h-full min-w-0 flex-1 flex-row items-center overflow-hidden">
        <div
          className="flex h-full shrink-0 items-center overflow-hidden"
          style={{
            // 展开时宽度固定为左侧栏宽度（min = max），工具条再长也不会把这一段撑宽；
            // 收起时完全折叠，前进/后退直接贴着顶部栏左边距
            minWidth: leftPanelOpen ? leftPanelEdge - HEADER_PADDING_LEFT : 0,
            maxWidth: leftPanelOpen ? leftPanelEdge - HEADER_PADDING_LEFT : 0,
            transition: leftPanelResizing
              ? undefined
              : `min-width ${LEFT_PANEL_TRANSITION}, max-width ${LEFT_PANEL_TRANSITION}`,
          }}
        >
          {/*
            左侧栏工具条通过 portal 渲染到这里。
            收起时不用 display: none（会让分隔线瞬间跳到最左），而是淡出并 invisible，
            位置仍由这一块的宽度动画决定。
          */}
          <div
            className={cn(
              'flex h-full min-w-0 flex-1 items-center pr-2',
              leftPanelOpen ? 'visible opacity-100' : 'invisible opacity-0',
            )}
            ref={setLeftPanelHeaderSlot}
            style={{
              paddingLeft: LEFT_PANEL_SLOT_PADDING_LEFT,
              transition: leftPanelSlotFade(leftPanelOpen),
            }}
          />
          {/* 分隔线固定在这一块的右端，随宽度动画与前进/后退同步移动 */}
          <div
            aria-hidden
            className={cn(
              'bg-border pointer-events-none ml-auto h-5 w-px shrink-0',
              leftPanelOpen ? 'visible opacity-100' : 'invisible opacity-0',
            )}
            style={{ transition: leftPanelSlotFade(leftPanelOpen) }}
          />
        </div>
        {/* 前进/后退跟随标题一起，左侧栏展开时整体被推到分隔线右侧 */}
        <div
          className="mr-3 flex shrink-0 items-center gap-2"
          style={{
            // 与分隔线之间的间距只在左侧栏展开时出现，随展开动画过渡
            paddingLeft: leftPanelOpen ? 12 : 0,
            transition: leftPanelResizing ? undefined : `padding-left ${LEFT_PANEL_TRANSITION}`,
          }}
        >
          <NavButton compact />
        </div>
        <HeaderTitle />
      </div>
      <div
        className={cn(
          'flex h-full shrink-0 flex-row items-center gap-1',
          (platform === 'darwin' || platform === 'win32') && 'pr-2',
        )}
      >
        <HeaderUpdateIndicator />
        <NotificationButton />
        <CommandButton />
        <OriginalLink />
        <RightPanelButton />
      </div>
    </header>
  )
}
