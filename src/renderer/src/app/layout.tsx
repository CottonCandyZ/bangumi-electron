import NavBar from '@renderer/components/nav-bar'
import { Outlet } from 'react-router-dom'

export default function RootLayout(): JSX.Element {
  return (
    <main className="flex flex-row *:h-dvh">
      <div className="h-full py-1">
        <NavBar />
      </div>

      <section className="pt-1 overflow-auto w-full">
        <div className="border-t border-l min-h-full p-2 rounded-tl-lg">
          <Outlet />
        </div>
      </section>
    </main>
  )
}
