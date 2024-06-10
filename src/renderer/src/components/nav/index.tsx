import NavButton, { NavButtonProps } from '@renderer/components/nav/nav-button'
import { Button } from '@renderer/components/ui/button'
import {
  Book,
  Cat,
  Gamepad2,
  Home,
  Library,
  MessageCircle,
  Music,
  Signpost,
  Tv,
} from 'lucide-react'

export default function NavBar() {
  const route: NavButtonProps[] = [
    {
      name: '发现',
      path: '/',
      icon: <Home />,
      children: [
        {
          name: 'Anime',
          path: '/anime',
          icon: <Cat />,
        },
        {
          name: 'Game',
          path: '/game',
          icon: <Gamepad2 />,
        },
        {
          name: 'Book',
          path: '/book',
          icon: <Book />,
        },
        {
          name: 'Music',
          path: '/music',
          icon: <Music />,
        },
        {
          name: 'Real',
          path: '/real',
          icon: <Tv />,
        },
      ],
    },
    {
      name: '索引',
      path: '/index',
      icon: <Signpost />,
    },
    {
      name: '讨论',
      path: '/talk',
      icon: <MessageCircle />,
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
          <Library /> <span>Library</span>
        </Button>
      </div>
    </nav>
  )
}
