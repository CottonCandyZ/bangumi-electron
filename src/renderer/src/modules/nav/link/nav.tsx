import { NavButton } from '@renderer/modules/nav/link/button'

export const route = [
  {
    name: '主页',
    path: '/',
    icon: <span className="i-mingcute-home-2-line text-[1.4rem]" />,
    active: <span className="i-mingcute-home-2-fill text-[1.4rem]" />,
  },
  {
    name: '搜索',
    path: '/search',
    icon: <span className="i-mingcute-search-line text-[1.4rem]" />,
    active: <span className="i-mingcute-search-fill text-[1.4rem]" />,
  },
  {
    name: '讨论',
    path: '/talk',
    icon: <span className="i-mingcute-chat-3-line text-[1.4rem]" />,
    active: <span className="i-mingcute-chat-3-fill text-[1.4rem]" />,
  },
] as const

export function LinkNav() {
  return (
    <ul className="flex w-full flex-col gap-1">
      {route.map((item) => (
        <li key={item.name} className={'flex w-full justify-center'}>
          <NavButton {...item} />
        </li>
      ))}
    </ul>
  )
}
