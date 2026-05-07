import { Tooltip, TooltipContent, TooltipTrigger } from '@renderer/components/ui/tooltip'
import { useTooltipHover } from '@renderer/hooks/use-tooltip-hover'
import { ReactNode } from 'react'

// 考虑到在 Header 上的周围都是 draggable 区域，
// 导致 radix-ui 的 ToolTip 关闭无法正常的触发
// 故写一个 mouseenter 的版本

export const HeaderButton = ({ Button, Content }: { Button: ReactNode; Content: ReactNode }) => {
  const { isHover, elementRef } = useTooltipHover<HTMLButtonElement>({ delay: 700 })
  return (
    <Tooltip open={isHover}>
      <TooltipTrigger asChild ref={elementRef}>
        {Button}
      </TooltipTrigger>
      <TooltipContent>{Content}</TooltipContent>
    </Tooltip>
  )
}
