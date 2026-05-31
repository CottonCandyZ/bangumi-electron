import { createHashRouter } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'
import App from './App'
import MainErrorElement from '@renderer/error/main-error-element'
import AppShellErrorElement from '@renderer/error/app-shell-error-element'
import NotFoundElement from '@renderer/error/not-found-element'

const pageModules = import.meta.glob('./app/**/page.tsx')

const toRoutePath = (filePath: string): string => {
  const normalizedPath = filePath.replace(/\\/g, '/')
  const rawPath = normalizedPath.replace('./app/', '').replace('/page.tsx', '')
  if (rawPath === 'home') {
    return ''
  }

  return rawPath.replace(/\[(.+?)\]/g, ':$1')
}

const pageRoutes: RouteObject[] = Object.keys(pageModules)
  .map((filePath) => ({
    path: toRoutePath(filePath),
    errorElement: <MainErrorElement />,
    lazy: pageModules[filePath] as RouteObject['lazy'],
  }))
  .sort((a, b) => (a.path ?? '').localeCompare(b.path ?? ''))

export const router: ReturnType<typeof createHashRouter> = createHashRouter(
  [
    {
      path: '/',
      element: <App />,
      children: [
        {
          path: 'command',
          lazy: () => import('@renderer/routes/command-overlay'),
        },
        {
          path: '',
          errorElement: <AppShellErrorElement />,
          lazy: () => import('@renderer/app/layout'),
          children: [
            ...pageRoutes,
            {
              path: '*',
              element: <NotFoundElement />,
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
