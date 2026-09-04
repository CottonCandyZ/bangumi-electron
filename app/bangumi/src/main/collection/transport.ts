import { session } from 'electron'
import { desc, eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { userSession } from '../../db/schema/user'
import { sqlite } from '../lib/db'
import {
  collectionFields,
  equalValue,
  type CollectionFields,
  type CollectionSnapshot,
  type LocalAccount,
  type RemoteCollection,
} from '../../shared/collection-sync'
import type { CollectionData, CollectionEpisodes, Collections } from '../../shared/types/collection'
import type { Episode } from '../../shared/types/episode'
import { retryableNetworkOperation, SyncError, type CollectionTransport } from './sync'

const agent = 'CottonCandyZ/bangumi-electron (https://github.com/CottonCandyZ/bangumi-electron)'
export function createCollectionTransport(
  userId: number,
  signal: AbortSignal,
  onProfile?: (profile: LocalAccount) => void,
): CollectionTransport {
  let identity: Promise<LocalAccount> | undefined
  const token = drizzle(sqlite)
    .select()
    .from(userSession)
    .where(eq(userSession.user_id, userId))
    .orderBy(desc(userSession.create_time))
    .get()
  async function request(path: string, init?: RequestInit, allow404 = false): Promise<Response> {
    signal.throwIfAborted()
    if (!token) throw new SyncError('请登录后同步；本地更改已保留', 'auth-required')
    const response = await retryableNetworkOperation(
      () =>
        session.defaultSession.fetch(`https://api.bgm.tv${path}`, {
          credentials: 'omit',
          ...init,
          signal: AbortSignal.any([signal, AbortSignal.timeout(25000)]),
          headers: {
            'User-Agent': agent,
            Authorization: `Bearer ${token.access_token}`,
            'Content-Type': 'application/json',
            ...init?.headers,
          },
        }),
      '暂时无法连接 Bangumi，本地更改已保留',
    )
    signal.throwIfAborted()
    if (response.status === 401 || response.status === 403)
      throw new SyncError('授权已失效或没有写入权限，请重新登录', 'auth-required')
    if (response.status === 429) throw new SyncError('请求过于频繁，稍后会重试', 'network')
    if (allow404 && response.status === 404) return response
    if (!response.ok)
      throw new SyncError(
        `Bangumi 请求失败（${response.status}）`,
        response.status >= 500 ? 'network' : 'error',
      )
    return response
  }
  function readJson<T>(response: Response): Promise<T> {
    return retryableNetworkOperation(
      () => response.json(),
      '暂时无法读取 Bangumi 响应，本地更改已保留',
    )
  }
  function identify() {
    identity ??= request('/v0/me')
      .then((response) => readJson<LocalAccount>(response))
      .then((profile: LocalAccount) => {
        if (profile.id !== userId)
          throw new SyncError('登录账号与本地收藏账号不一致', 'auth-required')
        onProfile?.(profile)
        return profile
      })
    return identity
  }
  return {
    async list(offset) {
      const profile = await identify()
      return readJson<Collections>(
        await request(
          `/v0/users/${encodeURIComponent(profile.username)}/collections?limit=50&offset=${offset}`,
        ),
      )
    },
    async read(subjectId) {
      const profile = await identify()
      const response = await request(
        `/v0/users/${encodeURIComponent(profile.username)}/collections/${subjectId}`,
        undefined,
        true,
      )
      const collection: CollectionData | null =
        response.status === 404 ? null : await readJson<CollectionData>(response)
      if (!collection) {
        // A collection 404 alone is ambiguous. Verify the subject is still accessible.
        await request(`/v0/subjects/${subjectId}`)
      }
      const episodes: Episode[] = []
      const states: CollectionSnapshot['episodes'] = {}
      let offset = 0
      let total = Infinity
      while (offset < total) {
        const page = await readJson<CollectionEpisodes>(
          await request(
            `/v0/users/-/collections/${subjectId}/episodes?limit=1000&offset=${offset}`,
          ),
        )
        total = page.total
        for (const item of page.data ?? []) {
          episodes.push(item.episode)
          states[item.episode.id] = item.type
        }
        offset += page.data?.length ?? 0
        if (offset >= page.total) break
        if (!page.data?.length) throw new SyncError('章节列表未完整返回，稍后重试', 'network')
      }
      const fields: CollectionFields | null = collection
        ? {
            type: collection.type,
            rate: collection.rate,
            comment: collection.comment,
            tags: collection.tags,
            private: collection.private,
          }
        : null
      return {
        snapshot: { collection: fields, episodes: states, episodesComplete: true },
        subject: collection?.subject,
        updatedAt: collection ? Date.parse(collection.updated_at) : undefined,
        episodes,
        epStatus: collection?.ep_status ?? 0,
        volStatus: collection?.vol_status ?? 0,
      } satisfies RemoteCollection
    },
    async write(subjectId, before, target) {
      const profile = await identify()
      if (target.collection === null) {
        if (before.collection !== null) await removeWebCollection(subjectId, profile, signal)
        return
      }
      if (!target.collection) throw new SyncError('收藏状态尚未获取，无法同步')
      const patch: Partial<CollectionFields> = {}
      for (const key of collectionFields) {
        if (!equalValue(before.collection?.[key], target.collection[key], key))
          Object.assign(patch, { [key]: target.collection[key] })
      }
      if (!before.collection || Object.keys(patch).length) {
        await request(`/v0/users/-/collections/${subjectId}`, {
          method: before.collection ? 'PATCH' : 'POST',
          body: JSON.stringify(patch),
        })
      }
      for (const state of [0, 1, 2, 3]) {
        const ids = Object.keys(target.episodes)
          .filter((id) => target.episodes[id] === state && before.episodes[id] !== state)
          .map(Number)
        for (let offset = 0; offset < ids.length; offset += 100) {
          await request(`/v0/users/-/collections/${subjectId}/episodes`, {
            method: 'PATCH',
            body: JSON.stringify({ type: state, episode_id: ids.slice(offset, offset + 100) }),
          })
        }
      }
    },
  }
}

async function removeWebCollection(subjectId: number, profile: LocalAccount, signal: AbortSignal) {
  // Snapshot cookies so an account switch cannot substitute a different account mid-request.
  const cookies = await session.defaultSession.cookies.get({ url: 'https://bgm.tv' })
  const cookie = cookies.map((item) => `${item.name}=${item.value}`).join('; ')
  const web = async (path: string) => {
    signal.throwIfAborted()
    return retryableNetworkOperation(async () => {
      const response = await session.defaultSession.fetch(`https://bgm.tv${path}`, {
        credentials: 'omit',
        signal: AbortSignal.any([signal, AbortSignal.timeout(25000)]),
        headers: {
          Cookie: cookie,
          'User-Agent': agent,
          Referer: 'https://bgm.tv/',
          Origin: 'https://bgm.tv',
        },
      })
      signal.throwIfAborted()
      if (!response.ok) throw new SyncError(`网页请求失败（${response.status}）`, 'network')
      return response.text()
    }, '暂时无法连接 Bangumi 网页，稍后将重试')
  }
  const html = await web(`/subject/${subjectId}`)
  const dock = html.match(/id=["']dock["'][\s\S]*?<\/ul>/)?.[0]
  const username = dock?.match(/href=["'](?:https:\/\/bgm\.tv)?\/user\/([^"'/?]+)/)?.[1]
  if (!username || decodeURIComponent(username) !== profile.username)
    throw new SyncError('网页登录账号无法确认，请重新登录后同步取消收藏', 'auth-required')
  const hash = html.match(new RegExp(`eraseSubjectCollect\\(${subjectId},\\s*'([^']+)'\\)`))?.[1]
  if (!hash) throw new SyncError('未取得取消收藏凭据，请重新登录', 'auth-required')
  await web(`/subject/${subjectId}/remove?gh=${encodeURIComponent(hash)}`)
}
