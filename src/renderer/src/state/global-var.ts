import { ReactInfiniteGridProps } from '@egjs/react-infinitegrid'

export const panelSize = {
  left_width: 0,
  right_width: 0,
}

export const scrollCache = new Map<string, number>()
export const otherCache = new Map<string, Map<string, number | string | boolean>>()
export const gridCache: Map<string, ReactInfiniteGridProps['status']> = new Map<
  string,
  ReactInfiniteGridProps['status']
>()

export const subjectInitScroll = { x: 0 }

export const ImageLoadCache = new Map<string, boolean>()
