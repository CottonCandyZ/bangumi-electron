type MonoImageSet = {
  grid?: string
  large?: string
  medium?: string
  small?: string
}

export function getMonoPreviewImage(mono: { images?: MonoImageSet }) {
  return mono.images?.small || mono.images?.medium || mono.images?.large || mono.images?.grid
}
