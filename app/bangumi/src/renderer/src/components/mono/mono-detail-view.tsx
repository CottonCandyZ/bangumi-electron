import { Tabs } from '@renderer/components/tabs'
import { CommentBox } from '@renderer/components/comment/comment-box'
import {
  ViewTransitionElement,
  ViewTransitionImage,
} from '@renderer/components/image/view-transition-image'
import { MyLink } from '@renderer/components/my-link'
import { Badge } from '@renderer/components/ui/badge'
import { Button } from '@renderer/components/ui/button'
import { Card } from '@renderer/components/ui/card'
import { Separator } from '@renderer/components/ui/separator'
import { Skeleton } from '@renderer/components/ui/skeleton'
import {
  MonoComment,
  MonoDetail,
  MonoInfoBox,
  MonoRelatedItem,
  MonoSubjectItem,
  MonoType,
} from '@renderer/data/types/mono'
import { SubjectType } from '@renderer/data/types/subject'
import { useResizeObserver } from '@renderer/hooks/use-resize'
import { renderBBCode } from '@renderer/lib/utils/bbcode'
import { splitRelationLabels } from '@renderer/lib/utils/relation'
import { MainBackToTopButton } from '@renderer/modules/main/back-to-top-button'
import { monoAvatarImageInViewAtom } from '@renderer/state/in-view'
import { openMonoListPanelTabAtomAction } from '@renderer/state/panel'
import { tabFilerAtom } from '@renderer/state/simple-tab'
import { useAtom, useSetAtom } from 'jotai'
import {
  Children,
  cloneElement,
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { CSSProperties, ReactElement, ReactNode } from 'react'
import { useLocation, useNavigate, useViewTransitionState } from 'react-router-dom'

type MonoDetailViewProps = {
  detail?: MonoDetail
  subjects?: MonoSubjectItem[]
  relatedItems?: MonoRelatedItem[]
  relatedTitle: string
  comments?: MonoComment[]
  commentsError?: boolean
  onCommentsInView?: () => void
  avatarViewTransitionName?: string
}

const SUBJECT_TYPE_MAP: Record<SubjectType, string> = {
  [SubjectType.book]: '书籍',
  [SubjectType.anime]: '动画',
  [SubjectType.music]: '音乐',
  [SubjectType.game]: '游戏',
  [SubjectType.real]: '三次元',
}

const DEFAULT_FOLDED_ITEM_COUNT = 8
const FOLDED_ROWS = 2
const GRID_GAP_REM = 0.75
const MONO_SUBJECT_CARD_MIN_WIDTH_REM = 11.5
const MONO_SUBJECT_CARD_HEIGHT_REM = 18
const MONO_RELATED_CARD_MIN_WIDTH_REM = 16
const MONO_RELATED_CARD_HEIGHT_REM = 7
const ALL_SUBJECT_TYPES = '全部类型'
const ALL_SUBJECT_RELATIONS = '全部职能'
const MONO_MAIN_IMAGE_FRAME = 'mx-auto w-full max-w-52 lg:max-w-64'
const MONO_MAIN_IMAGE_LOADING_FRAME = 'aspect-3/4'
const MONO_SUBJECT_IMAGE_FRAME = 'flex h-52 w-full items-center justify-center'
const MONO_RELATED_IMAGE_FRAME = 'flex aspect-square items-center justify-center'
const EXTERNAL_URL_PATTERN = /https?:\/\/[^\s<>"'，。)）\]]+/g

export function MonoDetailView({
  detail,
  subjects,
  relatedItems,
  relatedTitle,
  comments,
  commentsError,
  onCommentsInView,
  avatarViewTransitionName,
}: MonoDetailViewProps) {
  const setAvatarInView = useSetAtom(monoAvatarImageInViewAtom)

  useEffect(() => {
    setAvatarInView(true)
  }, [detail?.id, setAvatarInView])

  if (!detail) return <MonoDetailSkeleton />

  const infobox = getDisplayInfobox(detail.infobox)
  const image = detail.images?.large || detail.images?.medium

  return (
    <div className="max-w-8xl mx-auto flex w-full flex-col gap-10 px-10 pt-12 pb-10">
      <section className="grid gap-8 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          {image ? (
            <ViewTransitionImage
              active={!!avatarViewTransitionName}
              cacheKey="monoAvatarInView"
              className={MONO_MAIN_IMAGE_FRAME}
              imageContainerClassName="w-full overflow-hidden rounded-lg border shadow-sm"
              imageSrc={image}
              imageClassName="h-auto w-full object-contain"
              loadingClassName={MONO_MAIN_IMAGE_LOADING_FRAME}
              loading="eager"
              careLoading
              onInViewChange={setAvatarInView}
              viewTransitionName={avatarViewTransitionName}
            />
          ) : (
            <ViewTransitionElement
              active={!!avatarViewTransitionName}
              cacheKey="monoAvatarInView"
              className={`${MONO_MAIN_IMAGE_FRAME} bg-muted text-muted-foreground flex aspect-3/4 items-center justify-center rounded-lg border text-sm`}
              onInViewChange={setAvatarInView}
              viewTransitionName={avatarViewTransitionName}
            >
              暂无图片
            </ViewTransitionElement>
          )}
          <div className="flex flex-row flex-wrap gap-2">
            <Badge variant="outline">{detail.typeLabel}</Badge>
            {detail.stat.collects > 0 && (
              <Badge variant="outline">{detail.stat.collects} 收藏</Badge>
            )}
            {detail.stat.comments > 0 && (
              <Badge variant="outline">{detail.stat.comments} 吐槽</Badge>
            )}
            {detail.badges.map((badge) => (
              <Badge className="shadow-none" variant="secondary" key={badge}>
                {badge}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <header className="flex flex-col gap-2">
            <h1 className="text-4xl font-semibold tracking-normal break-words">{detail.name}</h1>
          </header>

          {detail.summary ? (
            <section className="bbcode text-muted-foreground leading-7 whitespace-pre-line">
              {renderBBCode(detail.summary)}
            </section>
          ) : (
            <p className="text-muted-foreground">暂时还没有简介。</p>
          )}

          {infobox.length > 0 && (
            <>
              <Separator />
              <InfoBox items={infobox} />
            </>
          )}
        </div>
      </section>

      <MonoSubjectsSection
        monoId={detail.id}
        monoType={detail.type}
        sourceTitle={detail.name}
        subjects={subjects}
      />
      <MonoRelatedSection
        monoId={detail.id}
        monoType={detail.type}
        sourceTitle={detail.name}
        title={relatedTitle}
        items={relatedItems}
      />
      <CommentBox comments={comments} error={commentsError} onInView={onCommentsInView} />
      <MainBackToTopButton />
    </div>
  )
}

function MonoDetailSkeleton() {
  return (
    <div className="max-w-8xl mx-auto grid w-full gap-8 px-10 pt-12 lg:grid-cols-[16rem_minmax(0,1fr)]">
      <div className="flex flex-col gap-4">
        <Skeleton className="aspect-3/4 rounded-lg" />
        <div className="flex flex-row flex-wrap gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-14 rounded-full" />
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <Skeleton className="h-12 w-72" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-11/12" />
          <Skeleton className="h-5 w-4/5" />
        </div>
        <Separator />
        <div className="grid grid-cols-[5rem_minmax(0,1fr)] gap-x-5 gap-y-2">
          {Array(5)
            .fill(0)
            .map((_, index) => (
              <Fragment key={index}>
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-full max-w-md" />
              </Fragment>
            ))}
        </div>
      </div>
    </div>
  )
}

function InfoBox({
  items,
}: {
  items: Array<{ key: string; value: ReactNode; plainValue: string }>
}) {
  return (
    <dl className="grid grid-cols-[max-content_minmax(0,1fr)] gap-x-5 gap-y-2 text-sm">
      {items.map((item) => (
        <div className="contents" key={`${item.key}-${item.plainValue}`}>
          <dt className="text-muted-foreground whitespace-nowrap">{item.key}</dt>
          <dd className="break-words">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function MonoSubjectsSection({
  monoId,
  monoType,
  sourceTitle,
  subjects,
}: {
  monoId: string
  monoType: MonoType
  sourceTitle: string
  subjects?: MonoSubjectItem[]
}) {
  const [filterMap, setFilter] = useAtom(tabFilerAtom)
  const openMonoListPanelTab = useSetAtom(openMonoListPanelTabAtomAction)
  const typeFilterId = `mono-subjects-type-${monoType}-${monoId}`
  const relationFilterId = `mono-subjects-relation-${monoType}-${monoId}`
  const typeFilter = filterMap.get(typeFilterId) ?? ALL_SUBJECT_TYPES
  const relationFilter = filterMap.get(relationFilterId) ?? ALL_SUBJECT_RELATIONS
  const subjectsMatchingRelation = useMemo(
    () =>
      (subjects ?? []).filter(
        (subject) =>
          relationFilter === ALL_SUBJECT_RELATIONS ||
          splitRelationLabels(subject.relation).includes(relationFilter),
      ),
    [relationFilter, subjects],
  )
  const subjectsMatchingType = useMemo(
    () =>
      (subjects ?? []).filter(
        (subject) =>
          typeFilter === ALL_SUBJECT_TYPES || SUBJECT_TYPE_MAP[subject.subjectType] === typeFilter,
      ),
    [subjects, typeFilter],
  )
  const typeFilters = useMemo(
    () =>
      new Set([
        ALL_SUBJECT_TYPES,
        ...subjectsMatchingRelation.map((subject) => SUBJECT_TYPE_MAP[subject.subjectType]),
      ]),
    [subjectsMatchingRelation],
  )
  const relationFilters = useMemo(
    () =>
      new Set([
        ALL_SUBJECT_RELATIONS,
        ...subjectsMatchingType.flatMap((subject) => splitRelationLabels(subject.relation)),
      ]),
    [subjectsMatchingType],
  )
  useEffect(() => {
    if (typeFilter !== ALL_SUBJECT_TYPES && !typeFilters.has(typeFilter)) {
      setFilter(typeFilterId, ALL_SUBJECT_TYPES)
    }
  }, [setFilter, typeFilter, typeFilterId, typeFilters])
  useEffect(() => {
    if (relationFilter !== ALL_SUBJECT_RELATIONS && !relationFilters.has(relationFilter)) {
      setFilter(relationFilterId, ALL_SUBJECT_RELATIONS)
    }
  }, [relationFilter, relationFilterId, relationFilters, setFilter])
  const filteredSubjects = useMemo(
    () =>
      (subjects ?? []).filter((subject) => {
        const matchesType =
          typeFilter === ALL_SUBJECT_TYPES || SUBJECT_TYPE_MAP[subject.subjectType] === typeFilter
        const matchesRelation =
          relationFilter === ALL_SUBJECT_RELATIONS ||
          splitRelationLabels(subject.relation).includes(relationFilter)
        return matchesType && matchesRelation
      }),
    [relationFilter, subjects, typeFilter],
  )
  const pageFilters = (
    <SectionFilters>
      <FilterTabs
        label="作品类型"
        currentSelect={typeFilter}
        setCurrentSelect={setFilter}
        tabsContent={typeFilters}
        layoutId={typeFilterId}
      />
      <FilterTabs
        label="参与职能"
        currentSelect={relationFilter}
        setCurrentSelect={setFilter}
        tabsContent={relationFilters}
        layoutId={relationFilterId}
      />
    </SectionFilters>
  )
  if (subjects === undefined) return <CardGridSkeleton title="参与作品" variant="subject" />
  if (subjects.length === 0) return null
  const openInSidePanel = () =>
    openMonoListPanelTab({
      id: `mono-subjects-${monoType}-${monoId}`,
      type: 'subjects',
      title: '参与作品',
      sourceTitle,
      monoId,
      monoType,
      subjects,
    })

  return (
    <>
      <FoldableSection
        title="参与作品"
        titleAction={<OpenInSidePanelButton onClick={openInSidePanel} />}
        tabs={pageFilters}
        total={filteredSubjects.length}
        onShowMore={openInSidePanel}
        foldedItemMinWidthRem={MONO_SUBJECT_CARD_MIN_WIDTH_REM}
        foldedRowHeightRem={MONO_SUBJECT_CARD_HEIGHT_REM}
        renderContent={(items) => <MonoSubjectGrid>{items}</MonoSubjectGrid>}
      >
        <div>{renderSubjectCards(filteredSubjects)}</div>
      </FoldableSection>
    </>
  )
}

function SectionFilters({ children }: { children: ReactNode }) {
  return <div className="flex flex-col items-start gap-2 sm:items-end">{children}</div>
}

function FilterTabs({
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
    <div className="flex flex-row flex-wrap items-center gap-2">
      <span className="text-muted-foreground text-xs font-medium whitespace-nowrap">{label}</span>
      <Tabs
        currentSelect={currentSelect}
        setCurrentSelect={setCurrentSelect}
        tabsContent={tabsContent}
        layoutId={layoutId}
      />
    </div>
  )
}

function MonoSubjectGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid auto-rows-[var(--mono-section-row-height)] grid-cols-[repeat(auto-fill,minmax(var(--mono-section-card-min-width),1fr))] gap-3">
      {children}
    </div>
  )
}

function renderSubjectCards(subjects: MonoSubjectItem[]) {
  return subjects.map((subject) => (
    <MonoSubjectCard subject={subject} key={`${subject.id}-${subject.relation}`} />
  ))
}

function MonoSubjectCard({ subject }: { subject: MonoSubjectItem }) {
  const { key } = useLocation()
  const navigate = useNavigate()
  const isTransitioning = useViewTransitionState(`/subject/${subject.id}`)
  const viewTransitionName = `cover-image-${key}`
  const relatedItems = subject.relatedItems ?? []

  return (
    <Card
      className="flex h-full cursor-pointer flex-col overflow-hidden p-2 shadow-none transition-shadow hover:shadow-lg"
      role="link"
      tabIndex={0}
      onClick={() =>
        navigate(`/subject/${subject.id}`, {
          state: { viewTransitionName },
          viewTransition: true,
        })
      }
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return
        event.preventDefault()
        navigate(`/subject/${subject.id}`, {
          state: { viewTransitionName },
          viewTransition: true,
        })
      }}
    >
      {subject.image ? (
        <ViewTransitionImage
          active={isTransitioning}
          imageSrc={subject.image}
          className={`${MONO_SUBJECT_IMAGE_FRAME} mx-auto max-w-52 overflow-hidden rounded-md`}
          imageClassName="h-full w-full object-contain"
          loadingClassName={MONO_SUBJECT_IMAGE_FRAME}
          careLoading
          viewTransitionName={viewTransitionName}
        />
      ) : (
        <ViewTransitionElement
          active={isTransitioning}
          className="bg-muted aspect-square rounded-md"
          viewTransitionName={viewTransitionName}
        />
      )}
      <div className="flex flex-1 flex-col gap-1 pt-2">
        <div className="line-clamp-2 text-sm font-medium">{subject.nameCn || subject.name}</div>
        {subject.nameCn && (
          <div className="text-muted-foreground line-clamp-1 text-xs">{subject.name}</div>
        )}
        {relatedItems.length > 0 && <RelatedItemSummary items={relatedItems} />}
        <div className="mt-auto flex min-w-0 flex-row flex-wrap gap-1 pt-2">
          <Badge variant="outline" className="text-xs">
            {SUBJECT_TYPE_MAP[subject.subjectType]}
          </Badge>
          {subject.relation && (
            <Badge
              variant="secondary"
              className="max-w-full min-w-0 text-xs shadow-none"
              title={subject.relation}
            >
              <span className="min-w-0 truncate">{subject.relation}</span>
            </Badge>
          )}
        </div>
      </div>
    </Card>
  )
}

function RelatedItemSummary({ items }: { items: MonoRelatedItem[] }) {
  const displayItems = items.slice(0, 3)

  return (
    <div className="text-muted-foreground flex min-w-0 flex-col items-start gap-0.5 pt-1 text-xs">
      {displayItems.map((item) => (
        <MyLink
          className="text-primary hover:bg-primary/10 focus-visible:ring-ring/50 block w-fit max-w-full truncate rounded-sm px-1 underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:outline-hidden"
          key={`${item.id}-${item.relation ?? item.name}`}
          to={item.link}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          {formatRelatedItemLabel(item)}
        </MyLink>
      ))}
      {items.length > displayItems.length && (
        <div className="text-muted-foreground/80">+{items.length - displayItems.length}</div>
      )}
    </div>
  )
}

function formatRelatedItemLabel(item: MonoRelatedItem) {
  return item.relation ? `${item.name} (${item.relation})` : item.name
}

function MonoRelatedSection({
  monoId,
  monoType,
  sourceTitle,
  title,
  items,
}: {
  monoId: string
  monoType: MonoType
  sourceTitle: string
  title: string
  items?: MonoRelatedItem[]
}) {
  const [filterMap, setFilter] = useAtom(tabFilerAtom)
  const openMonoListPanelTab = useSetAtom(openMonoListPanelTabAtomAction)
  const filterId = `mono-related-${monoType}-${monoId}`
  const filter = filterMap.get(filterId) ?? '全部'
  const filters = useMemo(
    () =>
      new Set([
        '全部',
        ...(items ?? [])
          .map((item) =>
            item.subjectType === undefined ? undefined : SUBJECT_TYPE_MAP[item.subjectType],
          )
          .filter((item): item is string => item !== undefined),
      ]),
    [items],
  )
  const filteredItems = useMemo(
    () =>
      filter === '全部'
        ? (items ?? [])
        : (items ?? []).filter((item) => {
            if (item.subjectType === undefined) return false
            return SUBJECT_TYPE_MAP[item.subjectType] === filter
          }),
    [filter, items],
  )
  const pageFilters =
    filters.size > 1 ? (
      <Tabs
        currentSelect={filter}
        setCurrentSelect={setFilter}
        tabsContent={filters}
        layoutId={filterId}
      />
    ) : undefined
  if (items === undefined) return <CardGridSkeleton title={title} variant="related" />
  if (items.length === 0) return null
  const openInSidePanel = () =>
    openMonoListPanelTab({
      id: `mono-related-${monoType}-${monoId}`,
      type: 'related',
      title,
      sourceTitle,
      monoId,
      monoType,
      relatedItems: items,
    })

  return (
    <>
      <FoldableSection
        title={title}
        titleAction={<OpenInSidePanelButton onClick={openInSidePanel} />}
        tabs={pageFilters}
        total={filteredItems.length}
        onShowMore={openInSidePanel}
        foldedItemMinWidthRem={MONO_RELATED_CARD_MIN_WIDTH_REM}
        foldedRowHeightRem={MONO_RELATED_CARD_HEIGHT_REM}
        renderContent={(items) => <MonoRelatedGrid>{items}</MonoRelatedGrid>}
      >
        <div>{renderRelatedCards(filteredItems)}</div>
      </FoldableSection>
    </>
  )
}

function MonoRelatedGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid auto-rows-[var(--mono-section-row-height)] grid-cols-[repeat(auto-fill,minmax(var(--mono-section-card-min-width),1fr))] gap-3">
      {children}
    </div>
  )
}

function renderRelatedCards(items: MonoRelatedItem[]) {
  return items.map((item) => (
    <MonoRelatedCard
      item={item}
      key={`${item.id}-${item.subjectId ?? item.relation ?? item.name}`}
    />
  ))
}

function MonoRelatedCard({ item }: { item: MonoRelatedItem }) {
  const { key } = useLocation()
  const navigate = useNavigate()
  const isTransitioning = useViewTransitionState(item.link)
  const viewTransitionName = getRelatedItemViewTransitionName(item, key)

  return (
    <Card
      className="flex h-full cursor-pointer flex-row gap-3 overflow-hidden p-2 shadow-none transition-shadow hover:shadow-lg"
      role="link"
      tabIndex={0}
      onClick={() =>
        navigate(item.link, {
          state: { viewTransitionName },
          viewTransition: true,
        })
      }
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return
        event.preventDefault()
        navigate(item.link, {
          state: { viewTransitionName },
          viewTransition: true,
        })
      }}
    >
      <div className="w-24 shrink-0">
        {item.image ? (
          <ViewTransitionImage
            active={isTransitioning}
            imageSrc={item.image}
            className={`${MONO_RELATED_IMAGE_FRAME} overflow-hidden rounded-md`}
            imageClassName="h-full w-full object-contain"
            loadingClassName={MONO_RELATED_IMAGE_FRAME}
            careLoading
            viewTransitionName={viewTransitionName}
          />
        ) : (
          <ViewTransitionElement
            active={isTransitioning}
            className="bg-muted aspect-square rounded-md"
            viewTransitionName={viewTransitionName}
          />
        )}
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-1 overflow-hidden">
        <div className="line-clamp-2 min-w-0 font-medium break-words">{item.name}</div>
        {item.subjectId && (
          <MyLink
            to={`/subject/${item.subjectId}`}
            className="text-primary hover:bg-primary/10 focus-visible:ring-ring/50 line-clamp-1 w-fit max-w-full rounded-sm px-1 text-sm break-words underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:outline-hidden"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            {item.subjectNameCn || item.subjectName}
          </MyLink>
        )}
        <div className="mt-auto flex max-h-6 min-w-0 flex-row flex-nowrap gap-1 overflow-hidden pt-1">
          {item.subjectType && (
            <Badge variant="outline" className="text-xs">
              {SUBJECT_TYPE_MAP[item.subjectType]}
            </Badge>
          )}
          {item.relation && (
            <Badge variant="secondary" className="max-w-full min-w-0 truncate text-xs shadow-none">
              {item.relation}
            </Badge>
          )}
        </div>
      </div>
    </Card>
  )
}

function OpenInSidePanelButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="ghost" size="icon" className="mt-1 size-8" onClick={onClick}>
      <span className="i-mingcute-box-3-line text-lg" />
    </Button>
  )
}

function getRemPx() {
  const fontSize = getComputedStyle(document.documentElement).fontSize
  const remPx = Number.parseFloat(fontSize)
  return Number.isFinite(remPx) ? remPx : 16
}

function getGridColumns(width: number, minWidth: number, gap: number) {
  return Math.max(1, Math.floor((width + gap) / (minWidth + gap)))
}

function FoldableSection({
  title,
  titleAction,
  tabs,
  total,
  renderContent,
  onShowMore,
  foldedItemMinWidthRem,
  foldedRowHeightRem,
  children,
}: {
  title: string
  titleAction?: ReactNode
  tabs?: ReactNode
  total: number
  renderContent?: (children: ReactNode[], state: { folded: boolean; canFold: boolean }) => ReactNode
  onShowMore?: () => void
  foldedItemMinWidthRem?: number
  foldedRowHeightRem?: number
  children: ReactElement<{ children?: ReactNode }>
}) {
  const [folded, setFolded] = useState(true)
  const [foldedItemCount, setFoldedItemCount] = useState(DEFAULT_FOLDED_ITEM_COUNT)
  const [contentHovering, setContentHovering] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const childrenArray = Children.toArray(children.props.children)
  const cardMinWidthRem = foldedItemMinWidthRem ?? MONO_SUBJECT_CARD_MIN_WIDTH_REM
  const rowHeightRem = foldedRowHeightRem ?? MONO_SUBJECT_CARD_HEIGHT_REM
  const foldedMaxHeightRem = rowHeightRem * FOLDED_ROWS + GRID_GAP_REM * (FOLDED_ROWS - 1)
  const updateFoldedItemCount = useCallback(
    (width: number) => {
      const remPx = getRemPx()
      const cardMinWidth = cardMinWidthRem * remPx
      const gap = GRID_GAP_REM * remPx
      const nextCount = getGridColumns(width, cardMinWidth, gap) * FOLDED_ROWS

      setFoldedItemCount((prev) => (prev === nextCount ? prev : nextCount))
    },
    [cardMinWidthRem],
  )
  const handleResize = useCallback(
    (entry: ResizeObserverEntry) => {
      updateFoldedItemCount(entry.contentRect.width)
    },
    [updateFoldedItemCount],
  )
  const canFold = childrenArray.length > foldedItemCount
  const displayChildren =
    folded && canFold ? childrenArray.slice(0, foldedItemCount) : childrenArray
  const content = renderContent
    ? renderContent(displayChildren, { folded, canFold })
    : cloneElement(children, children.props, displayChildren)
  const clipStyle =
    folded && canFold
      ? ({
          maxHeight: `${foldedMaxHeightRem}rem`,
          overflow: contentHovering ? 'visible' : 'hidden',
        } as CSSProperties)
      : undefined
  const sectionStyle = {
    '--mono-section-card-min-width': `${cardMinWidthRem}rem`,
    '--mono-section-row-height': `${rowHeightRem}rem`,
  } as CSSProperties

  useResizeObserver({
    ref: contentRef,
    callback: handleResize,
    deps: [handleResize],
  })

  return (
    <section className="flex flex-col gap-5" style={sectionStyle}>
      <div className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div className="flex flex-row items-center gap-2">
          <h2 className="shrink-0 text-2xl font-medium">
            {title}
            <span className="text-muted-foreground ml-2 text-sm font-normal">{total}</span>
          </h2>
          {titleAction}
        </div>
        {tabs}
      </div>
      <div
        ref={contentRef}
        style={clipStyle}
        onPointerEnter={() => setContentHovering(true)}
        onPointerLeave={() => setContentHovering(false)}
      >
        {children.props.children ? content : null}
      </div>
      {canFold && (
        <Button
          variant="outline"
          className="self-center"
          onClick={() => {
            if (onShowMore) {
              onShowMore()
              return
            }
            setFolded((value) => !value)
          }}
        >
          {onShowMore
            ? `查看更多 ${childrenArray.length}`
            : folded
              ? `展开全部 ${childrenArray.length}`
              : '收起'}
        </Button>
      )}
    </section>
  )
}

