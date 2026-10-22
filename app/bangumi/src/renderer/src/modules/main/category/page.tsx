import { copyText } from '@renderer/components/context-menu/link-entries'
import {
  CONTEXT_MENU_SEPARATOR,
  useContextMenu,
} from '@renderer/components/context-menu/use-context-menu'
import { Button } from '@renderer/components/ui/button'
import { useQuerySearch } from '@renderer/data/hooks/api/search'
import type { SearchParam } from '@renderer/data/types/search'
import type { SectionPath } from '@renderer/data/types/web'
import { useOnline } from '@renderer/hooks/use-online'
import { useOpenMonoListPanel } from '@renderer/modules/panel/left-panel/open-mono-list-panel'
import { appConfigAtom } from '@renderer/state/app-config'
import type { MonoListPanelTab } from '@renderer/state/panel'
import { useAtomValue } from 'jotai'
import { useMemo } from 'react'
import {
  CATEGORY_CONFIG,
  recentAirDateFilter,
  searchPageHref,
  subjectTypeFilter,
  yearAirDateFilter,
  type CategoryConfig,
} from './config'
import { CategoryHero } from './hero'
import { SubjectRow } from './subject-row'
import { useTrendingSubjects, useVisibleSubjects } from './use-trending-subjects'

const HERO_COUNT = 8
const ROW_LIMIT = 20

export function CategoryPage({ sectionPath }: { sectionPath: SectionPath }) {
  const config: CategoryConfig = CATEGORY_CONFIG[sectionPath]
  const { name } = config
  const sourceTo = `/${sectionPath}`

  const trending = useTrendingSubjects(sectionPath, HERO_COUNT)
  const { heroSubjects } = trending
  const hotSubjects = trending.subjects?.slice(HERO_COUNT)

  const typeFilter = subjectTypeFilter(sectionPath)
  const year = new Date().getFullYear()
  const recentParam = {
    sort: 'heat',
    filter: { type: typeFilter, airDate: recentAirDateFilter(config.recentMonths) },
  } satisfies SearchParam
  const rankParam = {
    sort: 'rank',
    filter: { type: typeFilter, rank: ['>0'] },
  } satisfies SearchParam
  const yearParam = {
    sort: 'rank',
    filter: { type: typeFilter, airDate: yearAirDateFilter(year), rank: ['>0'] },
  } satisfies SearchParam

  const searchPanelTab = (id: string, title: string, searchParam: SearchParam) =>
    ({
      id: `category-${sectionPath}-${id}`,
      type: 'searchSubjects',
      title,
      sourceTitle: name,
      sourceTo: searchPageHref(searchParam),
      searchParam,
    }) satisfies MonoListPanelTab

  return (
    <div className="@container/category w-full min-w-0">
      <div className="flex flex-col gap-8 px-(--category-gutter) pt-4 pb-16 [--category-gutter:clamp(1rem,2.5cqi,3rem)] @min-[960px]/category:gap-10 @min-[960px]/category:pt-6">
        <header className="flex items-baseline gap-3">
          <h1 className="text-2xl font-bold">{name}</h1>
          <span className="text-muted-foreground text-sm">热门、新作与高分{name}</span>
        </header>

        <CategoryHero
          name={name}
          sectionPath={sectionPath}
          subjects={heroSubjects}
          failed={trending.failed}
          error={trending.error}
          onRetry={trending.refetch}
        />

        <SubjectRow
          id={`${sectionPath}-hot`}
          title={`热门${name}`}
          description="最近关注度最高"
          sectionPath={sectionPath}
          subjects={hotSubjects}
          failed={trending.failed}
          error={trending.error}
          refreshing={trending.refreshing}
          onRefresh={trending.refetch}
          panelTab={{
            id: `trending-subjects-${sectionPath}`,
            panelTitle: `热门${name}`,
            sectionPath,
            sourceTitle: name,
            sourceTo,
            title: `热门${name}`,
            type: 'trendingSubjects',
          }}
        />

        <SearchSubjectRow
          id={`${sectionPath}-recent`}
          title={config.recentTitle}
          description={`近 ${config.recentMonths} 个月 · 按热度`}
          sectionPath={sectionPath}
          searchParam={recentParam}
          panelTab={searchPanelTab('recent', config.recentTitle, recentParam)}
        />

        <SearchSubjectRow
          id={`${sectionPath}-year`}
          title={`${year} 年高分`}
          description="今年上线 · 按排名"
          sectionPath={sectionPath}
          searchParam={yearParam}
          panelTab={searchPanelTab('year', `${year} 年高分${name}`, yearParam)}
        />

        <SearchSubjectRow
          id={`${sectionPath}-rank`}
          title={`${name}排行`}
          description="Bangumi 综合排名"
          sectionPath={sectionPath}
          searchParam={rankParam}
          panelTab={searchPanelTab('rank', `${name}排行`, rankParam)}
        />

        <TagBrowser config={config} />
      </div>
    </div>
  )
}

