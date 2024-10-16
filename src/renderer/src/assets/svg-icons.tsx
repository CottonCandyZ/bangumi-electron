import { SVGProps } from 'react'

/**
 * 是自己画的 windows 放大图标！哈哈哈
 */
export function MaximizeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M16.3333 6H4.66667C3.74619 6 3 6.74619 3 7.66667V19.3333C3 20.2538 3.74619 21 4.66667 21H16.3333C17.2538 21 18 20.2538 18 19.3333V7.66667C18 6.74619 17.2538 6 16.3333 6Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7 6V3.66667C7 2.74619 7.74619 2 8.66667 2H20.3333C21.2538 2 22 2.74619 22 3.66667V15.3333C22 16.2538 21.2538 17 20.3333 17H18"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
