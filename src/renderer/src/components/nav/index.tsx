import NavButton, { NavButtonProps } from '@renderer/components/nav/nav-button'
import { Button } from '@renderer/components/ui/button'

export default function NavBar() {
  const route: NavButtonProps[] = [
    {
      name: '发现',
      path: '/',
      icon: <span className="i-mingcute-home-4-line text-3xl" />,
      active: <span className="i-mingcute-home-4-fill text-3xl" />,
      // children: [
      //   {
      //     name: 'Anime',
      //     path: '/anime',
      //     icon: <Cat />,
      //   },
      //   {
      //     name: 'Game',
      //     path: '/game',
      //     icon: <Gamepad2 />,
      //   },
      //   {
      //     name: 'Book',
      //     path: '/book',
      //     icon: <Book />,
      //   },
      //   {
      //     name: 'Music',
      //     path: '/music',
      //     icon: <Music />,
      //   },
      //   {
      //     name: 'Real',
      //     path: '/real',
      //     icon: <Tv />,
      //   },
      // ],
    },
    {
      name: '索引',
      path: '/index',
      icon: <span className="i-mingcute-search-line text-3xl" />,
      active: <span className="i-mingcute-search-fill text-3xl" />,
    },
    {
      name: '讨论',
      path: '/talk',
      icon: <span className="i-mingcute-chat-3-line text-3xl" />,
      active: <span className="i-mingcute-chat-3-fill text-3xl" />,
    },
  ]

  return (
    <nav className="px-1 flex flex-col justify-between h-full">
      <ul className="flex flex-col gap-1 overflow-auto">
        {route.map((item) => (
          <li key={item.name}>
            <NavButton {...item} />
          </li>
        ))}
      </ul>
      <div>
        <Button
          className="size-16 flex flex-col hover:text-primary text-primary/65"
          variant="ghost"
        >
          <span className="i-mingcute-book-5-line text-3xl" />
        </Button>
      </div>
    </nav>
  )
}
