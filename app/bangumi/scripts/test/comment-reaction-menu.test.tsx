// @vitest-environment jsdom

import { Menu } from '@base-ui/react/menu'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { toast } from 'sonner'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import type { ReactionItem } from '../../src/renderer/src/components/comment/comment-reactions'
import { CommentReactionMenuEntry } from '../../src/renderer/src/components/context-menu/comment-reaction-entry'
import type { ReactionTarget } from '../../src/renderer/src/data/fetch/api/reaction'

const request = vi.fn()
const currentUser = { id: 42, nickname: 'Me', username: 'me' }
const queryKey = ['episode-comments', '10']
const target: ReactionTarget = { id: 10, type: 'episode' }
let queryClient: QueryClient

vi.mock('../../src/renderer/src/data/fetch/config', () => ({
  nextFetchWithOptionalAuth: (...args: unknown[]) => request(...args),
}))

vi.mock('../../src/renderer/src/data/hooks/factory', async () => {
  const { useMutation } = await import('@tanstack/react-query')
  return { useMutationMustAuth: useMutation }
})

vi.mock('../../src/renderer/src/data/hooks/session', () => ({
  useSession: () => currentUser,
}))

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))

beforeEach(() => {
  vi.clearAllMocks()
  request.mockReset().mockResolvedValue({})
  queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  })
})

afterEach(() => {
  cleanup()
  queryClient.clear()
})

const anchor = { getBoundingClientRect: () => new DOMRect(10, 10, 0, 0) }

function ReactionMenu({ comment, target }: { comment: ReactionItem; target: ReactionTarget }) {
  const [open, setOpen] = useState(true)

  return (
    <Menu.Root modal={false} open={open} onOpenChange={setOpen}>
      <Menu.Portal>
        <Menu.Positioner anchor={anchor}>
          <Menu.Popup>
            {open && (
              <CommentReactionMenuEntry
                comment={comment}
                onDone={() => setOpen(false)}
                target={target}
              />
            )}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}

async function renderMenu(comment: ReactionItem, reactionTarget = target) {
  queryClient.setQueryData(queryKey, [comment])
  await act(async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ReactionMenu comment={comment} target={reactionTarget} />
      </QueryClientProvider>,
    )
  })
}

async function select(name: string) {
  await act(async () => {
    fireEvent.click(screen.getByRole('menuitem', { name }))
  })
}

function cachedReactions() {
  return queryClient.getQueryData<ReactionItem[]>(queryKey)?.[0].reactions
}

test('adds a reaction to the selected comment after closing the menu', async () => {
  await renderMenu({ id: 200, reactions: [] })
  await select('贴贴 bgm67')

  expect(screen.queryByText('贴贴')).toBeNull()
  expect(request).toHaveBeenCalledExactlyOnceWith('/p1/episodes/-/comments/200/like', {
    method: 'PUT',
    body: { value: 0 },
  })
  expect(cachedReactions()).toEqual([{ value: 0, users: [currentUser] }])
  expect(toast.success).toHaveBeenCalledWith('贴贴成功')
})

test.each([
  { ...currentUser, username: 'previous-name' },
  { ...currentUser, id: 99 },
])('cancels the current reaction identified by $id / $username', async (user) => {
  await renderMenu({ id: 200, reactions: [{ value: 0, users: [user] }] })
  await select('取消贴贴')

  expect(request).toHaveBeenCalledExactlyOnceWith('/p1/episodes/-/comments/200/like', {
    method: 'DELETE',
  })
  expect(cachedReactions()).toEqual([])
  expect(toast.success).toHaveBeenCalledWith('已取消贴贴')
})

test('replaces the current reaction while preserving other users', async () => {
  const otherUser = { id: 7, username: 'other', nickname: 'Other' }
  await renderMenu({ id: 200, reactions: [{ value: 0, users: [currentUser, otherUser] }] })
  await select('贴贴 bgm88')

  expect(request).toHaveBeenCalledExactlyOnceWith('/p1/episodes/-/comments/200/like', {
    method: 'PUT',
    body: { value: 104 },
  })
  expect(cachedReactions()).toEqual([
    { value: 0, users: [otherUser] },
    { value: 104, users: [currentUser] },
  ])
})

test('limits collection reactions to the supported expressions', async () => {
  await renderMenu({ id: 200 }, { id: 10, type: 'subject-collect' })

  expect(screen.getByRole('menuitem', { name: '贴贴 bgm67' })).toBeTruthy()
  expect(screen.queryByRole('menuitem', { name: '贴贴 bgm63' })).toBeNull()
})

test('rolls back and reports a failed request after the menu unmounts', async () => {
  let rejectRequest!: (error: Error) => void
  request.mockImplementation(
    () =>
      new Promise((_, reject) => {
        rejectRequest = reject
      }),
  )
  const reactions = [{ value: 104, users: [currentUser] }]
  await renderMenu({ id: 200, reactions })
  await select('贴贴 bgm67')

  expect(screen.queryByText('贴贴')).toBeNull()
  expect(cachedReactions()).toEqual([{ value: 0, users: [currentUser] }])

  await act(async () => rejectRequest(new Error('network failed')))

  expect(cachedReactions()).toEqual(reactions)
  expect(toast.error).toHaveBeenCalledExactlyOnceWith('network failed')
  expect(toast.success).not.toHaveBeenCalled()
})
