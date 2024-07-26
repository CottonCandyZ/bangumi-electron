import NavButton, { NavButtonProps } from '@renderer/components/nav/nav-button'
import { Button } from '@renderer/components/ui/button'
import { cn } from '@renderer/lib/utils'
import { create } from 'zustand'

type OpenCollectionType = {
  isOpen: boolean
  toggle: () => void
}

export const useOpenCollection = create<OpenCollectionType>()((set) => ({
  isOpen: false,
  toggle: () => set((pre) => ({ isOpen: !pre.isOpen })),
}))

export default function NavBar() {
  const openCollectionState = useOpenCollection((state) => state)
  const route: NavButtonProps[] = [
    {
      name: '发现',
      path: '/',
      icon: <span className="i-mingcute-home-4-line text-2xl" />,
      active: <span className="i-mingcute-home-4-fill text-2xl" />,
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
      icon: <span className="i-mingcute-search-line text-2xl" />,
      active: <span className="i-mingcute-search-fill text-2xl" />,
    },
    {
      name: '讨论',
      path: '/talk',
      icon: <span className="i-mingcute-chat-3-line text-2xl" />,
      active: <span className="i-mingcute-chat-3-fill text-2xl" />,
    },
  ]

  return (
    <nav className="flex h-full w-12 flex-col items-center justify-between px-1 pb-2">
      <ul className="flex flex-col gap-1 overflow-auto">
        {route.map((item) => (
          <li key={item.name}>
            <NavButton {...item} />
          </li>
        ))}
      </ul>
      <div>
        <Button
          className={cn(
            'relative flex aspect-square h-auto w-full flex-col p-2 text-primary/65 hover:text-primary',
            openCollectionState.isOpen && 'bg-accent text-primary',
          )}
          onClick={() => openCollectionState.toggle()}
          variant="ghost"
        >
          {openCollectionState.isOpen ? (
            <div className="absolute bottom-3 left-0.5 top-3 w-0.5 rounded-xl bg-primary" />
          ) : null}
          <span className="i-mingcute-book-5-line text-2xl" />
        </Button>
      </div>
    </nav>
  )
}
