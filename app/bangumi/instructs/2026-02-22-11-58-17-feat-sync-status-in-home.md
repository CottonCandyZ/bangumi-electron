### Entry

maybe src\renderer\src\modules\main\home\small-carousel\subject-card-content.tsx

### Detail

1. 支持标记同步，仅在用户 hover 时查询。
2. 支持修改标记状态。

### Test

pass

### Feature Updates (AGENT GENERATE)

1. 首页小卡片新增收藏状态同步能力：仅在 PopCard 激活（hover 展开）时触发 `collection-subject` 查询，减少无效请求。
2. 首页小卡片新增收藏状态修改能力：在卡片内可直接切换收藏类型，支持“已有收藏修改”与“未收藏直接新增”两种提交路径。
3. 首页小卡片新增登录态分流：未登录不展示“标记”入口，已登录才展示收藏状态控件。
4. 首页小卡片新增显式同步态 UI：在状态尚未返回时展示“同步中”加载状态（带转圈反馈），避免无反馈交互。
5. 抽取并新增通用收藏类型变更 Hook：`useSubjectCollectionTypeMutation`（`src/renderer/src/data/hooks/api/collection-mutation.ts`），统一处理 optimistic update、回滚与 query invalidate；已接入首页卡片与条目页收藏状态选择器。
6. Session Hook 新增 `useSessionUsername`（`src/renderer/src/data/hooks/session.ts`），并在相关收藏/章节模块落地替换用户名获取流程，减少重复样板代码。
7. 首页卡片动画策略增强：在标题、评分、标记区域通过 `layoutDependency={isActive}` 隔离外层动画影响，并关闭 tags 区块的 layout 动画，保留必要淡入淡出表现。
