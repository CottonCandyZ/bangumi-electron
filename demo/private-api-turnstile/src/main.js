import './styles.css'

const TURNSTILE_ENDPOINT = 'https://next.bgm.tv/p1/turnstile'
const ALLOWED_REDIRECTS = [
  'chii://',
  'bangumi://',
  'ani://bangumi-turnstile-callback',
  'bangulite://turnstile/callback',
  'anix://tv.bgm/turnstile',
  'https://oauth-backend-jet.vercel.app/api/turnstile/callback',
]

const form = document.querySelector('#turnstile-form')
const redirectInput = document.querySelector('#redirect-uri')
const themeInput = document.querySelector('#theme')
const urlLink = document.querySelector('#turnstile-url')
const tokenOutput = document.querySelector('#callback-token')
const statusOutput = document.querySelector('#status')

redirectInput.value = 'bangumi://turnstile/callback'

function buildTurnstileUrl() {
  const url = new URL(TURNSTILE_ENDPOINT)
  url.searchParams.set('redirect_uri', redirectInput.value.trim())
  url.searchParams.set('theme', themeInput.value)
  return url
}

function isAllowedRedirect(uri) {
  return ALLOWED_REDIRECTS.some((allowed) => uri.startsWith(allowed))
}

function refreshUrl() {
  const redirectUri = redirectInput.value.trim()
  const url = buildTurnstileUrl()
  urlLink.href = url.toString()
  urlLink.textContent = url.toString()

  if (isAllowedRedirect(redirectUri)) {
    statusOutput.textContent = '回调地址在 Bangumi 白名单内，可以打开 Turnstile 获取 token。'
    statusOutput.dataset.kind = 'ok'
  } else {
    statusOutput.textContent =
      '回调地址不在 Bangumi 白名单内，线上接口会返回 Invalid redirect URI。localhost 不能直接接收真实 token。'
    statusOutput.dataset.kind = 'warn'
  }
}

function readCallbackToken() {
  const token = new URL(window.location.href).searchParams.get('token')
  tokenOutput.textContent = token || '未检测到'
}

form.addEventListener('submit', (event) => {
  event.preventDefault()
  window.open(buildTurnstileUrl().toString(), '_blank', 'noopener,noreferrer')
})

redirectInput.addEventListener('input', refreshUrl)
themeInput.addEventListener('change', refreshUrl)

readCallbackToken()
refreshUrl()
