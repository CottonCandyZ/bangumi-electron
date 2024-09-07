import PanelButton from '@renderer/modules/nav/panel/button'

export const route = [
  {
    name: '动画',
    panelName: 'anime',
    icon: <span className="i-mingcute-tv-2-line text-[1.4rem]" />,
    active: <span className="i-mingcute-tv-2-fill text-[1.4rem]" />,
  },
  {
    name: '游戏',
    panelName: 'game',
    icon: <span className="i-mingcute-game-1-line text-[1.4rem]" />,
    active: <span className="i-mingcute-game-1-fill text-[1.4rem]" />,
  },
  {
    name: '书籍',
    panelName: 'book',
    icon: <span className="i-mingcute-book-6-line text-[1.4rem]" />,
    active: <span className="i-mingcute-book-6-fill text-[1.4rem]" />,
  },
  {
    name: '音乐',
    panelName: 'music',
    icon: <span className="i-mingcute-music-3-line text-[1.4rem]" />,
    active: <span className="i-mingcute-music-3-fill text-[1.4rem]" />,
  },
  {
    name: '三次元',
    panelName: 'real',
    icon: <span className="i-mingcute-tv-1-line text-[1.4rem]" />,
    active: <span className="i-mingcute-tv-1-fill text-[1.4rem]" />,
  },
] as const

export function PanelNav() {
  return (
    <ul className="flex w-full flex-col items-center gap-1">
      {route.map((item) => (
        <li key={item.name} className="flex w-full justify-center">
          <PanelButton {...item} />
        </li>
      ))}
    </ul>
  )
}