function getRelatedItemViewTransitionName(item: MonoRelatedItem, locationKey: string) {
  return `mono-related-image-${item.id}-${item.subjectId ?? 'none'}-${locationKey}`
}

function CardGridSkeleton({ title, variant }: { title: string; variant: 'subject' | 'related' }) {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div className="flex flex-row items-center gap-2">
          <h2 className="text-2xl font-medium">{title}</h2>
          <Skeleton className="mt-1 size-8 rounded-md" />
        </div>
        <Skeleton className="h-9 w-40" />
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] gap-3">
        {Array(6)
          .fill(0)
          .map((_, index) => (
            <Fragment key={index}>
              {variant === 'subject' ? <MonoSubjectCardSkeleton /> : <MonoRelatedCardSkeleton />}
            </Fragment>
          ))}
      </div>
    </section>
  )
}

function MonoSubjectCardSkeleton() {
  return (
    <Card className="flex h-72 flex-col overflow-hidden p-2 shadow-none">
      <Skeleton className="h-52 w-full rounded-md" />
      <div className="flex flex-1 flex-col gap-2 pt-2">
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-3 w-2/3" />
        <div className="mt-auto flex flex-row flex-wrap gap-1 pt-2">
          <Skeleton className="h-5 w-12 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>
    </Card>
  )
}

