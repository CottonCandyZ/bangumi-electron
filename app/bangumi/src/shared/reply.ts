export type ReplyTarget =
  | {
      id: number
      title?: string
      type: 'group-topic' | 'subject-topic'
    }
  | {
      id: number | string
      title?: string
      type: 'episode' | 'person' | 'character' | 'timeline' | 'blog' | 'index'
    }

export type ReplyComposerContent = {
  draft?: string
  editCommentId?: number
  replyTo?: number
  replyToFloor?: string
  replyToRoot?: number
  replyToName?: string
  target: ReplyTarget
}

export function getReplyTargetLabel(target: ReplyTarget) {
  switch (target.type) {
    case 'group-topic':
      return target.title ? `小组话题 · ${target.title}` : '小组话题'
    case 'subject-topic':
      return target.title ? `条目讨论 · ${target.title}` : '条目讨论'
    case 'episode':
      return target.title ? `章节吐槽箱 · ${target.title}` : '章节吐槽箱'
    case 'person':
      return target.title ? `人物吐槽箱 · ${target.title}` : '人物吐槽箱'
    case 'character':
      return target.title ? `角色吐槽箱 · ${target.title}` : '角色吐槽箱'
    case 'timeline':
      return '时间线'
    case 'blog':
      return target.title ? `日志评论 · ${target.title}` : '日志评论'
    case 'index':
      return target.title ? `目录评论 · ${target.title}` : '目录评论'
  }
}
