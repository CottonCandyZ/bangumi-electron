export function getWindowSafeTop() {
  if (typeof document === 'undefined') return 0
  return (
    parseFloat(getComputedStyle(document.body).getPropertyValue('--window-titlebar-height')) || 0
  )
}

export function windowCollisionPadding(
  padding: number | Partial<Record<'top' | 'bottom' | 'left' | 'right', number>> = 5,
) {
  const sides =
    typeof padding === 'number'
      ? { top: padding, bottom: padding, left: padding, right: padding }
      : padding
  return { ...sides, top: getWindowSafeTop() + (sides.top ?? 5) }
}
