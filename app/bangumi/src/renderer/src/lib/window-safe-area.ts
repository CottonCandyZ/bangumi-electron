/** 弹出层与窗口边缘的碰撞间距，统一展开成四个方向（未指定的 top 默认 5） */
export function windowCollisionPadding(
  padding: number | Partial<Record<'top' | 'bottom' | 'left' | 'right', number>> = 5,
) {
  const sides =
    typeof padding === 'number'
      ? { top: padding, bottom: padding, left: padding, right: padding }
      : padding
  return { ...sides, top: getWindowSafeTop() + (sides.top ?? 5) }
}
let cachedSafeTop: number | undefined

/**
 * 每个 Tooltip / Popover 渲染都会调用；getComputedStyle 会强制样式计算，
 * 页面切换时大量调用会拖慢 view transition。同一帧内复用结果。
 */
export function getWindowSafeTop() {
  if (typeof document === 'undefined') return 0
  if (cachedSafeTop === undefined) {
    cachedSafeTop =
      parseFloat(getComputedStyle(document.body).getPropertyValue('--window-titlebar-height')) || 0
    requestAnimationFrame(() => {
      cachedSafeTop = undefined
    })
  }
  return cachedSafeTop
}
