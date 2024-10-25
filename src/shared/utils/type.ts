type IsUnion<T, U extends T = T> = T extends unknown ? ([U] extends [T] ? false : true) : false

export type ModifyField<T, K extends keyof T, R> =
  IsUnion<K> extends true ? Omit<T, K> & R : { [P in keyof T]: P extends K ? R : T[P] }

export type MakeOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
