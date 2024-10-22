export enum LoginErrorCode {
  'CAPTCHA_ERROR',
}

/**
 * 一些有关登陆的错误提示
 */
export class LoginError extends Error {
  code: number
  constructor(message: string, code = 0) {
    super(message)
    this.name = 'LoginError'
    this.code = code
  }
}

/**
 * 一些有关验证的错误提示
 */
export class AuthError extends Error {
  code: number
  constructor(message: string, code: number = 0) {
    super(message)
    this.code = code
    this.name = 'AuthError'
  }
  static notAuth() {
    return new AuthError('没登陆', 1)
  }
  static expire() {
    return new AuthError('已过期', 2)
  }
  static notFound() {
    return new AuthError('没有访问权限或者不存在', 3)
  }
}

/**
 * 有关 Fetch 时抛出的参数错误
 */
export class FetchParamError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FetchParamError'
  }
}
