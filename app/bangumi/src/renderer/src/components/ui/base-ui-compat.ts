import { isValidElement, type ReactElement, type ReactNode } from "react"

/** Keeps the former shadcn `asChild` API while Base UI uses `render`. */
function getAsChildRender(
  asChild: boolean | undefined,
  children: ReactNode
): ReactElement | undefined {
  return asChild && isValidElement(children) ? children : undefined
}

export { getAsChildRender }
