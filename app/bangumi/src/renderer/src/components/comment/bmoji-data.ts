export const BMOJI_ASSET_BASE_URL = 'https://bgm.tv/js/lib/bmo/assets/'

export const BMOJI_MANIFEST = {
  face: {
    id: 'f',
    layer: 1,
    items: [
      { id: '1', src: './assets/f1_v2.png', layer: 1 },
      { id: '2', src: './assets/f2.png', layer: 1 },
      { id: '3', src: './assets/f3.png', layer: 1 },
      { id: '4', src: './assets/f4.png', layer: 1 },
      { id: '5', src: './assets/f5.png', layer: 1 },
      { id: '6', src: './assets/f6.png', layer: 1, version: 2 },
      { id: '8', src: './assets/f8.png', layer: 1, version: 4 },
      { id: '9', src: './assets/f9.png', layer: 1, version: 4 },
    ],
  },
  mouth: {
    id: 'm',
    layer: 2,
    items: Array.from({ length: 30 }, (_, index) => {
      const id = String(index + 1)
      const version = index >= 26 ? 4 : index >= 23 ? 3 : undefined
      return {
        id,
        src: `./assets/m${id}.png`,
        layer: id === '20' ? 4 : 2,
        ...(version ? { version } : {}),
      }
    }),
  },
  eyes: {
    id: 'e',
    layer: 3,
    items: Array.from({ length: 37 }, (_, index) => {
      const id = String(index + 1)
      const version = index >= 31 ? 4 : index >= 26 ? 3 : id === '26' ? 2 : undefined
      return {
        id,
        src: `./assets/e${id}.png`,
        layer: index >= 26 ? 2 : 3,
        ...(version ? { version } : {}),
      }
    }),
  },
  accessories: {
    id: 'a',
    layer: 4,
    items: Array.from({ length: 39 }, (_, index) => {
      const id = String(index + 1)
      const version = index >= 36 ? 5 : index >= 23 ? 4 : index >= 21 ? 2 : undefined
      return {
        id,
        src: `./assets/a${id}.png`,
        layer: 4,
        ...(version ? { version } : {}),
      }
    }),
  },
  others: {
    id: 'o',
    layer: 5,
    items: Array.from({ length: 27 }, (_, index) => {
      const id = String(index + 1)
      return {
        id,
        src: `./assets/o${id}.png`,
        layer: index >= 14 && index <= 18 ? 1 : index === 6 ? 5 : index >= 7 && index <= 13 ? 4 : 2,
        ...(index >= 19 ? { version: 3 } : {}),
      }
    }),
  },
} as const
