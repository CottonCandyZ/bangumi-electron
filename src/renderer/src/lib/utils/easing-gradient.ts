export function easingGradient(from: number, to: number, theme: 'light' | 'dark') {
  const whole = (to - from) / 100
  const color = theme === 'dark' ? '0%' : '100%'
  return `linear-gradient(
      to top,
      hsl(0, 0%, ${color}) 0% ${from}%,
      hsla(0, 0%, ${color}, 0.987) ${from + 8.1 * whole}%,
      hsla(0, 0%, ${color}, 0.951) ${from + 15.5 * whole}%,
      hsla(0, 0%, ${color}, 0.896) ${from + 22.5 * whole}%,
      hsla(0, 0%, ${color}, 0.825) ${from + 29 * whole}%,
      hsla(0, 0%, ${color}, 0.741) ${from + 35.3 * whole}%,
      hsla(0, 0%, ${color}, 0.648) ${from + 41.2 * whole}%,
      hsla(0, 0%, ${color}, 0.55) ${from + 47.1 * whole}%,
      hsla(0, 0%, ${color}, 0.45) ${from + 52.9 * whole}%,
      hsla(0, 0%, ${color}, 0.352) ${from + 58.8 * whole}%,
      hsla(0, 0%, ${color}, 0.259) ${from + 64.7 * whole}%,
      hsla(0, 0%, ${color}, 0.175) ${from + 71 * whole}%,
      hsla(0, 0%, ${color}, 0.104) ${from + 77.5 * whole}%,
      hsla(0, 0%, ${color}, 0.049) ${from + 84.5 * whole}%,
      hsla(0, 0%, ${color}, 0.013) ${from + 91.9 * whole}%,
      hsla(0, 0%, ${color}, 0) ${to}%
    )`
}
