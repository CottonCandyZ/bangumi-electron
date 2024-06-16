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
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  getCaptcha,
  getLoginFormHash,
  getOAuthAccessToken,
  getOAuthCode,
  getOAuthFormHash,
  webLogin,
  webLoginProps,
} from '@renderer/constants/api/login'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { Checkbox } from '@renderer/components/ui/checkbox'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@renderer/components/ui/hover-card'
import { toast } from 'sonner'
import { useEffect, useState } from 'react'
import { AlertCircle, CircleHelp } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@renderer/components/ui/alert'
import { LoginError } from '@renderer/lib/utils/error'
import { FetchError } from 'ofetch'

const login_form_message = CONFIG.login_form

export default function LoginForm() {
  // 步骤
  const [stage, setStage] = useState(0)
  const formSchema = z.object({
    email: z
      .string()
      .min(1, { message: login_form_message.required })
      .email(login_form_message.mail_format_error),
    password: z.string().min(1, { message: login_form_message.required }),
    captcha: z.string().length(5, { message: login_form_message.captcha_length_error }),
    save_password: z.boolean().default(false),
  })
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      captcha: '',
      save_password: false,
    },
  })

  // 显示步骤提示
  useEffect(() => {
    switch (stage) {
      case 1:
        toast.info('网页验证成功 (1/5)')
        break
      case 2:
        toast.info('获取授权表单成功 (2/5)')
        break
      case 3:
        toast.info('获得授权 Code 成功 (3/5)')
        break
      case 4:
        toast.info('获得授权 secret 成功 (4/5)')
        break
      case 5:
        toast.success('登陆成功 (5/5)')
        break
    }
  }, [stage])

  // 登录流程
  const login = async (props: webLoginProps) => {
    await webLogin({ ...props })
    setStage(1)
    await getOAuthFormHash()
    setStage(2)
    await getOAuthCode()
    setStage(3)
    await getOAuthAccessToken()
    setStage(4)
  }

  const {
    data: captcha_src,
    isFetching: captcha_isFetching,
    failureCount: captcha_failureCount,
    refetch: captcha_refetch,
  } = useQuery({
    queryKey: ['captcha'],
    queryFn: async () => {
      await getLoginFormHash()
      return await getCaptcha()
    },
  })

  const mutation = useMutation({
    mutationFn: login,
    onError(error) {
      if (error instanceof LoginError) {
        toast.error(error.message)
      } else if (error instanceof FetchError) {
        toast.error('网络错误')
      } else {
        toast.error('未知错误')
      }
      captcha_refetch()
    },
  })

  // 提交函数
  async function onSubmit(values: z.infer<typeof formSchema>) {
    mutation.mutate({ ...values })
  }
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
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
        <div className="flex flex-row gap-2 items-end">
          <FormField
            control={form.control}
            name="captcha"
            render={({ field }) => (
              <FormItem className="basis-48 shrink-0 grow">
                <FormLabel>验证码</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {captcha_isFetching ? (
            <Skeleton className="h-[60px] w-[160px]" />
          ) : captcha_failureCount == 4 ? (
            <Alert
              variant="destructive"
              className="cursor-pointer"
              onClick={() => captcha_refetch()}
            >
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Ooops 出错啦</AlertTitle>
              <AlertDescription>验证码获取失败，点击重试</AlertDescription>
            </Alert>
          ) : (
            <img
              src={captcha_src}
              className="cursor-pointer rounded-md"
              onClick={() => captcha_refetch()}
            />
          )}
        </div>
        <FormField
          control={form.control}
          name="save_password"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel>
                记住密码{' '}
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <CircleHelp className="size-3 inline -mt-1" />
                  </HoverCardTrigger>
                  <HoverCardContent className="text-sm font-normal">
                    <p>会使用 electron safeStore 来保存，除了你，没有人可以得到它！</p>
                  </HoverCardContent>
                </HoverCard>
              </FormLabel>
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          登录
        </Button>
      </form>
    </Form>
  )
}
