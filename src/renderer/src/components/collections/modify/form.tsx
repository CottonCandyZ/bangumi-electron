import { zodResolver } from '@hookform/resolvers/zod'
import RateButtons from '@renderer/components/collections/rate'
import SubjectCollectionSelector from '@renderer/components/collections/subject-select'
import { Button } from '@renderer/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@renderer/components/ui/form'
import { Select, SelectTrigger, SelectValue } from '@renderer/components/ui/select'
import { Separator } from '@renderer/components/ui/separator'
import { TEXT_CONFIG } from '@renderer/config'
import { CollectionData, CollectionType } from '@renderer/data/types/collection'
import { SubjectType } from '@renderer/data/types/subject'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const add_subject_collection_message = TEXT_CONFIG.add_subject_collection

export default function AddOrModifySubjectCollectionForm({
  subjectType,
  collectionType,
  rate = 0,
  comment = '',
  isPrivate = false,
  tags = [],
}: {
  subjectType: SubjectType
  collectionType: CollectionType
  rate?: CollectionData['rate']
  comment?: string
  isPrivate?: boolean
  tags?: CollectionData['tags']
}) {
  const formSchema = z.object({
    collectionType: z.string(),
    rate: z.custom<CollectionData['rate']>(),
    comment: z.string().max(380, { message: add_subject_collection_message.comment_max_length }),
    tags: z.array(z.string()),
    isPrivate: z.boolean(),
  })
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      collectionType: collectionType.toString(),
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
        <FormField
          control={form.control}
          name="collectionType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>标记为</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SubjectCollectionSelector subjectType={subjectType} />
              </Select>
            </FormItem>
          )}
        />
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
        <Button type="submit" className="w-full">
          添加
        </Button>
      </form>
    </Form>
  )
}
