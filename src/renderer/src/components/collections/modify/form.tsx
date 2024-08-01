import { zodResolver } from '@hookform/resolvers/zod'
import ScrollWrapper from '@renderer/components/base/scroll-warpper'
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
import { Input } from '@renderer/components/ui/input'
import { Select, SelectTrigger, SelectValue } from '@renderer/components/ui/select'
import { Separator } from '@renderer/components/ui/separator'
import { Switch } from '@renderer/components/ui/switch'
import { Textarea } from '@renderer/components/ui/textarea'
import { INPUT_LIMIT_CONFIG, TEXT_CONFIG } from '@renderer/config'
import { CollectionData, CollectionType } from '@renderer/data/types/collection'
import { Subject, SubjectType } from '@renderer/data/types/subject'
import { cn } from '@renderer/lib/utils'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const add_subject_collection_message = TEXT_CONFIG.add_subject_collection

export default function AddOrModifySubjectCollectionForm({
  subjectType,
  subjectTags,
  collectionType,
  rate = 0,
  comment = '',
  isPrivate = false,
  tags = [],
}: {
  subjectType: SubjectType
  subjectTags: Subject['tags']
  collectionType: CollectionType
  rate?: CollectionData['rate']
  comment?: string
  isPrivate?: boolean
  tags?: CollectionData['tags']
}) {
  const formSchema = z.object({
    collectionType: z.number(),
    rate: z.custom<CollectionData['rate']>(),
    comment: z.string().max(INPUT_LIMIT_CONFIG.short_comment_length_limit, {
      message: add_subject_collection_message.comment_max_length,
    }),
    tags: z.array(z.string()),
    isPrivate: z.boolean(),
  })
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      collectionType: collectionType,
      rate: rate,
      comment: comment,
      isPrivate: isPrivate,
      tags: tags,
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
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
                <FormLabel>标记为</FormLabel>
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
              <FormControl>
                <RateButtons rate={field.value} onRateChanged={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        <Separator />
        {/* <ScrollWrapper className="max-h-40 pr-4">
          <div className="flex flex-row flex-wrap gap-2 after:grow-[999]">
            {subjectTags.map((item) => (
              <Button
                key={item.name}
                className="h-auto flex-auto items-baseline justify-center gap-1 whitespace-normal px-1.5 py-1.5 text-xs"
                variant={'outline'}
                onClick={(e) => e.preventDefault()}
              >
                <span className="text-sm">{item.name}</span>
                <span className="text-xs text-muted-foreground">{item.count}</span>
              </Button>
            ))}
          </div>
        </ScrollWrapper> */}
        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex flex-row gap-2">
                短评{' '}
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

        <Button type="submit" className="w-full">
          添加
        </Button>
      </form>
    </Form>
  )
}
