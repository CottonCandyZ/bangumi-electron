import {
  isWebVerificationRequired,
  markWebVerificationComplete,
  subscribeWebVerificationRequired,
} from '@renderer/data/fetch/config/web-access'
import { parseTopListFromHTML } from '@renderer/data/transformer/web'
import type { SectionPath } from '@renderer/data/types/web'
import { client } from '@renderer/lib/client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback, useSyncExternalStore } from 'react'
import { toast } from 'sonner'

export function useWebVerificationRequired() {
  return useSyncExternalStore(
    subscribeWebVerificationRequired,
    isWebVerificationRequired,
    isWebVerificationRequired,
  )
}

export function useBangumiWebVerification(sectionPath: SectionPath = 'anime') {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => client.requestBangumiWebVerification({ sectionPath }),
    onSuccess: (html) => {
      const topList = parseTopListFromHTML(html)
      markWebVerificationComplete()
      queryClient.setQueryData(['SectionTrendsV2', sectionPath], topList)
      queryClient.setQueryData(['SectionTrendsInfiniteV2', sectionPath], {
        pages: [topList],
        pageParams: [1],
      })
      toast.success('网页验证完成，已更新 Bangumi 数据')
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : '网页验证失败'
      if (message.includes('已取消')) return
      toast.error(message)
    },
  })
}

export function useBangumiWebRefresh({
  onRefresh,
  sectionPath,
}: {
  onRefresh: () => Promise<unknown>
  sectionPath: SectionPath
}) {
  const verificationRequired = useWebVerificationRequired()
  const { isPending: verificationPending, mutateAsync: verify } =
    useBangumiWebVerification(sectionPath)
  const refresh = useCallback(() => {
    if (!verificationRequired) return onRefresh()
    return verify().catch(() => undefined)
  }, [onRefresh, verificationRequired, verify])

  return {
    refresh,
    verificationPending,
    verificationRequired,
  }
}
