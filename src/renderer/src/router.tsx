import { createHashRouter } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'
import App from './App'
import MainErrorElement from '@renderer/error/main-error-element'

const pageModules = import.meta.glob('./app/**/page.tsx')

const toRoutePath = (filePath: string): string => {
  const rawPath = filePath.replace('./app/', '').replace('/page.tsx', '')
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
          lazy: () => import('@renderer/app/layout'),
          children: pageRoutes,
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
