import { NavButton } from '@renderer/modules/nav/link/button'

export const route = [
  {
    name: '主页',
    path: '/',
    icon: <span className="i-mingcute-home-2-line ui-icon-nav" />,
    active: <span className="i-mingcute-home-2-fill ui-icon-nav" />,
  },
  {
    name: '搜索',
    path: '/search',
    icon: <span className="i-mingcute-search-line ui-icon-nav" />,
    active: <span className="i-mingcute-search-fill ui-icon-nav" />,
  },
  {
    name: '讨论',
    path: '/talk',
    icon: <span className="i-mingcute-chat-3-line ui-icon-nav" />,
    active: <span className="i-mingcute-chat-3-fill ui-icon-nav" />,
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
