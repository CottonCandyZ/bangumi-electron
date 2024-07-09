export type Character = {
  images: Images
  name: string
  relation: string
  actors: Actor[]
  type: number
  id: number
}

export type Actor = {
  images: Images
  name: string
  short_summary: string
  career: string[]
  id: number
  type: number
  locked: boolean
}

export type Images = {
  small: string
  grid: string
  large: string
  medium: string
}
