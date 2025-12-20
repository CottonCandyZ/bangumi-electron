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
import { TEXT_CONFIG } from '@renderer/config/text'
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
import { useLocalLoginInfoQuery } from '@renderer/data/hooks/db/user'
import { useSetAtom } from 'jotai'
import { deleteLoginAccountDialogAtom } from '@renderer/state/dialog/alert'
import { client } from '@renderer/lib/client'
import { deleteLoginInfo } from '@renderer/data/fetch/db/user'
import { store } from '@renderer/state/utils'
import { userIdAtom } from '@renderer/state/session'

const {
  FORM: LOGIN_FORM_MESSAGE,
  LOGIN_STEP: STEP_MESSAGE,
  LOGIN_ERROR,
  LOGIN_FORM_TITLE,
  FORM_ERROR,
  REMEMBER_PASSWORD_HINT,
  BUTTON_LOGIN,
} = TEXT_CONFIG

export function LoginForm({ success = () => {} }: { success?: () => void }) {
  const queryClient = useQueryClient()
  // init data
  const loginInfo = useLocalLoginInfoQuery().data
  const deleteAlertDialog = useSetAtom(deleteLoginAccountDialogAtom)
  const firstTime = useRef(true)

  const formSchema = z.object({
    email: z
      .string()
      .min(1, { message: LOGIN_FORM_MESSAGE.REQUIRED })
      .email(LOGIN_FORM_MESSAGE.MAIL_FORMAT_ERROR),
    password: z.string().min(1, { message: LOGIN_FORM_MESSAGE.REQUIRED }),
    captcha: z.string().length(5, { message: LOGIN_FORM_MESSAGE.CAPTCHA_LENGTH_ERROR }),
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
  const toastId = useRef<string | number | undefined>(undefined)
  // 登录流程
  const login = async (props: webLoginProps) => {
    toastId.current = toast.loading(STEP_MESSAGE.START_LOGIN, {
      duration: Infinity,
    })
    await webLogin({ ...props })
    toast.loading(STEP_MESSAGE.WEB_VERIFY_SUCCESS, { id: toastId.current })
    await getOAuthFormHash()
    toast.loading(STEP_MESSAGE.GET_AUTH_FORM_SUCCESS, { id: toastId.current })
    await getOAuthCode()
    toast.loading(STEP_MESSAGE.GET_AUTH_CODE_SUCCESS, { id: toastId.current })
    await getOAuthAccessToken()
    toast.loading(STEP_MESSAGE.GET_AUTH_SECRET_SUCCESS, { id: toastId.current })
    const user_id = await save()
    store.set(userIdAtom, user_id.toString())
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
      toast.success(STEP_MESSAGE.LOGIN_SUCCESS, {
        id: toastId.current,
        duration: 3000,
      })
      queryClient.invalidateQueries({ queryKey: ['accessToken'] })
      success()
    },
    onError(error) {
      if (error instanceof LoginError) {
        toast.error(error.message, { id: toastId.current, duration: 3000 })
      } else if (error instanceof FetchError) {
        console.error(error.message)
        toast.error(LOGIN_ERROR.NETWORK_ERROR, {
          id: toastId.current,
          duration: 3000,
        })
      } else {
        toast.error(LOGIN_ERROR.UNKNOWN_ERROR, {
          id: toastId.current,
          duration: 3000,
        })
      }
      form.reset({
        email: form.getValues('email'),
        password: form.getValues('password'),
        savePassword: form.getValues('savePassword'),
        captcha: undefined,
      })
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
      open: true,
      content: {
        email,
        onDeleted: () => {
          deleteMutation.mutate({ email })
        },
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
              <FormLabel>{LOGIN_FORM_TITLE.EMAIL}</FormLabel>
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
              <FormLabel>{LOGIN_FORM_TITLE.PASSWORD}</FormLabel>
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
                <FormLabel>{LOGIN_FORM_TITLE.CAPTCHA}</FormLabel>
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
              <AlertTitle>{FORM_ERROR.COMMON_TITLE}</AlertTitle>
              <AlertDescription>{FORM_ERROR.CAPTCHA_LOAD_RETRY_ERROR}</AlertDescription>
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
            <FormItem className="flex flex-row items-start space-y-0 space-x-3 rounded-md">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel>
                {LOGIN_FORM_TITLE.REMEMBER_PASSWORD}{' '}
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <CircleHelp className="-mt-1 inline size-3" />
                  </HoverCardTrigger>
                  <HoverCardContent className="text-sm font-normal">
                    <p>{REMEMBER_PASSWORD_HINT}</p>
                  </HoverCardContent>
                </HoverCard>
              </FormLabel>
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {BUTTON_LOGIN}
        </Button>
      </form>
    </Form>
  )
}
