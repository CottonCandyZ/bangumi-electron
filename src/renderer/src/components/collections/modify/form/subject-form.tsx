import { zodResolver } from '@hookform/resolvers/zod'
import FormTags from '@renderer/components/collections/modify/tags-form'
import RateButtons from '@renderer/components/collections/rate'
import SubjectCollectionSelectorContent from '@renderer/components/collections/subject-select-content'
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
import { Separator } from '@renderer/components/ui/separator'
import { Switch } from '@renderer/components/ui/switch'
import { Textarea } from '@renderer/components/ui/textarea'
import { useSession } from '@renderer/components/wrapper/session-wrapper'
import { INPUT_LIMIT_CONFIG, TEXT_CONFIG } from '@renderer/config'
import { useMutationSubjectCollection } from '@renderer/data/hooks/api/collection'
import { SubjectId } from '@renderer/data/types/bgm'
import { CollectionData, CollectionType } from '@renderer/data/types/collection'
import { Subject, SubjectType } from '@renderer/data/types/subject'
import { cn } from '@renderer/lib/utils'
import { useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const add_subject_collection_message = TEXT_CONFIG.add_subject_collection

export default function AddOrModifySubjectCollectionForm({
  subjectId,
  subjectType,
  subjectTags,
  collectionType,
  rate = 0,
  comment = '',
  isPrivate = false,
  tags = [],
  modify = false,
  setOpen,
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
  setOpen: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const { userInfo, accessToken } = useSession()
  const username = userInfo?.username
  const formSchema = z.object({
    collectionType: z.number(),
    rate: z.custom<CollectionData['rate']>(),
    comment: z.string().max(INPUT_LIMIT_CONFIG.short_comment_length_limit, {
      message: add_subject_collection_message.comment_exceed_max_length,
    }),
    tags: z.set(z.string()).max(INPUT_LIMIT_CONFIG.tags_max_length_limit, {
      message: add_subject_collection_message.tags_exceed_max_length,
    }),
    isPrivate: z.boolean(),
  })
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
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
      setOpen(false)
      toast.success(modify ? '修改成功！' : '添加成功！')
    },
    onError(_error, _variable, context) {
      toast.error('呀，出了点错误...')
      if (!modify) return
      queryClient.setQueryData(
        ['collection-subject', { subjectId, username }, accessToken],
        (context as { pre: CollectionData }).pre,
      )
    },
    onMutate(variable) {
      queryClient.cancelQueries({
        queryKey: ['collection-subject', { subjectId, username }, accessToken],
      })
      if (!modify) return
      const pre = queryClient.getQueryData([
        'collection-subject',
        { subjectId, username },
        accessToken,
      ]) as CollectionData | null | undefined
      if (!pre) return { pre }
      queryClient.setQueryData(['collection-subject', { subjectId, username }, accessToken], {
        ...pre,
        type: variable.collectionType!,
        rate: variable.rate!,
        private: variable.isPrivate!,
        tags: variable.tags!,
        comment: variable.comment!,
      } satisfies CollectionData)
      return { pre }
    },
    onSettled() {
      queryClient.invalidateQueries({
        queryKey: ['collection-subject', { subjectId, username }],
      })
      queryClient.invalidateQueries({
        queryKey: ['collection-subjects'],
      })
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    subjectCollectionMutation.mutate({
      subjectId: subjectId,
      ...values,
      tags: [...values.tags],
      modify: modify,
    })
  }
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex justify-between">
          <FormField
            control={form.control}
            name="collectionType"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-2 space-y-0">
                <FormLabel className="shrink-0 text-base">标记为</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(Number(value))}
                  defaultValue={field.value.toString()}
                >
                  <FormControl>
                    <SelectTrigger className="w-fit">
                      <SelectValue />
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
              <FormItem className="flex flex-row items-center gap-2 space-y-0">
                <FormLabel className={cn(!field.value && 'text-muted-foreground')}>
                  {field.value ? '私密' : '设为私密'}
                </FormLabel>
                <FormControl>
                  <Switch onCheckedChange={field.onChange} checked={field.value} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="rate"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">评价</FormLabel>
              <FormControl>
                <RateButtons rate={field.value} onRateChanged={field.onChange} form />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">收藏标签</FormLabel>
              <FormControl>
                <FormTags
                  collectionTags={tags}
                  selectedTags={field.value}
                  subjectTags={subjectTags}
                  onTagsChanges={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Separator />
        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex flex-row items-center gap-2">
                <span className="text-base">短评</span>{' '}
                <FormDescription
                  className={cn(
                    field.value.length > INPUT_LIMIT_CONFIG.short_comment_length_limit &&
                      'text-destructive',
                  )}
                >
                  {INPUT_LIMIT_CONFIG.short_comment_length_limit - field.value.length}
                </FormDescription>
              </FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="sticky bottom-0 w-full"
          disabled={subjectCollectionMutation.isPending}
        >
          {modify ? '修改' : '添加'}
        </Button>
      </form>
    </Form>
  )
}