function SearchSubjectRow({
  searchParam,
  ...props
}: {
  id: string
  title: string
  description: string
  sectionPath: SectionPath
  searchParam: SearchParam
  panelTab: MonoListPanelTab
}) {
  const online = useOnline()
  const enableNsfw = useAtomValue(appConfigAtom).general.enableNsfw
  const search = useQuerySearch({
    searchParam: { ...searchParam, filter: { ...searchParam.filter, nsfw: enableNsfw } },
    limit: ROW_LIMIT,
  })
  const ids = useMemo(() => search.data?.data.map((item) => String(item.id)), [search.data])
  const { query, subjects } = useVisibleSubjects(ids)

  return (
    <SubjectRow
      {...props}
      href={searchPageHref(searchParam)}
      subjects={subjects}
      failed={(search.data === undefined && (search.isError || !online)) || query.isError}
      error={search.error ?? query.error}
      refreshing={search.isFetching}
      onRefresh={() => {
        void query.refetch()
        return search.refetch()
      }}
    />
  )
}

function TagBrowser({ config }: { config: CategoryConfig }) {
  const openMonoListPanel = useOpenMonoListPanel()
  const openContextMenu = useContextMenu()
  const typeFilter = subjectTypeFilter(config.sectionPath)

  return (
    <section aria-labelledby={`${config.sectionPath}-tags-title`} className="flex flex-col gap-3">
      <div className="flex items-baseline gap-2">
        <h2 id={`${config.sectionPath}-tags-title`} className="text-base font-semibold">
          按标签浏览
        </h2>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))] gap-2">
        {config.tags.map((tag) => {
          const searchParam = {
            sort: 'heat',
            filter: { type: typeFilter, tag: [tag] },
          } satisfies SearchParam
          const openInPanel = () =>
            openMonoListPanel({
              id: `category-${config.sectionPath}-tag-${tag}`,
              type: 'searchSubjects',
              title: `${config.name} · ${tag}`,
              sourceTitle: config.name,
              sourceTo: searchPageHref(searchParam),
              searchParam,
            })
          return (
            <Button
              key={tag}
              variant="outline"
              className="h-10 justify-start truncate text-sm font-medium"
              onClick={openInPanel}
              onContextMenu={(event) =>
                openContextMenu(event, [
                  {
                    label: '在侧栏打开',
                    icon: 'i-mingcute-layout-left-line',
                    shortcut: 'o',
                    onSelect: openInPanel,
                  },
                  {
                    label: '在搜索页打开',
                    icon: 'i-mingcute-search-line',
                    shortcut: 's',
                    onSelect: ({ navigate }) => navigate(searchPageHref(searchParam)),
                  },
                  CONTEXT_MENU_SEPARATOR,
                  {
                    label: '复制标签',
                    icon: 'i-mingcute-copy-2-line',
                    shortcut: 'c',
                    onSelect: () => copyText(tag, '已复制标签'),
                  },
                ])
              }
            >
              <span className="text-muted-foreground">#</span>
              {tag}
            </Button>
          )
        })}
      </div>
    </section>
  )
}
