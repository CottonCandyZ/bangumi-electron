import { zodResolver } from '@hookform/resolvers/zod'
import { RateButtons } from '@renderer/modules/common/collections/rate'
import { SubjectCollectionSelectorContent } from '@renderer/modules/common/collections/subject-select-content'
import { Button } from '@renderer/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@renderer/components/ui/form'
import { Select, SelectTrigger, SelectValue } from '@renderer/components/ui/select'
import { Switch } from '@renderer/components/ui/switch'
import { Textarea } from '@renderer/components/ui/textarea'
import { useSessionUsername } from '@renderer/data/hooks/session'
import { INPUT_LIMIT_CONFIG } from '@renderer/config'
import { useMutationSubjectCollection } from '@renderer/data/hooks/api/collection'
import { SubjectId } from '@renderer/data/types/bgm'
import { CollectionData, CollectionType } from '@renderer/data/types/collection'
import { Subject, SubjectType } from '@renderer/data/types/subject'
import { useQueryKeyWithUserId } from '@renderer/data/hooks/factory'
import { cn } from '@renderer/lib/utils'
import { COLLECTION_TYPE_MAP } from '@renderer/lib/utils/map'
import { useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { FormTags } from '@renderer/modules/common/collections/modify/tags/tags-form'
import { TEXT_CONFIG } from '@renderer/config/text'
import type { PropsWithChildren } from 'react'

const { ADD_SUBJECT_COLLECTION } = TEXT_CONFIG
const subjectCollectionFormSchema = z.object({
  collectionType: z.number(),
  rate: z.custom<CollectionData['rate']>(),
  comment: z.string().max(INPUT_LIMIT_CONFIG.short_comment_length_limit, {
    message: ADD_SUBJECT_COLLECTION.COMMENT_EXCEED_MAX_LENGTH,
  }),
  tags: z.set(z.string()).max(INPUT_LIMIT_CONFIG.tags_max_length_limit, {
    message: ADD_SUBJECT_COLLECTION.TAGS_EXCEED_MAX_LENGTH,
  }),
  isPrivate: z.boolean(),
})
type SubjectCollectionFormValues = z.infer<typeof subjectCollectionFormSchema>

const noop = () => {}

export function AddOrModifySubjectCollectionForm({
  subjectId,
  subjectType,
  subjectTags,
  collectionType,
  rate = 0,
  comment = '',
  isPrivate = false,
  tags = [],
  modify = false,
  success = noop,
}: {
  subjectId: SubjectId
  subjectType: SubjectType
  subjectTags: Subject['tags']
  collectionType: CollectionType
  rate?: CollectionData['rate']
  comment?: string
  isPrivate?: boolean
  tags?: CollectionData['tags']
  modify?: boolean
  success?: () => void
}) {
  const queryClient = useQueryClient()
  const username = useSessionUsername()
  const form = useForm<SubjectCollectionFormValues>({
    resolver: zodResolver(subjectCollectionFormSchema),
    defaultValues: {
      collectionType: collectionType,
      rate: rate,
      comment: comment,
      isPrivate: isPrivate,
      tags: new Set<string>(tags),
    },
  })

  const queryKey = useQueryKeyWithUserId(['collection-subject'], { subjectId, username })
  const collectionSubjectsQueryKey = useQueryKeyWithUserId(['collection-subjects'])

  const subjectCollectionMutation = useMutationSubjectCollection({
    mutationKey: ['subject-collection'],
    onSuccess() {
      success()
      toast.success(modify ? '修改成功！' : '添加成功！')
    },
    onError(_error, _variable, context) {
      toast.error('呀，出了点错误...')
      if (!modify) return
      queryClient.setQueryData(queryKey, (context as { pre: CollectionData }).pre)
    },
    onMutate(variable) {
      queryClient.cancelQueries({
        queryKey,
      })
      if (!modify) return
      const pre = queryClient.getQueryData<CollectionData>(queryKey)
      if (!pre) return { pre }
      queryClient.setQueryData<CollectionData>(queryKey, {
        ...pre,
        type: variable.collectionType!,
        rate: variable.rate!,
        private: variable.isPrivate!,
        tags: variable.tags!,
        comment: variable.comment!,
      })
      return { pre }
    },
    onSettled() {
      queryClient.invalidateQueries({
        queryKey,
      })
      queryClient.invalidateQueries({
        queryKey: collectionSubjectsQueryKey,
      })
    },
  })

  function onSubmit(values: SubjectCollectionFormValues) {
    subjectCollectionMutation.mutate({
      subjectId: subjectId,
      ...values,
      tags: [...values.tags],
      modify: modify,
    })
  }
  return (
    <Form {...form}>
      <form className="flex min-h-full flex-col" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex flex-1 flex-col">
          <CollectionFormSection title="收藏状态">
            <div className="space-y-3">
              <FormField
                control={form.control}
                name="collectionType"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-[4rem_auto] items-center justify-start space-y-0 gap-x-3 gap-y-1">
                    <FormLabel>标记为</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger className="w-40 shadow-none">
                          <SelectValue>{COLLECTION_TYPE_MAP(subjectType)[field.value]}</SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SubjectCollectionSelectorContent subjectType={subjectType} />
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isPrivate"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between gap-4 space-y-0 border-t pt-3">
                    <div className="space-y-0.5">
                      <FormLabel className={cn(!field.value && 'text-muted-foreground')}>
                        {field.value ? '私密收藏' : '设为私密'}
                      </FormLabel>
                      <FormDescription>仅自己可见</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </CollectionFormSection>

          <CollectionFormSection title="评分">
            <FormField
              control={form.control}
              name="rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">评分</FormLabel>
                  <FormControl>
                    <RateButtons form onRateChanged={field.onChange} rate={field.value} />
                  </FormControl>
                </FormItem>
              )}
            />
          </CollectionFormSection>

          <CollectionFormSection title="收藏标签">
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">收藏标签</FormLabel>
                  <FormControl>
                    <FormTags
                      collectionTags={tags}
                      onTagsChanges={field.onChange}
                      selectedTags={field.value}
                      subjectTags={subjectTags}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CollectionFormSection>

          <CollectionFormSection title="短评">
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">短评</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Textarea
                        {...field}
                        className="min-h-20 resize-none pb-8 shadow-none"
                        placeholder="写下简短评价（可选）"
                      />
                    </FormControl>
                    <FormDescription
                      className={cn(
                        'pointer-events-none absolute right-3 bottom-2 tabular-nums',
                        field.value.length > INPUT_LIMIT_CONFIG.short_comment_length_limit &&
                          'text-destructive',
                      )}
                    >
                      {field.value.length}/{INPUT_LIMIT_CONFIG.short_comment_length_limit}
                    </FormDescription>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CollectionFormSection>
        </div>

        <div className="bg-background/95 sticky bottom-0 z-10 flex justify-end border-t px-5 py-3 backdrop-blur-sm">
          <Button className="min-w-28" disabled={subjectCollectionMutation.isPending} type="submit">
            {subjectCollectionMutation.isPending
              ? modify
                ? '保存中…'
                : '添加中…'
              : modify
                ? '保存修改'
                : '添加收藏'}
          </Button>
        </div>
      </form>
    </Form>
  )
}

function CollectionFormSection({ children, title }: PropsWithChildren<{ title: string }>) {
  return (
    <section className="space-y-3 border-b px-5 py-4 last:border-b-0">
      <h3 className="text-sm font-medium">{title}</h3>
      <div className="min-w-0">{children}</div>
    </section>
  )
}
