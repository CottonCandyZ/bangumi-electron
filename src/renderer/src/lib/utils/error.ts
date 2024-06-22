export class LoginError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'LoginError'
  }
}

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
