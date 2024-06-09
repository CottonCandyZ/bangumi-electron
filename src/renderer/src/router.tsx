import { createBrowserRouter } from 'react-router-dom'
import App from './App'

export const router: ReturnType<typeof createBrowserRouter> = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: '',
        lazy: () => import('@renderer/app/layout'),
        children: [
          {
            path: '',
            lazy: () => import('@renderer/app/home/page'),
          },
          {
            path: '/anime',
            lazy: () => import('@renderer/app/anime/page'),
          },
          {
            path: '/game',
            lazy: () => import('@renderer/app/game/page'),
          },
          {
            path: '/book',
            lazy: () => import('@renderer/app/book/page'),
          },
          {
            path: '/music',
            lazy: () => import('@renderer/app/music/page'),
          },
          {
            path: '/real',
            lazy: () => import('@renderer/app/real/page'),
          },
        ],
      },
    ],
  },
])
