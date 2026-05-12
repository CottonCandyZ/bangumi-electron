import { Image } from '@renderer/components/image/image'
import { MyLink } from '@renderer/components/my-link'
import { Tabs } from '@renderer/components/tabs'
import { SingleColumnVirtualList } from '@renderer/components/virtual/single-column-virtual-list'
import { SubjectType } from '@renderer/data/types/subject'
import { monoListPanelCenterActiveItemAtom } from '@renderer/state/panel'
import { useAtomValue } from 'jotai'
import { Children, isValidElement, useRef } from 'react'
import type { Key, PropsWithChildren, ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export const SUBJECT_TYPE_MAP: Record<SubjectType, string> = {
  [SubjectType.book]: '书籍',
  [SubjectType.anime]: '动画',
  [SubjectType.music]: '音乐',
  [SubjectType.game]: '游戏',
  [SubjectType.real]: '三次元',
}

export const ALL_SUBJECT_TYPES = '全部类型'
export const ALL_SUBJECT_RELATIONS = '全部职能'
export const ALL_RELATED_TYPES = '全部类型'

const PANEL_ITEM_CLASS =
  'hover:bg-accent data-[active=true]:bg-accent flex min-h-20 cursor-default flex-row gap-3 rounded-md p-2'

export function MonoListPanelFilters({ children }: { children: ReactNode }) {
  return (
    <div className="flex shrink-0 flex-col items-start gap-2 border-b px-3 py-3">{children}</div>
  )
}

export function PanelFilterTabs({
  label,
  currentSelect,
  setCurrentSelect,
  tabsContent,
  layoutId,
}: {
  label: string
  currentSelect: string
  setCurrentSelect: (id: string, value: string) => void
  tabsContent: Set<string>
  layoutId: string
}) {
  if (tabsContent.size <= 1) return null

  return (
    <div className="flex max-w-full flex-row flex-wrap items-center gap-2">
      <span className="text-muted-foreground text-xs font-medium whitespace-nowrap">{label}</span>
      <Tabs
        currentSelect={currentSelect}
        setCurrentSelect={setCurrentSelect}
        tabsContent={tabsContent}
        layoutId={layoutId}
        className="justify-start"
      />
    </div>
  )
}

export function MonoPanelInfiniteList({
  activeIndex,
  children,
}: {
  activeIndex?: number
  children: ReactNode
}) {
  const centerActiveItem = useAtomValue(monoListPanelCenterActiveItemAtom)
  const items = Children.toArray(children)

  if (items.length === 0) {
    return <div className="text-muted-foreground p-4 text-sm">没有符合条件的项目。</div>
  }

  return (
    <SingleColumnVirtualList
      items={items}
      getKey={(item, index) => getReactNodeKey(item) ?? index}
      renderItem={(item) => item}
      activeIndex={centerActiveItem ? activeIndex : undefined}
      rootClassName="flex-1"
      className="px-2 py-2"
      estimateSize={84}
      gap={4}
      showBackToTop
    />
  )
}

function getReactNodeKey(item: ReactNode): Key | null {
  return isValidElement(item) ? item.key : null
}

export function PanelItemImage({ image }: { image?: string }) {
  return image ? (
    <Image
      imageSrc={image}
      className="flex aspect-square h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md"
      imageClassName="h-full w-full object-contain"
      loadingClassName="aspect-square h-16 w-16"
      careLoading
    />
  ) : (
    <div className="bg-muted h-16 w-16 shrink-0 rounded-md" />
  )
}

export function PanelButtonItem({
  active,
  children,
  to,
}: PropsWithChildren<{ active: boolean; to: string }>) {
  const navigate = useNavigate()
  const ref = useActivePanelItemRef(active)

  const open = () => {
    if (!active) navigate(to)
  }

  return (
    <div
      className={PANEL_ITEM_CLASS}
      data-active={active}
      ref={ref}
      role="link"
      tabIndex={0}
      onClick={open}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return
        event.preventDefault()
        open()
      }}
    >
      {children}
    </div>
  )
}

export function PanelLinkItem({
  active,
  children,
  to,
}: PropsWithChildren<{ active: boolean; to: string }>) {
  const ref = useActivePanelItemRef(active)

  return (
    <div ref={ref}>
      <MyLink
        className={PANEL_ITEM_CLASS}
        data-active={active}
        to={to}
        onClick={(event) => {
          if (active) event.preventDefault()
        }}
      >
        {children}
      </MyLink>
    </div>
  )
}

export function useIsRouteActive(to: string) {
  const { pathname } = useLocation()
  return isRoutePathActive(pathname, to)
}

export function useActivePanelItemRef(active: boolean) {
  void active
  const ref = useRef<HTMLDivElement>(null)

  return ref
}

function normalizeRoutePath(path: string) {
  const pathOnly = path.split(/[?#]/)[0]
  if (pathOnly.length <= 1) return pathOnly
  return pathOnly.replace(/\/+$/, '')
}

export function isRoutePathActive(pathname: string, to: string) {
  return normalizeRoutePath(pathname) === normalizeRoutePath(to)
}
