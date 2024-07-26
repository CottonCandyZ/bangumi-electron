import NavButton, { NavButtonProps } from '@renderer/components/nav/nav-button'
import { Button } from '@renderer/components/ui/button'
import ProfileMenu from '@renderer/components/user/avatarMenu'
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
      icon: <span className="i-mingcute-home-4-line text-[1.7rem]" />,
      active: <span className="i-mingcute-home-4-fill text-[1.7rem]" />,
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
      icon: <span className="i-mingcute-search-line text-[1.7rem]" />,
      active: <span className="i-mingcute-search-fill text-[1.7rem]" />,
    },
    {
      name: '讨论',
      path: '/talk',
      icon: <span className="i-mingcute-chat-3-line text-[1.7rem]" />,
      active: <span className="i-mingcute-chat-3-fill text-[1.7rem]" />,
    },
  ]

  return (
    <nav className="flex h-full w-16 flex-col items-center justify-between px-2 pb-2">
      <div className="drag-region h-16 w-full"></div>
      <div className="flex h-full flex-col items-center justify-between">
        <ul className="flex w-full flex-col">
          {route.map((item) => (
            <li key={item.name}>
              <NavButton {...item} />
            </li>
          ))}
        </ul>
        <div className="flex flex-col">
          <div className="p-1.5">
            <ProfileMenu />
          </div>
          <Button
            className={cn(
              'relative aspect-square h-auto w-full p-2 text-primary/65 hover:text-primary',
              openCollectionState.isOpen && 'text-primary',
            )}
            onClick={() => openCollectionState.toggle()}
            variant="ghost"
          >
            {/* {openCollectionState.isOpen ? (
            <div className="absolute bottom-3 left-0.5 top-3 w-0.5 rounded-xl bg-primary" />
          ) : null} */}
            {openCollectionState.isOpen ? (
              <span className="i-mingcute-inbox-2-fill text-[1.7rem]" />
            ) : (
              <span className="i-mingcute-inbox-2-line text-[1.7rem]" />
            )}
          </Button>
          <Button
            variant="ghost"
            className="aspect-square h-auto w-full p-2 text-primary/65 hover:text-primary"
          >
            <span className="i-mingcute-menu-line text-[1.7rem]" />
          </Button>
        </div>
      </div>
    </nav>
  )
}
