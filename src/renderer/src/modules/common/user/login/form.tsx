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
import { TEXT_CONFIG } from '@renderer/config'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getCaptcha,
  getLoginFormHash,
  getOAuthAccessToken,
  getOAuthCode,
  getOAuthFormHash,
  save,
  webLogin,
  webLoginProps,
} from '@renderer/data/fetch/web/login'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { Checkbox } from '@renderer/components/ui/checkbox'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@renderer/components/ui/hover-card'
import { toast } from 'sonner'
import { AlertCircle, CircleHelp } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@renderer/components/ui/alert'
import { LoginError } from '@renderer/lib/utils/error'
import { FetchError } from 'ofetch'
import { useEffect, useRef } from 'react'
import { InputSelector } from '@renderer/components/input-selector'
import { useLoginInfoQuery } from '@renderer/data/hooks/db/user'
import { useSetAtom } from 'jotai'
import { openLoginDeleteAccountAction } from '@renderer/state/dialog/alert'
import { client } from '@renderer/lib/client'
import { deleteLoginInfo } from '@renderer/data/fetch/db/user'

const login_form_message = TEXT_CONFIG.login_form

export function LoginForm({ success = () => {} }: { success?: () => void }) {
  const queryClient = useQueryClient()
  // init data
  const loginInfo = useLoginInfoQuery().data
  const deleteAlertDialog = useSetAtom(openLoginDeleteAccountAction)
  const firstTime = useRef(true)

  const formSchema = z.object({
    email: z
      .string()
      .min(1, { message: login_form_message.required })
      .email(login_form_message.mail_format_error),
    password: z.string().min(1, { message: login_form_message.required }),
    captcha: z.string().length(5, { message: login_form_message.captcha_length_error }),
    savePassword: z.boolean(),
  })
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      captcha: '',
      savePassword: true,
    },
  })
  useEffect(() => {
    if (!firstTime.current || !loginInfo) return
    firstTime.current = false
    if (loginInfo.length === 0) return
    const { email, password: enPassword } = loginInfo[0]
    form.setValue('email', email)
    if (enPassword) {
      client.getSafeStorageDecrypted({ encrypted: [enPassword] }).then(([password]) => {
        form.setValue('password', password)
        form.setValue('savePassword', true)
      })
    }
  }, [loginInfo, form])
  const toastId = useRef<string | number>()
  // 登录流程
  const login = async (props: webLoginProps) => {
    toastId.current = toast.loading('正在登录', { duration: Infinity })
    await webLogin({ ...props })
    toast.loading('网页验证成功 (1/5)', { id: toastId.current })
    await getOAuthFormHash()
    toast.loading('获取授权表单成功 (2/5)', { id: toastId.current })
    await getOAuthCode()
    toast.loading('获得授权 Code 成功 (3/5)', { id: toastId.current })
    await getOAuthAccessToken()
    toast.loading('获得授权 secret 成功 (4/5)', { id: toastId.current })
    const user_id = await save()
    localStorage.setItem('current_user_id', user_id.toString())
  }

  const captcha = useQuery({
    queryKey: ['captcha'],
    staleTime: 0,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      await getLoginFormHash()
      return await getCaptcha()
    },
  })

  const mutation = useMutation({
    mutationKey: ['session'],
    mutationFn: login,
    onSuccess() {
      toast.success('登陆成功 (5/5)', { id: toastId.current, duration: 3000 })
      queryClient.invalidateQueries({ queryKey: ['accessToken'] })
      success()
    },
    onError(error) {
      if (error instanceof LoginError) {
        toast.error(error.message, { id: toastId.current, duration: 3000 })
      } else if (error instanceof FetchError) {
        toast.error('网络错误', { id: toastId.current, duration: 3000 })
      } else {
        toast.error('未知错误', { id: toastId.current, duration: 3000 })
      }
      captcha.refetch()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteLoginInfo,
    onSuccess: (_, { email }) => {
      queryClient.invalidateQueries({ queryKey: ['login-info-list'] })
      if (form.getValues('email') === email) {
        form.setValue('email', '')
        form.setValue('password', '')
        form.setValue('savePassword', true)
      }
    },
  })

  // 提交函数
  async function onSubmit(values: z.infer<typeof formSchema>) {
    mutation.mutate({ ...values })
  }

  const deleteSaveAccount = (email: string) => {
    deleteAlertDialog({
      email,
      onDeleted: () => {
        deleteMutation.mutate({ email })
      },
    })
  }

  const onSelectAccount = (email: string) => {
    const res = loginInfo?.find((item) => item.email === email)
    if (!res?.password) return
    client.getSafeStorageDecrypted({ encrypted: [res.password] }).then(([password]) => {
      form.setValue('password', password)
      form.setValue('savePassword', true)
    })
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
                <InputSelector
                  placeholder="xxx@gmail.com"
                  selectList={loginInfo ? loginInfo?.map((item) => item.email) : []}
                  inputValue={field.value}
                  setValue={field.onChange}
                  onDelete={deleteSaveAccount}
                  onSelectAction={onSelectAccount}
                />
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
                <Input type="password" {...field} className="font-mono" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex flex-row items-end gap-2">
          <FormField
            control={form.control}
            name="captcha"
            render={({ field }) => (
              <FormItem className="shrink-0 grow basis-48">
                <FormLabel>验证码</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {captcha.isFetching ? (
            <Skeleton className="h-[60px] w-[160px]" />
          ) : captcha.isError ? (
            <Alert
              variant="destructive"
              className="cursor-pointer"
              onClick={() => captcha.refetch()}
            >
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Ooops 出错啦</AlertTitle>
              <AlertDescription>验证码获取失败，点击重试</AlertDescription>
            </Alert>
          ) : (
            <img
              src={captcha.data}
              className="cursor-pointer rounded-md"
              onClick={() => captcha.refetch()}
            />
          )}
        </div>
        <FormField
          control={form.control}
          name="savePassword"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel>
                记住密码{' '}
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <CircleHelp className="-mt-1 inline size-3" />
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
