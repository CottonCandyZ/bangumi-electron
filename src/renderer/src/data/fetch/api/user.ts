import { USER, apiFetchWithAuth } from '@renderer/data/fetch/config/'
import { UerInfoAPI } from '@renderer/data/types/user'

/**
 * v0 接口拿 UserInfo
 */
export async function getUserInfoWithAuth() {
  return await apiFetchWithAuth<UerInfoAPI>(USER.ME)
}
