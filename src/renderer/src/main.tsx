import './assets/main.css'

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import Home from '@renderer/app/home/page'
import RootLayout from '@renderer/app/layout'
import AnimeHome from '@renderer/app/anime/anime'
import GameHome from '@renderer/app/game/page'
import BookHome from '@renderer/app/book/page'
import MusicHome from '@renderer/app/music/page'
import RealHome from '@renderer/app/real/page'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: '',
        element: <RootLayout />,
        children: [
          {
            path: '',
            element: <Home />,
          },
          {
            path: '/anime',
            element: <AnimeHome />,
          },
          {
            path: '/game',
            element: <GameHome />,
          },
          {
            path: '/book',
            element: <BookHome />,
          },
          {
            path: '/music',
            element: <MusicHome />,
          },
          {
            path: '/anime',
            element: <AnimeHome />,
          },
          {
            path: '/real',
            element: <RealHome />,
          },
        ],
      },
    ],
  },
])

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
