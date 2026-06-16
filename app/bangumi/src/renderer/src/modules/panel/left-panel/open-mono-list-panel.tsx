import { Button } from '@renderer/components/ui/button'
import { cn } from '@renderer/lib/utils'
import { openMonoListPanelTabAtomAction, type MonoListPanelTab } from '@renderer/state/panel'
import { useSetAtom } from 'jotai'
import { useCallback } from 'react'
import type { ComponentProps, SyntheticEvent } from 'react'

type MonoListPanelTabInput = MonoListPanelTab | (() => MonoListPanelTab | null | undefined)

type OpenMonoListPanelOptions = {
  preventDefault?: boolean
  stopPropagation?: boolean
}

type OpenMonoListPanelEvent = Pick<SyntheticEvent, 'preventDefault' | 'stopPropagation'>

function resolveMonoListPanelTab(tab: MonoListPanelTabInput) {
  return typeof tab === 'function' ? tab() : tab
}

export function useOpenMonoListPanel() {
  const openMonoListPanelTab = useSetAtom(openMonoListPanelTabAtomAction)

  return useCallback(
    (
      tab: MonoListPanelTabInput,
      event?: OpenMonoListPanelEvent,
      options?: OpenMonoListPanelOptions,
    ) => {
      if (options?.preventDefault) event?.preventDefault()
      if (options?.stopPropagation) event?.stopPropagation()

      const nextTab = resolveMonoListPanelTab(tab)
      if (!nextTab) return

      openMonoListPanelTab(nextTab)
    },
    [openMonoListPanelTab],
  )
}

export function useMonoListPanelOpenHandler(
  tab: MonoListPanelTabInput,
  options?: OpenMonoListPanelOptions,
) {
  const openMonoListPanel = useOpenMonoListPanel()
  const preventDefault = options?.preventDefault
  const stopPropagation = options?.stopPropagation

  return useCallback(
    (event?: OpenMonoListPanelEvent) => {
      openMonoListPanel(tab, event, { preventDefault, stopPropagation })
    },
    [openMonoListPanel, preventDefault, stopPropagation, tab],
  )
}

type OpenMonoListPanelButtonProps = Omit<ComponentProps<typeof Button>, 'children' | 'onClick'> & {
  iconClassName?: string
  preventDefault?: boolean
  stopPropagation?: boolean
  tab: MonoListPanelTabInput
  title: string
}

export function OpenMonoListPanelButton({
  className,
  disabled,
  iconClassName,
  preventDefault,
  size,
  stopPropagation,
  tab,
  title,
  type,
  variant,
  ...buttonProps
}: OpenMonoListPanelButtonProps) {
  const open = useMonoListPanelOpenHandler(tab, { preventDefault, stopPropagation })

  return (
    <Button
      {...buttonProps}
      aria-label={buttonProps['aria-label'] ?? title}
      className={cn('size-8', className)}
      disabled={disabled}
      onClick={open}
      size={size ?? 'icon'}
      title={title}
      type={type ?? 'button'}
      variant={variant ?? 'ghost'}
    >
      <span className={cn('i-mingcute-box-3-line text-lg', iconClassName)} />
    </Button>
  )
}
