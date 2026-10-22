import { BigCarousel } from '@renderer/components/carousel/big-carousel'
import { ViewTransitionElement } from '@renderer/components/image/view-transition-image'
import { MyLink } from '@renderer/components/my-link'
import { QueryFallback } from '@renderer/components/query-fallback'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { SubjectType, type Subject } from '@renderer/data/types/subject'
import type { SectionPath } from '@renderer/data/types/web'
import { cn } from '@renderer/lib/utils'
import dayjs from 'dayjs'
import { memo, useEffect, useState } from 'react'
import { useLocation, useViewTransitionState } from 'react-router-dom'

/** Matches BigCarousel's height clamp so the skeleton does not jump. */
const heroHeight = 'h-[clamp(260px,28cqi,440px)]'
/** Show the carousel anyway if some images are still decoding by then. */
const PRELOAD_TIMEOUT = 1500

/** JS twin of the page's `--category-gutter: clamp(1rem, 2.5cqi, 3rem)`. */
const categoryGutter = (width: number) => Math.min(48, Math.max(16, width * 0.025))

const coverSource = (subject: Subject) => subject.images.common
// The backdrop is blurred heavily, so a small source looks the same and decodes far faster.
const backdropSource = (subject: Subject) => subject.images.small || subject.images.common

const defaultBadge = (_subject: Subject, index: number) => `热门 #${index + 1}`

export function CategoryHero({
  name,
  sectionPath,
  subjects,
  failed,
  error,
  onRetry,
  getBadge = defaultBadge,
}: {
  name: string
  /** Omit for a mix of categories; covers then use the portrait ratio. */
  sectionPath?: SectionPath
  /** Pass `undefined` until the list is settled, so the carousel lays out once. */
  subjects: Subject[] | undefined
  failed: boolean
  error?: unknown
  onRetry: () => unknown
  getBadge?: (subject: Subject, index: number) => string
}) {
  const coverRatio = sectionPath === 'music' ? 1 : 2 / 3
  const imagesReady = usePreloadedImages(
    subjects?.flatMap((subject) => [coverSource(subject), backdropSource(subject)]),
  )

  if (!subjects?.length || !imagesReady) {
    if (failed && !subjects?.length) {
      return (
        <div className={cn('@container flex items-center', heroHeight)}>
          <QueryFallback label={`热门${name}`} error={error} onRetry={onRetry} />
        </div>
      )
    }
    if (subjects?.length === 0) return null
    return (
      <div className="@container -mx-(--category-gutter)">
        <div className={cn('flex gap-3 overflow-hidden', heroHeight)}>
          <div className="relative h-full w-[calc(var(--category-gutter)-12px)] shrink-0 overflow-hidden">
            {/* Crop a full card so the peek keeps the same corner curve as a loaded slide. */}
            <Skeleton
              className="absolute inset-y-0 right-0 h-full rounded-[32px]"
              style={{ aspectRatio: coverRatio }}
            />
          </div>
          <Skeleton className="h-full w-[min(100%,calc(clamp(260px,28cqi,440px)*0.67+clamp(280px,38cqi,760px)))] shrink-0 rounded-[32px]" />
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="aspect-2/3 h-full shrink-0 rounded-[32px]" />
          ))}
        </div>
        <div className="mt-3 h-1.5" />
      </div>
    )
  }

  return (
    // Bleed into the page padding so the previous card peeks from the very edge.
    <div className="@container -mx-(--category-gutter)">
      <BigCarousel
        leading={categoryGutter}
        label={`热门${name}`}
        items={subjects}
        coverRatio={coverRatio}
        getKey={(subject) => subject.id}
        renderSlide={(subject, { selected }) => (
          <HeroSlide
            subject={subject}
            badge={getBadge(subject, subjects.indexOf(subject))}
            // Square album art in a portrait slot is letterboxed over its blurred backdrop.
            containCover={coverRatio !== 1 && subject.type === SubjectType.music}
            selected={selected}
          />
        )}
      />
    </div>
  )
}

