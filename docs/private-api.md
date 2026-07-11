# Private API 接入记录

本文档记录已接入的 `next.bgm.tv/p1` 接口、调用位置和展示位。没有明确展示位的接口不落 UI。

## 已接入并展示

### 收藏侧边栏

展示位：左侧侧边栏收藏入口列表里的三点菜单，切换到角色收藏、人物收藏、目录收藏后继续在左侧收藏面板列表展示。
非条目收藏面板标题栏提供关闭按钮，避免必须回到三点菜单再次切换。

调用位置：

- `src/renderer/src/data/fetch/api/collection.ts`
- `src/renderer/src/data/hooks/api/collection.ts`
- `src/renderer/src/modules/nav/panel/button.tsx`
- `src/renderer/src/modules/panel/left-panel/panels/collection-panel/*`

接口：

- `GET /p1/collections/characters`
- `GET /p1/collections/persons`
- `GET /p1/collections/indexes`
- `GET /p1/users/{username}/collections/characters`
- `GET /p1/users/{username}/collections/persons`
- `GET /p1/users/{username}/collections/indexes`
- `GET /v0/users/{username}/collections/-/characters/{character_id}`
- `GET /v0/users/{username}/collections/-/persons/{person_id}`
- `POST /v0/characters/{character_id}/collect`
- `DELETE /v0/characters/{character_id}/collect`
- `POST /v0/persons/{person_id}/collect`
- `DELETE /v0/persons/{person_id}/collect`
- `GET /index/{indexID}`
- `GET /index/{indexID}/collect?gh={hash}`
- `GET /index/{indexID}/erase_collect?gh={hash}`

边界：条目收藏面板仍保留现有 v0 收藏流程，因为它已经提供收藏状态、评分、章节列表等交互数据。

补充：角色、人物、目录详情页提供 `收藏/取消收藏` toggle。角色/人物的“是否已收藏”用 v0 单个收藏查询确认，不拉收藏列表匹配，写入走 v0 collect/uncollect。目录详情使用 p1 `GET /p1/indexes/{indexID}` 返回的 `collectedAt` 判断当前用户是否已收藏；目录写入实测 p1 `DELETE /p1/collections/indexes/{indexID}` 和 v0 `DELETE /v0/indices/{indexID}/collect` 都会返回 500，因此对齐 Bangumi Web，先读取 `/index/{indexID}` 里的 `gh` 动作链接，再请求 `/index/{indexID}/collect|erase_collect?gh={hash}`。

### 条目推荐

展示位：

- 条目页 `关联条目` 后方的 `推荐条目` 区块。
- 条目页 `推荐条目` 标题旁的盒子按钮、区块底部的 `在侧栏查看更多` 按钮打开 mono-list，分页展示完整推荐条目。

调用位置：

- `src/renderer/src/data/fetch/api/subject.ts`
- `src/renderer/src/data/hooks/api/subject.ts`
- `src/renderer/src/modules/main/subject/recommendations.tsx`

接口：

- `GET /p1/subjects/{subjectID}/recs`

数据含义：返回 `subject + sim + count`，用于展示相似/推荐条目，不替代 v0 关联条目。当前 UI 展示推荐条目的评分、评分人数和 `sim`；`count` 只有大于 0 时作为共现数展示，避免把 p1 常见的 `count=0` 误读成 `0 人`。

### Mono-list 打开链路

展示位：所有打开左侧 mono-list 的入口统一走 `OpenMonoListPanelButton`、`useMonoListPanelOpenHandler` 或 `useOpenMonoListPanel`。

调用位置：

- `src/renderer/src/modules/panel/left-panel/open-mono-list-panel.tsx`
- `src/renderer/src/state/panel.ts`

覆盖入口：条目页章节、角色、关联条目、单行本、讨论、推荐条目、关联目录；目录详情关联内容；角色/人物详情的参与作品、关联内容和关联目录；首页热门条目、时间线、小组/讨论预览；社区小组/讨论预览；搜索结果固定；用户收藏预览；章节详情/标题栏章节列表。

边界：atom action `openMonoListPanelTabAtomAction` 仍是唯一状态写入点；页面组件只构造它已经能感知的 `MonoListPanelTab`，需要阻止父级导航的入口通过公共选项声明 `preventDefault/stopPropagation`，不在调用点写独立事件补丁。

### 条目/角色/人物关联目录与目录详情

展示位：

