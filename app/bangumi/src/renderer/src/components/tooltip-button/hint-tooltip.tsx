import { HotkeyKbd } from '@renderer/components/ui/kbd'
import { Tooltip, TooltipContent, TooltipTrigger } from '@renderer/components/ui/tooltip'
import { useTooltipHover } from '@renderer/hooks/use-tooltip-hover'
import type { ComponentProps, ReactElement, ReactNode } from 'react'

/**
 * 给图标按钮等控件加提示，替代原生 title。
 * 和 HeaderButton 一样用 mouseenter 控制开关，放在可拖拽的顶部栏里也能正常关闭。
 * 传入 hotkey 时在提示末尾用键帽样式显示快捷键。
 */
export function HintTooltip({
  children,
  content,
  delay = 300,
  hotkey,
  side,
}: {
  children: ReactElement
  content: ReactNode
  delay?: number
  hotkey?: string
  side?: ComponentProps<typeof TooltipContent>['side']
}) {
  const { isHover, elementRef } = useTooltipHover<HTMLButtonElement>({ delay })
  return (
    <Tooltip open={isHover}>
      <TooltipTrigger asChild ref={elementRef}>
        {children}
      </TooltipTrigger>
      <TooltipContent side={side}>
        <TooltipLabel content={content} hotkey={hotkey} />
      </TooltipContent>
    </Tooltip>
  )
}

export function TooltipLabel({ content, hotkey }: { content: ReactNode; hotkey?: string }) {
  return (
    <>
      <span>{content}</span>
      <HotkeyKbd className="ml-1" hotkey={hotkey} />
    </>
  )
}
