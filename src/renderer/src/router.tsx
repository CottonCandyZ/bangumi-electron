import { createHashRouter } from 'react-router-dom'
import App from './App'
import MainErrorElement from '@renderer/error/main-error-element'

export const router: ReturnType<typeof createHashRouter> = createHashRouter(
  [
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
              errorElement: <MainErrorElement />,
              lazy: () => import('@renderer/app/home/page'),
            },
            {
              path: 'anime',
              errorElement: <MainErrorElement />,
              lazy: () => import('@renderer/app/anime/page'),
            },
            {
              path: 'game',
              errorElement: <MainErrorElement />,
              lazy: () => import('@renderer/app/game/page'),
            },
            {
              path: 'book',
              errorElement: <MainErrorElement />,
              lazy: () => import('@renderer/app/book/page'),
            },
            {
              path: 'music',
              errorElement: <MainErrorElement />,
              lazy: () => import('@renderer/app/music/page'),
            },
            {
              path: 'real',
              errorElement: <MainErrorElement />,
              lazy: () => import('@renderer/app/real/page'),
            },
            {
              path: 'search',
              errorElement: <MainErrorElement />,
              lazy: () => import('@renderer/app/search/page'),
            },
            {
              path: 'talk',
              errorElement: <MainErrorElement />,
              lazy: () => import('@renderer/app/talk/page'),
            },
            {
              path: 'subject/:subjectId',
              errorElement: <MainErrorElement />,
              lazy: () => import('@renderer/app/subject/page'),
            },
          ],
        },
      ],
    },
  ],
  {
    future: {
      v7_startTransition: true,
    },
  },
)
