export const TEXT_CONFIG = {
  login_form: {
    required: '不能为空噢',
    mail_format_error: '邮箱格式不对的说',
    captcha_length_error: '验证码需要五位',
  },
  add_subject_collection: {
    comment_exceed_max_length: '不可以超过 380 个字哦',
    tags_exceed_max_length: '标签不可以超过 10 个',
  },
} as const

export const UI_CONFIG = {
  HOME_SECTION_CAROUSEL_NUMBER: 11,
  HEADER_HEIGHT: 64,
  NAV_WIDTH: 64,
  SUBJECT_INIT_SCROLL_PERCENT: 0.6,
  INFO_BOX_INLINE_BLOCK: ['别名', '平台', '制作'],
}

export const INPUT_LIMIT_CONFIG = {
  short_comment_length_limit: 380,
  tags_max_length_limit: 10,
}
