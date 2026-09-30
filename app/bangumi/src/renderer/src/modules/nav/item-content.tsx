import { Tooltip, TooltipContent, TooltipTrigger } from '@renderer/components/ui/tooltip'
import type { ReactElement, ReactNode } from 'react'

/** 导航栏按钮里的图标，居中放在固定宽度的图标列里 */
export function NavItemContent({ icon }: { icon: ReactNode }) {
  return (
    <span className="flex w-[var(--nav-icon-column)] shrink-0 items-center justify-center">
      {icon}
    </span>
  )
}

/** 导航栏按钮悬停时在右侧显示名称 */
export function NavTooltip({ children, label }: { children: ReactElement; label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>
        {label}
      </TooltipContent>
    </Tooltip>
  )
}
