import {
  FormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@renderer/components/ui/form'
import { Input } from '@renderer/components/ui/input'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@renderer/components/ui/button'
import { CONFIG } from '@renderer/config/config'
import { useQuery } from '@tanstack/react-query'
import { getCaptcha, getLoginFormHash } from '@renderer/constants/api/login'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useToast } from '@renderer/components/ui/use-toast'

const login_form_message = CONFIG.login_form

export default function LoginForm() {
  const { toast } = useToast()
  const {
    isFetching,
    isError,
    data: captcha_src,
  } = useQuery({
    queryKey: ['Captcha'],
    queryFn: async () => {
      await getLoginFormHash()
      return await getCaptcha()
    },
  })
  if (isError) {
    toast({ variant: 'destructive', title: 'Web 表单获取失败', description: '请过会儿再试噢' })
  }

  const formSchema = z.object({
    mail: z
      .string()
      .min(1, { message: login_form_message.required })
      .email(login_form_message.mail_format_error),
    password: z.string().min(1, { message: login_form_message.required }),
    captcha: z.string().length(5, { message: login_form_message.captcha_length_error }),
  })
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mail: '',
      password: '',
      captcha: '',
    },
  })
  // async function onSubmit(values: z.infer<typeof formSchema>) {
  //   return
  // }
  return (
    <Form {...form}>
      <form className="space-y-8">
        <FormField
          control={form.control}
          name="mail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>邮箱</FormLabel>
              <FormControl>
                <Input placeholder="xxx@gmail.com" {...field} />
              </FormControl>
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
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="captcha"
          render={({ field }) => (
            <FormItem>
              <FormLabel>验证码</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="h-[60px] w-[160px]">
          {isFetching ? <Skeleton className="w-full h-full" /> : <img src={captcha_src} />}
        </div>

        <Button type="submit">登录</Button>
      </form>
    </Form>
  )
}
