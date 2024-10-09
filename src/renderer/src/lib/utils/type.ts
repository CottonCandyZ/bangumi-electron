export type ModifyField<T, K extends keyof T, R> = {
  [P in keyof T]: P extends K ? R : T[P]
}