/** Image lists already decoded, so returning to a page renders the carousel in its first frame. */
const preloadedKeys = new Set<string>()

/** Decodes every image up front so the first frame of the carousel is complete. */
function usePreloadedImages(sources: string[] | undefined) {
  const key = sources?.join('\n')
  const [readyKey, setReadyKey] = useState<string>()
  // A skeleton on the way back would leave the cover's view transition nothing to land on.
  const cached = key !== undefined && preloadedKeys.has(key)
  useEffect(() => {
    if (key === undefined || preloadedKeys.has(key)) return
    let cancelled = false
    const decode = (src: string) => {
      const image = new Image()
      image.src = src
      return image.decode().catch(() => undefined)
    }
    const timeout = new Promise((resolve) => setTimeout(resolve, PRELOAD_TIMEOUT))
    void Promise.race([Promise.all(key.split('\n').filter(Boolean).map(decode)), timeout]).then(
      () => {
        preloadedKeys.add(key)
        if (!cancelled) setReadyKey(key)
      },
    )
    return () => {
      cancelled = true
    }
  }, [key])
  return cached || (key !== undefined && readyKey === key)
}

const HeroSlide = memo(function HeroSlide({
  subject,
  badge,
  containCover,
  selected,
}: {
  subject: Subject
  badge: string
  containCover: boolean
  selected: boolean
}) {
  const title = subject.name_cn || subject.name
  const backdrop = backdropSource(subject)
  const date = subject.date ? dayjs(subject.date) : null
  const episodeCount = subject.total_episodes || subject.eps
  const meta = [
    date?.isValid() ? date.format('YYYY 年 M 月') : null,
    subject.platform || null,
    subject.type === SubjectType.anime && episodeCount ? `${episodeCount} 话` : null,
    subject.type === SubjectType.book && subject.volumes ? `${subject.volumes} 卷` : null,
  ].filter(Boolean)
  const to = `/subject/${subject.id}`
  const isTransitioning = useViewTransitionState(to)
  const { key } = useLocation()
  const viewTransitionName = `cover-image-${key}`

  return (
    // The card keeps its expanded size and the slide only clips it, so resizing never relays out
    // or re-rasterizes the content and the blurred backdrop.
    <MyLink
      to={to}
      contextMenuTitle={title}
      viewTransition
      state={{ viewTransitionName }}
      tabIndex={selected ? 0 : -1}
      className={cn(
        // Only the slide clips: a second rounded clip here would anti-alias the corners twice.
        'relative isolate flex h-full w-[calc(var(--big-carousel-cover)+var(--big-carousel-info))] shrink-0 cursor-default rounded-[inherit]',
        'focus-visible:ring-ring outline-none focus-visible:ring-2 focus-visible:ring-inset',
      )}
    >
      {/* The dark backdrop stays out from under an opaque cover: under the slide's anti-aliased
          corners each layer is blended separately, so anything dark beneath bleeds out as a rim. */}
      <div
        className={cn(
          'absolute inset-y-0 right-0 -z-10 overflow-hidden bg-neutral-900',
          containCover ? 'left-0' : 'left-(--big-carousel-cover)',
        )}
      >
        {/* Paint the tint and image together: separately clipped translucent layers leave a
            bright hairline at the card's fractional right edge in Chromium. */}
        <div
          className="absolute inset-0 scale-125 transform-gpu bg-cover bg-center blur-2xl"
          style={{
            backgroundImage: [
              // Combines the original 40% neutral tint with the 40–75% black gradient.
              'linear-gradient(to right, rgb(8.625 8.625 8.625 / 64%) 10%, rgb(4.842 4.842 4.842 / 76%) 50%, rgb(2.706 2.706 2.706 / 85%) 90%)',
              ...(backdrop ? [`url(${JSON.stringify(backdrop)})`] : []),
            ].join(', '),
          }}
        />
      </div>

      {/* Collapsed and expanded cards share the cover; expanding only reveals the info panel. */}
      <div
        className={cn(
          // Composite the cover and fading caption before the slide's rounded clip.
          'relative h-full w-(--big-carousel-cover) shrink-0 transform-gpu',
          // A square cover in a portrait slot sits as an album on the blurred backdrop.
          containCover && 'flex items-center justify-center px-[clamp(0.75rem,1.5cqi,1.25rem)]',
        )}
      >
        <ViewTransitionElement
          active={selected && isTransitioning}
          className={containCover ? 'aspect-square w-full' : 'size-full'}
          viewTransitionName={viewTransitionName}
        >
          <HeroImage
            src={coverSource(subject)}
            className={cn(
              'size-full object-cover',
              containCover && 'rounded-2xl shadow-2xl shadow-black/50',
            )}
          />
        </ViewTransitionElement>
        <div
          className="absolute inset-x-0 bottom-0 flex flex-col gap-0.5 bg-linear-to-t from-black/80 via-black/40 to-transparent px-3 pt-10 pb-3 text-white"
          // Follows the carousel's per-frame expansion, gone by half-way, instead of fading on
          // selection: fast switching flips selection every few frames and made the titles flicker.
          style={{ opacity: 'max(0, 1 - var(--big-carousel-expansion, 0) * 2)' }}
        >
          <span className="line-clamp-2 text-sm leading-snug font-semibold">{title}</span>
          {subject.rating.score > 0 && (
            <span className="flex items-center gap-1 text-xs font-semibold text-amber-300">
              {subject.rating.score.toFixed(1)}
              <span className="i-mingcute-star-fill text-[0.65rem]" />
            </span>
          )}
        </div>
      </div>

      <div
        className={cn(
          'flex h-full w-(--big-carousel-info) shrink-0 flex-col justify-end gap-2 p-[clamp(1rem,2.5cqi,1.75rem)] text-white transition-opacity duration-300',
          selected ? 'opacity-100 delay-150' : 'opacity-0',
        )}
      >
        <div className="flex items-center gap-2 text-xs font-medium">
          <span className="rounded-md bg-rose-500/90 px-1.5 py-0.5">{badge}</span>
          {subject.rating.rank > 0 && (
            <span className="rounded-md bg-white/15 px-1.5 py-0.5">排名 {subject.rating.rank}</span>
          )}
        </div>
        <h3 className="line-clamp-2 text-[clamp(1.25rem,2.2cqi,1.875rem)] leading-tight font-bold">
          {title}
        </h3>
        {subject.name_cn && subject.name_cn !== subject.name && (
          <p className="font-jp truncate text-sm text-white/70">{subject.name}</p>
        )}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/80">
          {subject.rating.score > 0 && (
            <span className="flex items-center gap-1 font-semibold text-amber-300">
              {subject.rating.score.toFixed(1)}
              <span className="i-mingcute-star-fill text-xs" />
              <span className="font-normal text-white/60">({subject.rating.total})</span>
            </span>
          )}
          {meta.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
        {subject.summary && (
          <p className="line-clamp-3 text-sm leading-relaxed text-white/75">{subject.summary}</p>
        )}
        <div className="flex max-h-6 flex-wrap gap-1.5 overflow-hidden">
          {subject.tags.slice(0, 6).map((tag) => (
            <span
              key={tag.name}
              className="rounded-full bg-white/12 px-2 py-0.5 text-xs text-white/85"
            >
              {tag.name}
            </span>
          ))}
        </div>
      </div>
    </MyLink>
  )
})

function HeroImage({ src, className }: { src?: string; className?: string }) {
  if (!src) return <div className={cn('bg-white/10', className)} />
  return <img src={src} alt="" draggable={false} className={className} />
}
