import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'


/**
 * 给 shadcn 用的，拼接 class 的工具
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
