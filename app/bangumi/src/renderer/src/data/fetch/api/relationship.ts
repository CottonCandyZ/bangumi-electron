import {
  NEXT_RELATIONSHIP,
  NEXT_USERS,
  nextFetchWithOptionalAuth,
} from '@renderer/data/fetch/config'
import type {
  Blocklist,
  Friend,
  Friendlist,
  UserInfo,
  UserPage,
  UserTimelineSlimUser,
} from '@renderer/data/types/user'
import { FetchParamError } from '@renderer/lib/utils/error'

export function getFriendlist() {
  return nextFetchWithOptionalAuth<Friendlist>(NEXT_RELATIONSHIP.FRIENDLIST)
}

export function getBlocklist() {
  return nextFetchWithOptionalAuth<Blocklist>(NEXT_RELATIONSHIP.BLOCKLIST)
}

export function getMyFriends({ limit, offset }: { limit?: number; offset: number }) {
  return nextFetchWithOptionalAuth<UserPage<Friend>>(NEXT_RELATIONSHIP.FRIENDS, {
    query: {
      limit,
      offset,
    },
  })
}

export function getMyFollowers({ limit, offset }: { limit?: number; offset: number }) {
  return nextFetchWithOptionalAuth<UserPage<Friend>>(NEXT_RELATIONSHIP.FOLLOWERS, {
    query: {
      limit,
      offset,
    },
  })
}

export function getUserFriends({
  limit,
  offset,
  username,
}: {
  limit?: number
  offset: number
  username: UserInfo['username'] | undefined
}) {
  if (!username) throw new FetchParamError('未获得 username')

  return nextFetchWithOptionalAuth<UserPage<UserTimelineSlimUser>>(
    NEXT_USERS.FRIENDS_BY_USERNAME(username),
    {
      query: {
        limit,
        offset,
      },
    },
  )
}

export function getUserFollowers({
  limit,
  offset,
  username,
}: {
  limit?: number
  offset: number
  username: UserInfo['username'] | undefined
}) {
  if (!username) throw new FetchParamError('未获得 username')

  return nextFetchWithOptionalAuth<UserPage<UserTimelineSlimUser>>(
    NEXT_USERS.FOLLOWERS_BY_USERNAME(username),
    {
      query: {
        limit,
        offset,
      },
    },
  )
}

export async function addFriend({ username }: { username: UserInfo['username'] | undefined }) {
  if (!username) throw new FetchParamError('未获得 username')

  return nextFetchWithOptionalAuth<Record<string, never>>(
    NEXT_RELATIONSHIP.FRIEND_BY_USERNAME(username),
    {
      method: 'PUT',
    },
  )
}

export async function removeFriend({ username }: { username: UserInfo['username'] | undefined }) {
  if (!username) throw new FetchParamError('未获得 username')

  return nextFetchWithOptionalAuth<Record<string, never>>(
    NEXT_RELATIONSHIP.FRIEND_BY_USERNAME(username),
    {
      method: 'DELETE',
    },
  )
}

export async function addBlock({ username }: { username: UserInfo['username'] | undefined }) {
  if (!username) throw new FetchParamError('未获得 username')

  return nextFetchWithOptionalAuth<Blocklist>(NEXT_RELATIONSHIP.BLOCK_BY_USERNAME(username), {
    method: 'PUT',
  })
}

export async function removeBlock({ username }: { username: UserInfo['username'] | undefined }) {
  if (!username) throw new FetchParamError('未获得 username')

  return nextFetchWithOptionalAuth<Blocklist>(NEXT_RELATIONSHIP.BLOCK_BY_USERNAME(username), {
    method: 'DELETE',
  })
}