function MonoRelatedCardSkeleton() {
  return (
    <Card className="flex h-28 flex-row gap-3 overflow-hidden p-2 shadow-none">
      <Skeleton className="size-24 shrink-0 rounded-md" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-4 w-2/3" />
        <div className="mt-auto flex flex-row gap-1 pt-1">
          <Skeleton className="h-5 w-12 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>
    </Card>
  )
}

function getDisplayInfobox(infobox: MonoInfoBox[]) {
  return infobox
    .map((item) => {
      const plainValue = Array.isArray(item.value)
        ? item.value.map((value) => [value.k, value.v].filter(Boolean).join(': ')).join(' / ')
        : item.value

      return {
        key: String(item.key),
        plainValue,
        value: Array.isArray(item.value)
          ? renderInfoBoxValueList(item.value)
          : renderTextWithExternalLinks(item.value),
      }
    })
    .filter((item) => item.plainValue.length > 0)
}

function renderInfoBoxValueList(values: MonoInfoBox['value'] & Array<{ k?: string; v: string }>) {
  return values.map((value, index) => (
    <Fragment key={`${value.k ?? ''}-${value.v}-${index}`}>
      {index > 0 && ' / '}
      {value.k ? `${value.k}: ` : null}
      {renderTextWithExternalLinks(value.v)}
    </Fragment>
  ))
}

function renderTextWithExternalLinks(text: string) {
  const parts: ReactNode[] = []
  let lastIndex = 0

  for (const match of text.matchAll(EXTERNAL_URL_PATTERN)) {
    const url = match[0]
    const index = match.index ?? 0
    if (index > lastIndex) parts.push(text.slice(lastIndex, index))
    parts.push(
      <ExternalLink href={url} key={`${url}-${index}`}>
        {url}
      </ExternalLink>,
    )
    lastIndex = index + url.length
  }

  if (lastIndex < text.length) parts.push(text.slice(lastIndex))
  return parts.length > 0 ? parts : text
}

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-primary underline-offset-4 hover:underline"
      onClick={(event) => {
        event.preventDefault()
        window.open(href, '_blank', 'noopener,noreferrer')
      }}
    >
      {children}
    </a>
  )
}