- 条目页 `推荐条目` 后方的 `关联目录` 区块，仅展示前 4 个。
- 角色/人物详情页 `关联人物` 或 `出场角色` 后方的 `关联目录` 区块，仅展示前 4 个。
- 条目/角色/人物详情页 `关联目录` 标题旁的盒子按钮、区块底部的 `在侧栏查看更多` 按钮打开 mono-list，分页展示完整关联目录。
- 新路由 `/index/{indexId}` 展示目录详情和关联内容列表，并在 `关联内容` 标题旁提供盒子按钮打开 mono-list。
- 侧边栏目录收藏点击后进入 `/index/{indexId}`。
- 目录详情和侧边栏目录内容共用过滤逻辑：当目录实际混合多个内容项类型时展示 `内容类型`；当条目内容实际混合多个条目类型时展示 `条目类型`。只有一个实际可选类型时不展示对应 tab。

边界：`/p1/subjects/{subjectID}/indexes` 当前可能出现 `limit=4` 但第一页不足 4 条、同时 `total` 很大的情况；条目页预览会多取一页窗口后截取 4 条，mono-list 仍按接口分页展示完整列表。部分角色目录接口可能返回 `data=[]` 但 `total>0`，分页在空页停止以避免重复请求同一 offset。

调用位置：

- `src/renderer/src/data/fetch/api/subject.ts`
- `src/renderer/src/data/fetch/api/character.ts`
- `src/renderer/src/data/fetch/api/person.ts`
- `src/renderer/src/data/fetch/api/index.ts`
- `src/renderer/src/data/hooks/api/subject.ts`
- `src/renderer/src/data/hooks/api/character.ts`
- `src/renderer/src/data/hooks/api/person.ts`
- `src/renderer/src/data/hooks/api/index.ts`
- `src/renderer/src/modules/common/mono-indexes.tsx`
- `src/renderer/src/modules/main/subject/indexes.tsx`
- `src/renderer/src/components/mono/mono-detail-view.tsx`
- `src/renderer/src/modules/main/catalog/index.tsx`
- `src/renderer/src/modules/panel/left-panel/panels/mono-list-panel/index-content.tsx`

接口：

- `GET /p1/subjects/{subjectID}/indexes`
- `GET /p1/characters/{characterID}/indexes`
- `GET /p1/persons/{personID}/indexes`
- `GET /p1/indexes/{indexID}`
- `GET /p1/indexes/{indexID}/related`

过滤语义：`/p1/indexes/{indexID}/related` 的 `cat` 是目录关联内容项类型，不是目录自身类型；当前映射为 `条目/角色/人物/章节/日志/小组话题/条目讨论`。当 `cat=0` 为条目内容时，`type` 才是条目分类，对应 `动画/书籍/游戏/音乐/三次元`。Bangumi Web 目录页上的 `全部/动画/...` 过滤对齐的是这里的条目分类；p1 查询需要组合为 `cat=0&type={subjectType}`。

补充：目录现已接入创建、编辑、删除，以及关联内容的添加、顺序/备注调整和删除；目录标题为空时 UI 会显示 `未命名目录 #id` 兜底。

### 用户 Hover 卡与关系动作

展示位：评论、时间线、小组成员预览、话题详情作者、目录作者等用户头像/用户名 hover 卡。卡片展示用户头像、昵称、用户名、签名、简介、条目/好友/目录统计和加入时间；顶部提供 `加好友/取消好友`、`拉黑/取消拉黑` 动作。签名和简介走统一 BBCode 渲染。

调用位置：

- `src/renderer/src/components/user-hover-card.tsx`
- `src/renderer/src/data/fetch/api/relationship.ts`
- `src/renderer/src/data/hooks/api/relationship.ts`

接口：

- `GET /p1/users/{username}`
- `GET /p1/friendlist`
- `PUT /p1/friends/{username}`
- `DELETE /p1/friends/{username}`
- `GET /p1/blocklist`
- `PUT /p1/blocklist/{username}`
- `DELETE /p1/blocklist/{username}`

边界：当前关系动作只在已登录且 hover 对象不是当前登录用户时展示；没有发现可用的 p1 私信/留言动作接口，因此暂不在 hover 卡新增消息入口。

补充：用户页点击好友统计后直接在左侧 mono-list 分页展示好友，不再进入独立好友页面；粉丝仍保留独立列表页。

### 小组发帖

展示位：小组详情页小组话题标题行的 `发帖` 按钮，进入 `/group/{groupName}/topic/new`。

调用位置：

- `src/renderer/src/data/fetch/api/community.ts`
- `src/renderer/src/data/hooks/api/community.ts`
- `src/renderer/src/modules/main/group/create-topic.tsx`
- `src/renderer/src/modules/main/group/index.tsx`

接口：

- `POST /p1/groups/{groupName}/topics`
- `GET /p1/turnstile`

边界：发帖需要 Turnstile 令牌；提交成功后跳转到新话题详情，并刷新小组话题列表。

