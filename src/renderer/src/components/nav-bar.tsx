import { Button, buttonVariants } from '@renderer/components/ui/button'
import { cn } from '@renderer/lib/utils'
import { Book, Cat, Gamepad2, Home, Library, Music, Tv } from 'lucide-react'
import { NavLink } from 'react-router-dom'

export default function NavBar(): JSX.Element {
  const route = [
    {
      name: 'Home',
      path: '/',
      icon: <Home />,
    },
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
  ]

  return (
    <nav className="px-1 flex flex-col justify-between h-full">
      <ul className="flex flex-col gap-1 overflow-auto">
        {route.map((item) => (
          <li key={item.name}>
            {/* <Button asChild className="size-16" variant="ghost"> */}
            <NavLink
              to={item.path}
              className={({ isActive, isPending }) =>
                cn(
                  'flex flex-col relative',
                  buttonVariants({
                    variant: 'ghost',
                    className: 'size-16 hover:text-primary text-primary/65',
                  }),
                  isActive &&
                    `before:absolute before:left-0.5 before:top-6 before:bottom-6 before:w-1
                    before:bg-primary before:rounded-xl bg-accent text-primary`,
                )
              }
            >
              {item.icon}
              <span>{item.name}</span>
            </NavLink>
            {/* </Button> */}
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
