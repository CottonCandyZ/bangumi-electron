import { expect, test, vi } from 'vitest'
import { insertAccessToken } from '../../src/renderer/src/data/fetch/db/user'
import type { Token } from '../../src/renderer/src/data/types/login'

const mocks = vi.hoisted(() => ({ save: vi.fn(), notify: vi.fn() }))
vi.mock('@renderer/lib/client', () => ({ client: { collectionCredentialsChanged: mocks.notify } }))
vi.mock('@renderer/lib/db/bridge', () => ({ db: { insert: () => ({ values: mocks.save }) } }))
vi.mock('@renderer/lib/utils/data-trans', () => ({ returnFirstOrUndefined: vi.fn() }))

test('persisted tokens become available without waiting for an existing collection scan', async () => {
  let persist!: () => void
  let finishScan!: () => void
  mocks.save.mockReturnValue(
    new Promise<void>((resolve) => {
      persist = resolve
    }),
  )
  mocks.notify.mockReturnValue(
    new Promise<void>((resolve) => {
      finishScan = resolve
    }),
  )
  const token = { user_id: 1, access_token: 'test-token' } as Token
  const pending = insertAccessToken(token)
  expect(mocks.notify).not.toHaveBeenCalled()
  persist()
  await pending
  expect(mocks.notify).toHaveBeenCalledWith({ userId: 1 })
  finishScan()
})

test('a sync notification failure does not reject a successfully saved token', async () => {
  mocks.save.mockResolvedValue(undefined)
  mocks.notify.mockRejectedValue(new Error('sync unavailable'))
  await expect(insertAccessToken({ user_id: 1 } as Token)).resolves.toBeUndefined()
})
