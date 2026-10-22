const switchName = '--enable-features'
const overlayFeature = 'OverlayScrollbar:mode/overlay'

export function withWindowsOverlayScrollbars(args, platform) {
  if (platform !== 'win32') return args

  const rest = []
  const features = []
  let featureSwitches = 0
  const separator = args.indexOf('--')
  const switches = separator < 0 ? args : args.slice(0, separator)
  for (let index = 0; index < switches.length; index++) {
    const arg = switches[index]
    if (arg.startsWith(`${switchName}=`)) {
      featureSwitches++
      features.push(
        ...arg
          .slice(switchName.length + 1)
          .split(',')
          .filter(Boolean),
      )
    } else if (arg === switchName) {
      featureSwitches++
      const value = switches[index + 1]
      if (value && !value.startsWith('--')) {
        features.push(...value.split(',').filter(Boolean))
        index++
      }
    } else {
      rest.push(arg)
    }
  }

  const isOverlayFeature = (feature) => feature.split(/[<:*]/, 1)[0] === 'OverlayScrollbar'
  const overlayFeatures = features.filter(isOverlayFeature)
  if (
    featureSwitches === 1 &&
    overlayFeatures.length === 1 &&
    overlayFeatures[0] === overlayFeature
  ) {
    return args
  }

  rest.push(
    `${switchName}=${[...features.filter((feature) => !isOverlayFeature(feature)), overlayFeature].join(',')}`,
  )
  return separator < 0 ? rest : [...rest, ...args.slice(separator)]
}
