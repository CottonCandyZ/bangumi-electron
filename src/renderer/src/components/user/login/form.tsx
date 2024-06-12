import {
  FormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@renderer/components/ui/form'
import { Input } from '@renderer/components/ui/input'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@renderer/components/ui/button'

export default function LoginForm() {
  const formSchema = z.object({
    mail: z.string().min(1, { message: '不能为空噢' }).email('邮箱的格式不太对'),
    password: z.string().min(1, { message: '不能为空噢' }),
  })
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mail: '',
      password: '',
    },
  })
  function onSubmit(values: z.infer<typeof formSchema>) {}
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="mail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>邮箱</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              {/* <FormDescription>邮箱</FormDescription> */}
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>密码</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              {/* <FormDescription>密码</FormDescription> */}
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">登录</Button>
      </form>
    </Form>
  )
}
