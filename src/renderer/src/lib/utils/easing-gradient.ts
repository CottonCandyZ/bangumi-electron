export function easingGradient(from: number, to: number, theme: 'light' | 'dark') {
  const step = (to - from) / 16
  const color = theme === 'dark' ? '0%' : '100%'
  return `linear-gradient(
      to top,
      hsl(0, 0%, ${color}) 0% ${from}%,
      hsla(0, 0%, ${color}, 0.987) ${from + 2 * step}%,
      hsla(0, 0%, ${color}, 0.951) ${from + 3 * step}%,
      hsla(0, 0%, ${color}, 0.896) ${from + 4 * step}%,
      hsla(0, 0%, ${color}, 0.825) ${from + 5 * step}%,
      hsla(0, 0%, ${color}, 0.741) ${from + 6 * step}%,
      hsla(0, 0%, ${color}, 0.648) ${from + 7 * step}%,
      hsla(0, 0%, ${color}, 0.55) ${from + 8 * step}%,
      hsla(0, 0%, ${color}, 0.45) ${from + 9 * step}%,
      hsla(0, 0%, ${color}, 0.352) ${from + 10 * step}%,
      hsla(0, 0%, ${color}, 0.259) ${from + 11 * step}%,
      hsla(0, 0%, ${color}, 0.175) ${from + 12 * step}%,
      hsla(0, 0%, ${color}, 0.104) ${from + 13 * step}%,
      hsla(0, 0%, ${color}, 0.049) ${from + 14 * step}%,
      hsla(0, 0%, ${color}, 0.013) ${from + 15 * step}%,
      hsla(0, 0%, ${color}, 0) ${from + 16 * step}%
    )`
}