### 通知中心

展示位：已登录时在应用 Header 展示通知铃铛和未读数量；弹层展示最近 20 条通知，支持逐条标记已读和全部标记已读。应用内已有详情页的通知会直接跳转到对应话题、章节、角色、人物、目录或用户页；日志和时间线通知暂时打开 Bangumi Web。

调用位置：

- `src/renderer/src/data/fetch/api/notification.ts`
- `src/renderer/src/data/hooks/api/notification.ts`
- `src/renderer/src/modules/header/notification-button.tsx`
- `src/renderer/src/modules/header/notification-item.tsx`

接口：

- `GET /p1/notify`
- `POST /p1/clear-notify`

边界：当前每 60 秒轮询一次未读数，打开通知弹层时若缓存已过期会立即刷新；暂未接入 p1 Socket.IO 通知推送。服务端状态保存在 TanStack Query，弹层本身不提升到全局状态。

## 新增内容能力

### 日志与条目 Reviews

相关接口：

- `GET /p1/users/{username}/blogs`
- `GET /p1/blogs/{entryID}`
- `GET /p1/blogs/{entryID}/photos`
- `GET /p1/blogs/{entryID}/subjects`
- `GET /p1/blogs/{entryID}/comments`

展示位：用户页日志统计进入独立日志列表；日志详情展示正文、图片、关联条目和评论，正文与附件图片复用讨论区 BBCode 图片加载、重试和预览组件，评论入口固定在页面左下角。条目页预览 4 篇 `reviews` 评论文章，列表末尾按钮打开 mono-list 分页展示完整评论文章；侧栏来源显示真实条目名。点击文章进入应用内日志详情。

评论发表、编辑和删除继续复用通用 reply 链路。

### 时间线写入与回复详情

- `POST /p1/timeline`
- `DELETE /p1/timeline/{timelineID}`
- `GET /p1/timeline/{timelineID}/replies`
- `POST /p1/timeline/{timelineID}/replies`

首页时间线以 `+` 作为收起态入口，编辑区按需展开并在收起时保留草稿；本人状态提供删除动作。回复列表仅在展开时请求，回复输入与发送直接内联在动态卡片内，不打开右侧全局回复面板。

### 目录编辑与评论

目录支持创建、编辑、删除，关联内容支持添加、调整顺序/备注和删除。目录详情展示评论，并复用通用评论写入、编辑和删除能力。

### 人物/角色照片

Mono 详情页展示照片预览，并提供相册列表、单图详情和照片评论。上游只提供照片评论读取与创建，没有编辑/删除接口，因此客户端不展示对应动作。

### 热门条目

相关接口：

- `GET /p1/trending/subjects`

数据含义：按 `type` 返回热门条目列表，结构为 `subject + count`。现有首页/侧边栏已有 web trending 浏览器逻辑；是否替换或新增展示位待确认。

补充：`type` 必传，取值是 `SubjectType` 整数枚举：`1=book`、`2=anime`、`3=music`、`4=game`、`6=real`。和现有 web 抓取的 `/{section}/browser/?sort=trends` 非完全等价，本次未登录 live 对比结论如下：

- `book`、`anime`：p1 返回前 20 条；和 web 前 20 条内容完全重合，前 18 条顺序一致，尾部有换序。
- `music`：p1 返回前 20 条；和 web 前 20 条大体重合，但从第 3 条开始有换序，前 20 里有 1 条差异。
- `real`：p1 返回 19 条；和 web 前 19 条大体重合，但从第 6 条开始有换序，前 19 里有 1 条差异。
- `game`：p1 只返回 10 条；和 web 前 10 条不一致，前 10 仅重合 4 条，顺序也完全不同。

结论：p1 trending 不能无条件替换现有 web trending。若后续接入，建议作为新的“p1 热门条目”数据源单独评估展示位，或者仅在确认分区差异可接受后按分区灰度替换。

## 尚未接入或保留现状

| 能力                      | 当前状态   | 处理方式                                                   |
| ------------------------- | ---------- | ---------------------------------------------------------- |
| Wiki、Revision 与最近编辑 | 未接入     | 暂不提供相关路由、查询或写入能力                           |
| p1 搜索                   | 未接入     | 继续使用现有搜索链路                                       |
| p1 章节详情               | 未接入     | 章节详情继续走 v0                                          |
| p1 Socket.IO 通知推送     | 未接入     | 通知中心每 60 秒轮询未读数                                 |
| 照片评论编辑、删除        | 上游无接口 | 只提供读取与发表                                           |
| p1 热门条目 UI            | 未接入     | 已完成数据对比，但与现有 web trending 差异较大，不直接替换 |
