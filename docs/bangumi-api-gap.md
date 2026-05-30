# Bangumi API 接入缺口

更新日期：2026-05-12

本文档按当前仓库实现对照 Bangumi `api.bgm.tv/v0` open API 和 `next.bgm.tv/p1` private API，记录还没有接入或只接了一部分的接口方向。

## 当前已接入

### Open API

- 用户：`GET /v0/me`、`GET /v0/users/{username}`
- 条目：详情、关联人物、关联角色、关联条目
- 章节：按条目取章节、章节详情
- 人物/角色：详情、参与作品、关联角色/人物
- 搜索：`POST /v0/search/subjects`
- 收藏：用户条目收藏列表、单条目收藏、添加/修改条目收藏、按条目修改章节收藏

### Private API

- 用户：`GET /p1/users/{username}`、`GET /p1/users/{username}/timeline`
- 吐槽箱读取：条目、章节、角色、人物 comments
- 收藏实验：`GET /p1/collections/subjects`
- Turnstile demo：`GET /p1/turnstile`

### 主站/Web

- 登录、OAuth、token status、refresh token
- Web 删除条目收藏
- 条目 HTML infobox、趋势页等页面解析

## Open API 未接入

### 搜索与浏览

- `POST /v0/search/characters`
- `POST /v0/search/persons`
- `GET /v0/subjects`

### 图片资源

- `GET /v0/subjects/{subject_id}/image`
- `GET /v0/characters/{character_id}/image`
- `GET /v0/persons/{person_id}/image`
- `GET /v0/users/{username}/avatar`

### 收藏扩展

- `GET /v0/users/-/collections/-/episodes/{episode_id}`
- `PUT /v0/users/-/collections/-/episodes/{episode_id}`
- `GET /v0/users/{username}/collections/-/characters`
- `GET /v0/users/{username}/collections/-/characters/{character_id}`
- `POST /v0/characters/{character_id}/collect`
- `DELETE /v0/characters/{character_id}/collect`
- `GET /v0/users/{username}/collections/-/persons`
- `GET /v0/users/{username}/collections/-/persons/{person_id}`
- `POST /v0/persons/{person_id}/collect`
- `DELETE /v0/persons/{person_id}/collect`

### 目录 Index

- `POST /v0/indices`
- `GET /v0/indices/{index_id}`
- `PUT /v0/indices/{index_id}`
- `GET /v0/indices/{index_id}/subjects`
- `POST /v0/indices/{index_id}/subjects`
- `PUT /v0/indices/{index_id}/subjects/{subject_id}`
- `DELETE /v0/indices/{index_id}/subjects/{subject_id}`
- `POST /v0/indices/{index_id}/collect`
- `DELETE /v0/indices/{index_id}/collect`

### Revision/Wiki 历史

- `GET /v0/revisions/persons`
- `GET /v0/revisions/persons/{revision_id}`
- `GET /v0/revisions/characters`
- `GET /v0/revisions/characters/{revision_id}`
- `GET /v0/revisions/subjects`
- `GET /v0/revisions/subjects/{revision_id}`
- `GET /v0/revisions/episodes`
- `GET /v0/revisions/episodes/{revision_id}`

### Legacy Open

- `GET /calendar`
- `GET /search/subject/{keywords}`

## Private API 未接入

### 社区优先级高

- 小组：列表、详情、成员、主题列表、发主题、主题详情、回帖、编辑/删除、点赞
- 条目讨论：条目主题列表、全站条目主题、发主题、主题详情、回帖、编辑/删除、点赞
- 日志：日志详情、关联条目、图片、评论列表、发评论、编辑/删除评论
- 时间线：全局时间线、发时间线、删除、回复、点赞、事件流
- 目录社区：目录详情、关联条目、目录评论、创建/编辑/删除目录和目录评论
- 吐槽箱写入：条目、章节、角色、人物 comments 的发表、编辑、删除、点赞
- 社交关系：好友、关注者、好友列表、黑名单、加好友、拉黑、取消
- 通知与举报：通知列表、清除通知、举报

### 搜索与趋势

- `POST /p1/search/subjects`
- `POST /p1/search/characters`
- `POST /p1/search/persons`
- `GET /p1/calendar`
- `GET /p1/trending/subjects`
- `GET /p1/trending/subjects/topics`

### 条目详情补充

- p1 条目列表与详情
- p1 章节列表
- p1 条目 relations、characters、staff persons、staff positions
- p1 条目推荐、reviews、indexes、collects

### 收藏

- p1 条目收藏写入
- p1 单章节收藏写入
- p1 角色收藏列表、收藏、取消收藏
- p1 人物收藏列表、收藏、取消收藏
- p1 目录收藏列表、收藏、取消收藏

### Wiki 编辑

- 最近编辑：subjects、persons、characters、episodes
- 条目：创建、编辑、revision、history summary、关系/角色/人物历史
- 章节：读取、编辑
- 封面：列表、上传、投票、取消投票
- 人物/角色：创建、编辑、头像上传、revision、history summary、贡献列表
- 管理：条目锁定、解锁

## 社区 API 建议顺序

1. 只读社区：小组主题、条目讨论、日志评论、目录评论、subject reviews。
2. 统一社区模型：`Topic`、`Post`、`Comment`、`Reaction`。
3. 写入能力：发帖、回帖、发评论、编辑、删除、点赞。
4. 社交与通知：好友、黑名单、通知、举报。
5. Wiki 编辑：需要权限、表单校验和更细的错误处理，建议最后接。
