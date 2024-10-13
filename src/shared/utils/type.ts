export type ModifyField<T, K extends keyof T, R> = {
  [P in keyof T]: P extends K ? R : T[P]
}

export type MakeOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
