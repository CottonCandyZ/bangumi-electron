import { cn } from '@renderer/lib/utils'
import type { ReactNode } from 'react'

/** 一组设置项：可选的小标题 + 圆角卡片，卡片内各行之间自动分隔 */
export function SettingGroup({
  title,
  action,
  children,
}: {
  title?: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-2">
      {(title || action) && (
        <div className="flex h-7 items-center justify-between gap-2 px-1">
          {title && <h3 className="text-muted-foreground text-xs font-medium">{title}</h3>}
          {action}
        </div>
      )}
      <div className="bg-card divide-y rounded-lg border">{children}</div>
    </section>
  )
}

export function SettingRow({
  title,
  description,
  control,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  control: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex min-h-14 items-center justify-between gap-4 px-4 py-2.5', className)}>
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="text-sm font-medium">{title}</div>
        {description && (
          <div className="text-muted-foreground text-xs break-words">{description}</div>
        )}
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  )
}
