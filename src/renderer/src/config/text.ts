export const TEXT_CONFIG = {
  LOGIN_STEP: {
    START_LOGIN: '正在登录...',
    WEB_VERIFY_SUCCESS: '网页验证成功 (1/5)',
    GET_AUTH_FORM_SUCCESS: '获取授权表单成功 (2/5)',
    GET_AUTH_CODE_SUCCESS: '获得授权 Code 成功 (3/5)',
    GET_AUTH_SECRET_SUCCESS: '获得授权 secret 成功 (4/5)',
    LOGIN_SUCCESS: '登录成功 (5/5)',
  },
  LOGIN_DIALOG: {
    TITLE: '登录',
    STEP_EXPLAIN: {
      TITLE: '登录将模拟网页版来实现，会执行五个步骤：',
      STEP: ['模拟网页完成登录获得 cookie', '获取授权码的表单', '授权', '获取 token', '保存信息'],
    },
  },
  LOGIN_FORM_TITLE: {
    EMAIL: '邮箱',
    PASSWORD: '密码',
    CAPTCHA: '验证码',
    REMEMBER_PASSWORD: '记住密码',
  },
  REMEMBER_PASSWORD_HINT: '会使用 electron safeStore 来保存，除了你，没有人可以得到它！',
  FORM_ERROR: {
    COMMON_TITLE: 'Ooops 出错啦',
    CAPTCHA_LOAD_RETRY_ERROR: '验证码获取失败，点击重试',
  },
  LOGIN_ERROR: {
    NETWORK_ERROR: '网络错误',
    UNKNOWN_ERROR: '未知错误（可检查控制台）',
  },
  FORM: {
    REQUIRED: '不能为空噢',
    MAIL_FORMAT_ERROR: '邮箱格式不对的说',
    CAPTCHA_LENGTH_ERROR: '验证码需要五位',
  },
  BUTTON_LOGIN: '登录',
  ADD_SUBJECT_COLLECTION: {
    COMMENT_EXCEED_MAX_LENGTH: '不可以超过 380 个字哦',
    TAGS_EXCEED_MAX_LENGTH: '标签不可以超过 10 个',
  },
} as const
