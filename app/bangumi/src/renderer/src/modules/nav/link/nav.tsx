import { NavButton } from '@renderer/modules/nav/link/button'

export const route = [
  {
    name: '主页',
    path: '/',
    icon: <span className="i-mingcute-home-2-line text-lg" />,
    active: <span className="i-mingcute-home-2-fill text-lg" />,
  },
  {
    name: '搜索',
    path: '/search',
    icon: <span className="i-mingcute-search-line text-lg" />,
    active: <span className="i-mingcute-search-fill text-lg" />,
  },
  {
    name: '讨论',
    path: '/talk',
    icon: <span className="i-mingcute-chat-3-line text-lg" />,
    active: <span className="i-mingcute-chat-3-fill text-lg" />,
  },
] as const

export function LinkNav() {
  return (
    <ul className="flex w-full flex-col gap-0.5">
      {route.map((item) => (
        <li key={item.name}>
          <NavButton {...item} />
        </li>
      ))}
    </ul>
  )
}
