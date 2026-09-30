import { zodResolver } from '@hookform/resolvers/zod'
import { Radio } from '@base-ui/react/radio'
import { RadioGroup } from '@base-ui/react/radio-group'
import { RateButtons } from '@renderer/modules/common/collections/rate'
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@renderer/components/ui/tooltip'
import { Textarea } from '@renderer/components/ui/textarea'
import { INPUT_LIMIT_CONFIG } from '@renderer/config'
import { useMutationSubjectCollection } from '@renderer/data/hooks/api/collection'
import { SubjectId } from '@renderer/data/types/bgm'
import { CollectionData, CollectionType } from '@renderer/data/types/collection'
import { Subject, SubjectType } from '@renderer/data/types/subject'
import { cn } from '@renderer/lib/utils'
import { COLLECTION_TYPE_MAP } from '@renderer/lib/utils/map'
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

  const subjectCollectionMutation = useMutationSubjectCollection({
    mutationKey: ['subject-collection'],
    onSuccess() {
      success()
      toast.success('收藏已更新')
    },
    onError(error) {
      toast.error(error.message || '收藏更新失败，请重试')
    },
  })

  function onSubmit(values: SubjectCollectionFormValues) {
    const originalTags = new Set(tags)
    const tagsChanged =
      values.tags.size !== originalTags.size ||
      [...values.tags].some((tag) => !originalTags.has(tag))
    subjectCollectionMutation.mutate({
      subjectId,
      collectionType: values.collectionType,
      ...(values.rate !== rate ? { rate: values.rate } : {}),
      ...(values.comment !== comment ? { comment: values.comment } : {}),
      ...(tagsChanged ? { tags: [...values.tags] } : {}),
      ...(values.isPrivate !== isPrivate ? { isPrivate: values.isPrivate } : {}),
      modify,
    })
  }
  return (
    <Form {...form}>
      <form className="flex min-h-full flex-col" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex flex-1 flex-col gap-7 px-5 py-5">
          <CollectionFormSection>
            <div className="flex flex-row items-center justify-between gap-2">
              <FormField
                control={form.control}
                name="collectionType"
                render={({ field }) => (
                  <FormItem className="space-y-0">
                    <FormLabel className="sr-only">收藏状态</FormLabel>
                    <FormControl>
                      <RadioGroup
                        aria-label="收藏状态"
                        className="bg-muted inline-flex flex-row gap-0.5 rounded-md p-0.5"
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        {COLLECTION_TYPES.map((type) => (
                          <Radio.Root
                            key={type}
                            value={type}
                            nativeButton
                            render={<button type="button" />}
                            className={cn(
                              'text-muted-foreground hover:text-foreground h-7 rounded-[5px] px-3 text-xs font-medium transition-colors',
                              field.value === type && 'bg-background text-foreground shadow-sm',
                            )}
                          >
                            {COLLECTION_TYPE_MAP(subjectType)[type]}
                          </Radio.Root>
                        ))}
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isPrivate"
                render={({ field }) => (
                  <FormItem className="space-y-0">
                    <FormLabel className="sr-only">私密收藏</FormLabel>
                    <Tooltip delayDuration={300}>
                      <TooltipTrigger asChild>
                        <FormControl>
                          <button
                            type="button"
                            aria-label={field.value ? '私密收藏，点击公开' : '设为私密'}
                            aria-pressed={field.value}
                            onClick={() => field.onChange(!field.value)}
                            className={cn(
                              'hover:bg-accent flex h-8 flex-row items-center gap-1 rounded-md px-2 text-xs transition-colors',
                              field.value
                                ? 'text-primary'
                                : 'text-muted-foreground hover:text-foreground',
                            )}
                          >
                            <span
                              className={
                                field.value ? 'i-mingcute-lock-fill' : 'i-mingcute-unlock-line'
                              }
                            />
                            {field.value && '私密'}
                          </button>
                        </FormControl>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        {field.value ? '仅自己可见，点击公开' : '设为私密'}
                      </TooltipContent>
                    </Tooltip>
                  </FormItem>
                )}
              />
            </div>
          </CollectionFormSection>

          <CollectionFormSection>
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

          <CollectionFormSection>
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

          <CollectionFormSection>
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

const COLLECTION_TYPES = Object.keys(CollectionType)
  .slice(0, Object.keys(CollectionType).length / 2)
  .map(Number) as CollectionType[]

function CollectionFormSection({ children }: PropsWithChildren) {
  return <section className="min-w-0">{children}</section>
}
