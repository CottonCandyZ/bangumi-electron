import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Textarea } from '@renderer/components/ui/textarea'
import { Skeleton } from '@renderer/components/ui/skeleton'
import {
  useCreateIndexMutation,
  useCreateIndexRelatedMutation,
  useDeleteIndexMutation,
  useDeleteIndexRelatedMutation,
  useIndexQuery,
  useIndexRelatedQuery,
  useUpdateIndexMutation,
  useUpdateIndexRelatedMutation,
} from '@renderer/data/hooks/api/index'
import { useSession } from '@renderer/data/hooks/session'
import type { Index } from '@renderer/data/types/index'
import { loginDialogAtom } from '@renderer/state/dialog/normal'
import { useSetAtom } from 'jotai'
import { Loader2, Plus, Save, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

export function CreateIndexPage() {
  return <IndexEditor mode="create" />
}

export function EditIndexPage({ indexId }: { indexId: number }) {
  const query = useIndexQuery({ enabled: Number.isInteger(indexId), indexId })
  const session = useSession()
  if (query.isError) return <EditorMessage text="暂时无法读取目录。" />
  if (!query.data || session === undefined) return <IndexEditorSkeleton />
  if (session === null || query.data.uid !== session.id)
    return <EditorMessage text="只有目录作者可以编辑。" />
  return <IndexEditor index={query.data} mode="edit" />
}

function IndexEditor({ index, mode }: { index?: Index; mode: 'create' | 'edit' }) {
  const [title, setTitle] = useState(index?.title ?? '')
  const [desc, setDesc] = useState(index?.desc ?? '')
  const [isPrivate, setIsPrivate] = useState(index?.private ?? false)
  const session = useSession()
  const openLoginDialog = useSetAtom(loginDialogAtom)
  const createMutation = useCreateIndexMutation()
  const updateMutation = useUpdateIndexMutation()
  const deleteMutation = useDeleteIndexMutation()
  const navigate = useNavigate()
  const pending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending

  const submit = async () => {
    if (session === null) return openLoginDialog({ open: true })
    if (!title.trim()) return toast.error('目录标题不能为空')
    try {
      if (mode === 'create') {
        const created = await createMutation.mutateAsync({
          title: title.trim(),
          desc,
          private: isPrivate,
        })
        toast.success('目录已创建')
        navigate(`/index/${created.id}/edit`)
      } else if (index) {
        await updateMutation.mutateAsync({
          indexId: index.id,
          title: title.trim(),
          desc,
          private: isPrivate,
        })
        toast.success('目录已保存')
        navigate(`/index/${index.id}`)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '保存失败')
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-10 py-8">
      <header>
        <h1 className="text-3xl font-semibold">{mode === 'create' ? '创建目录' : '编辑目录'}</h1>
        <p className="text-muted-foreground mt-1 text-sm">整理条目、人物、章节、日志与讨论。</p>
      </header>
      <section className="flex flex-col gap-4 rounded-lg border p-5">
        <label className="flex flex-col gap-2 text-sm font-medium">
          标题
          <Input
            disabled={pending}
            maxLength={80}
            onChange={(event) => setTitle(event.target.value)}
            value={title}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium">
          描述
          <Textarea
            className="min-h-36"
            disabled={pending}
            onChange={(event) => setDesc(event.target.value)}
            value={desc}
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            checked={isPrivate}
            disabled={pending}
            onChange={(event) => setIsPrivate(event.target.checked)}
            type="checkbox"
          />
          仅自己可见
        </label>
        <div className="flex justify-between gap-3 border-t pt-4">
          {mode === 'edit' && index ? (
            <Button
              disabled={pending}
              onClick={async () => {
                if (!window.confirm('确定删除这个目录？此操作不可撤销。')) return
                try {
                  await deleteMutation.mutateAsync({ indexId: index.id })
                  toast.success('目录已删除')
                  navigate('/profile')
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : '删除失败')
                }
              }}
              variant="destructive"
            >
              <Trash2 className="size-4" />
              删除
            </Button>
          ) : (
            <span />
          )}
          <Button disabled={pending || session === undefined} onClick={submit}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            保存
          </Button>
        </div>
      </section>
      {mode === 'edit' && index && <RelatedContentEditor indexId={index.id} />}
    </main>
  )
}

const RELATED_TYPES = [
  [0, '条目'],
  [1, '角色'],
  [2, '人物'],
  [3, '章节'],
  [4, '日志'],
  [5, '小组话题'],
  [6, '条目讨论'],
] as const

function RelatedContentEditor({ indexId }: { indexId: number }) {
  const [category, setCategory] = useState(0)
  const [targetId, setTargetId] = useState('')
  const [comment, setComment] = useState('')
  const mutation = useCreateIndexRelatedMutation()
  const query = useIndexRelatedQuery({ enabled: true, indexId, limit: 100 })
  const items = query.data?.pages.flatMap((page) => page.data) ?? []

  return (
    <section className="flex flex-col gap-4 rounded-lg border p-5">
      <div>
        <h2 className="text-xl font-semibold">关联内容</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          通过内容 ID 添加；顺序和备注可在目录详情中确认。
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-[10rem_1fr_2fr_auto]">
        <select
          className="border-input bg-background h-9 rounded-md border px-3 text-sm"
          value={category}
          onChange={(event) => setCategory(Number(event.target.value))}
        >
          {RELATED_TYPES.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <Input
          inputMode="numeric"
          placeholder="内容 ID"
          value={targetId}
          onChange={(event) => setTargetId(event.target.value)}
        />
        <Input
          placeholder="备注（可选）"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
        />
        <Button
          disabled={mutation.isPending || !Number(targetId)}
          onClick={async () => {
            try {
              await mutation.mutateAsync({ indexId, cat: category, sid: Number(targetId), comment })
              setTargetId('')
              setComment('')
              toast.success('已添加关联内容')
            } catch (error) {
              toast.error(error instanceof Error ? error.message : '添加失败')
            }
          }}
        >
          <Plus className="size-4" />
          添加
        </Button>
      </div>
      <p className="text-muted-foreground text-xs">
        当前共 {items.length} 项{query.hasNextPage ? '，还有更多内容' : ''}。
      </p>
      {items.length > 0 && (
        <div className="flex flex-col gap-2 border-t pt-4">
          {items.map((item) => (
            <RelatedContentRow indexId={indexId} item={item} key={item.id} />
          ))}
        </div>
      )}
    </section>
  )
}

function RelatedContentRow({
  indexId,
  item,
}: {
  indexId: number
  item: import('@renderer/data/types/index').IndexRelated
}) {
  const [order, setOrder] = useState(item.order.toString())
  const [comment, setComment] = useState(item.comment)
  const updateMutation = useUpdateIndexRelatedMutation()
  const deleteMutation = useDeleteIndexRelatedMutation()
  const pending = updateMutation.isPending || deleteMutation.isPending

  return (
    <div className="bg-muted/30 grid items-center gap-2 rounded-md p-2 sm:grid-cols-[5rem_6rem_1fr_auto_auto]">
      <span className="text-muted-foreground text-xs">
        {RELATED_TYPES.find(([value]) => value === item.cat)?.[1] ?? item.cat} #{item.sid}
      </span>
      <Input
        disabled={pending}
        inputMode="numeric"
        onChange={(event) => setOrder(event.target.value)}
        value={order}
      />
      <Input
        disabled={pending}
        onChange={(event) => setComment(event.target.value)}
        value={comment}
      />
      <Button
        disabled={pending}
        onClick={() =>
          updateMutation.mutate(
            { indexId, relatedId: item.id, order: Number(order) || 0, comment },
            {
              onSuccess: () => toast.success('关联内容已保存'),
              onError: (error) => toast.error(error.message),
            },
          )
        }
        size="sm"
        variant="outline"
      >
        保存
      </Button>
      <Button
        disabled={pending}
        onClick={() =>
          deleteMutation.mutate(
            { indexId, relatedId: item.id },
            {
              onSuccess: () => toast.success('关联内容已删除'),
              onError: (error) => toast.error(error.message),
            },
          )
        }
        size="icon"
        variant="ghost"
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  )
}

function EditorMessage({ text }: { text: string }) {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <p className="text-muted-foreground text-sm">{text}</p>
    </div>
  )
}

function IndexEditorSkeleton() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-10 py-8">
      <header className="flex flex-col gap-2">
        <Skeleton className="h-10 w-44" />
        <Skeleton className="h-4 w-72" />
      </header>
      <section className="flex flex-col gap-4 rounded-lg border p-5">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-36 w-full" />
        </div>
        <Skeleton className="h-4 w-24" />
        <div className="flex justify-between border-t pt-4">
          <Skeleton className="h-9 w-16" />
          <Skeleton className="h-9 w-20" />
        </div>
      </section>
      <section className="flex flex-col gap-4 rounded-lg border p-5">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-3 w-28" />
      </section>
    </main>
  )
}
