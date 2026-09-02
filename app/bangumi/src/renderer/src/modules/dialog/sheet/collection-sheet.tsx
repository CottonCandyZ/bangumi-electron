import { AddOrModifySubjectCollectionForm } from '@renderer/modules/common/collections/modify/form/subject-form'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@renderer/components/ui/sheet'
import { useAtom, useAtomValue } from 'jotai'
import { useQuery } from '@tanstack/react-query'
import { client } from '@renderer/lib/client'
import { userIdAtom } from '@renderer/state/session'
import {
  subjectCollectionSheetFormAtom,
  type SubjectCollectionSheetProps,
} from '@renderer/state/dialog/sheet'
import { useCallback, useEffect, useRef } from 'react'

export function SubjectCollectionSheet() {
  const [sheetProps, setSheetProps] = useAtom(subjectCollectionSheetFormAtom)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const setOpen = useCallback(
    (open: boolean) => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
      setSheetProps({ open })

      if (!open) {
        closeTimerRef.current = setTimeout(() => {
          setSheetProps({ open: false, content: null })
          closeTimerRef.current = null
        }, 240)
      }
    },
    [setSheetProps],
  )

  useEffect(
    () => () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    },
    [],
  )

  return (
    <Sheet open={sheetProps.open} onOpenChange={setOpen}>
      {sheetProps.content && (
        <Content
          key={sheetProps.content.subjectId}
          content={sheetProps.content}
          setOpen={setOpen}
        />
      )}
    </Sheet>
  )
}

function Content({
  content,
  setOpen,
}: {
  content: SubjectCollectionSheetProps
  setOpen: (open: boolean) => void
}) {
  const { sheetTitle, ...formProps } = content
  const userId = Number(useAtomValue(userIdAtom))
  const subjectId = Number(content.subjectId)
  const state = useQuery({
    queryKey: ['collection-form', userId, subjectId],
    queryFn: () => client.collectionState({ userId, subjectId }),
    networkMode: 'always',
    persister: undefined,
    gcTime: 0,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
  const saved = state.data?.local.collection ?? state.data?.retained

  return (
    <SheetContent className="gap-0 p-0" style={{ width: 'min(92vw, 38rem)', maxWidth: '38rem' }}>
      <SheetHeader className="border-border/70 border-b px-5 py-4 pr-12 text-left">
        <SheetTitle className="text-base">{sheetTitle}</SheetTitle>
      </SheetHeader>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {state.isFetching ? (
          <p className="p-5 text-sm">正在读取本地收藏…</p>
        ) : state.isError ? (
          <p className="p-5 text-sm" role="alert">
            无法读取本地收藏，请关闭后重试。
          </p>
        ) : (
          <AddOrModifySubjectCollectionForm
            {...formProps}
            key={userId}
            rate={formProps.rate ?? saved?.rate}
            comment={formProps.comment ?? saved?.comment ?? ''}
            tags={formProps.tags ?? saved?.tags}
            isPrivate={formProps.isPrivate ?? saved?.private}
            success={() => setOpen(false)}
          />
        )}
      </div>
    </SheetContent>
  )
}
