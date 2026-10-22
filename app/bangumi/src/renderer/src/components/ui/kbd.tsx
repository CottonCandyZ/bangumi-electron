import { useKeyPressed } from '@renderer/lib/pressed-keys'
import { getHotkeyTokenLabel, isHotkeyEnabled, splitHotkeyTokens } from '@renderer/lib/shortcut'
import { cn } from '@renderer/lib/utils'
import type { ComponentProps } from 'react'

/**
 * 模拟实体键帽：底边加粗形成按键的厚度感，按下（data-pressed）时下沉。
 * 放在 Tooltip 里（深色底）时自动换成半透明的反色样式。
 */
function Kbd({ className, pressed, ...props }: ComponentProps<'kbd'> & { pressed?: boolean }) {
  return (
    <kbd
      data-slot="kbd"
      data-pressed={pressed || undefined}
      className={cn(
        'bg-background text-muted-foreground border-border pointer-events-none inline-flex h-5 min-w-5 items-center justify-center rounded-[5px] border border-b-2 px-1 font-sans text-[11px] leading-none font-medium transition-[transform,border-width,background-color,color] duration-75 select-none',
        'data-pressed:bg-accent data-pressed:text-foreground data-pressed:translate-y-px data-pressed:border-b',
        'in-data-[slot=tooltip-content]:border-background/30 in-data-[slot=tooltip-content]:bg-background/10 in-data-[slot=tooltip-content]:text-background in-data-[slot=tooltip-content]:data-pressed:bg-background/30',
        className,
      )}
      {...props}
    />
  )
}

/** 把 `mod+shift+k` 这样的快捷键渲染成一组键帽，未绑定时不渲染 */
function HotkeyKbd({
  className,
  hotkey,
  keyClassName,
}: {
  className?: string
  hotkey: string | undefined
  keyClassName?: string
}) {
  if (!isHotkeyEnabled(hotkey)) return null

  return (
    <span className={cn('inline-flex shrink-0 items-center gap-0.5', className)}>
      {splitHotkeyTokens(hotkey).map((token) => (
        <HotkeyKbdKey className={keyClassName} key={token} token={token} />
      ))}
    </span>
  )
}

function HotkeyKbdKey({ className, token }: { className?: string; token: string }) {
  const pressed = useKeyPressed(token)
  return (
    <Kbd className={className} pressed={pressed}>
      {getHotkeyTokenLabel(token)}
    </Kbd>
  )
}

export { HotkeyKbd, Kbd }
