<p align='center'>
  <img width="120"  height="120" src="build/icon.png">
</p>
<p align='center'>icon is from <a href='https://next.bgm.tv'>next.bgm.tv</a></p>


> [!NOTE]
> 这是一个仍处在早期开发阶段的应用~

## 这是什么？

这是一个 [bgm.tv](https://bgm.tv) 的桌面客户端，目标是做一个好看又好用的收藏整理工具，包括但不限于动画、游戏、电视剧、音乐、图书的进度管理。

它基于 Electron-vite 和 React。

它可能不仅仅是一个 bangumi 客户端，因为我后续可能会支持收藏 bangumi 以外的东西，比如你的 figures。

## 进度？

### 2025

- [ ] \[2025.05] Everything has been done!! 正在重构并使用 useSuspenseQuery，同时分离 token 的获取～，这些结束后终于可以继续开发新功能了！
- [x] \[2025.03] 正处在毕业季...结束就有时间了。已经在重构中...
- [x] \[2025.02] 还是觉得放在 Notion 上会比较好管理一些，所以说新的 Project Manage 会[出现在这里](https://cottoncandyz.notion.site/BE-Project-1914e3d00a8a8003a336f81f18b48f48?pvs=4)，等到正式发布时会同步为 Change Log。
- [x] \[2024.12\] & \[2025.01\] 还在忙别的事中...预计过年会有一点时间稍微理一下代办和项目结构，重新建一个 Linear 的 Project，理一下优先级。预计还是会优先实现搜索 → 收藏优化 → 评论，有空了会给 changeLog 和更新最优先的事项。（希望二月能推进一些！！

### 2024

- [x] \[2024.12\] 在忙别的事情中...预计12月之后会有一些空闲，11月的待办仍需完成，同时预计做一些动画性能优化...
- [ ] \[2024.11\] 缓存、同步、搜索。
- [x] \[2024.10\] 正在重构以支持本地数据库，或将支持部分离线功能。（基本完成）
- [x] \[2024.09\] 主要重写了 panel, hover card 和 hover pop card，正在完成搜索（尚未完成）。
- [x] \[2024.08\] 状态管理，滚动条、背景、条目页、用户收藏的设计。
- [x] \[2024.07\] 应用最基本的分块、主页的设计。基本的点格字、收藏。
- [x] \[2024.06\] 登录和最基本的 session 管理；轮播图。

可以说每天都在抽时间写，第一次写 electron，甚至是第一次写 SPA，所以在踩坑和填坑中，但是不会弃坑。

目前在用 Logseq 做本地进度管理，后续可能会开一个 Project 或者使用 Linear 来管理总体的开发进度。

作为桌面客户端，我想要保证有以下特性：

- 快捷键
- 右键菜单
- 全局 command menu

### 所以说什么时候会有第一版

~~预估 24 年年底~~ ~~当然预估总是不准的~~ 估计要到 25 年年底了~

## 如果可以帮助的话

非常欢迎，由于我也摸索，同时也在参考 [AFFiNE](https://github.com/toeverything/AFFiNE) 和 [Follow](https://github.com/RSSNext/Follow) 以及其他一些优秀的 Web + Electron 项目，如果你有任何的建议（无论是功能还是代码结构问题），可以到[讨论区](https://github.com/CottonCandyZ/bangumi-electron/discussions)讨论。

### 使用了哪些常见库

Framer Motion, React/TanStack Query, Jotai, shadcn/ui, Tailwind

## Preview

虽然截图都是 Mac 的，但是也是支持 Windows 的，其实大部分时间都是在 PC 上开发的

![Light](doc/screenshot/light.webp)
![Dark](doc/screenshot/dark.webp)
![cover](doc/screenshot/cover.webp)
![Tags](doc/screenshot/tags.webp)
![info-box](doc/screenshot/infobox.webp)
![Book](doc/screenshot/book.webp)
![dark-game](doc/screenshot/dark-game.webp)
![Episode](doc/screenshot/episode.webp)
![Grid](doc/screenshot/grid.webp)

### 怎么全都是一个页面？所以说别的页面呢

主页开发了一半被我搁置了，我正在准备将其改成那种 [drag and drop](https://swapy.tahazsh.com/) 的样式，所以正在制作中。至于原来的主页，是用 Pop Card + Carousel 的方案，有点类似微软商店，如果感兴趣的话，在 [这里的](https://home.nanachi.moe/posts/2024-08-12-global-hover-card) 的第一个视频实际有所展现。

搜索页正在制作中，由于 item-card 的样式还没有确定，以及 filter 摆放的位置问题，所以 ui 相对简陋，以及我还在考虑放出 Tags 的合理性，所以样式并不是确定的，但是还是可以预览一下的（最终可能不长这样）：

![Search](doc/screenshot/search.webp)

## Thanks

这个项目的存在离不开下面项目的帮助！

- [由 @cyz0729 开发的 Bangumi RN 客户端](https://github.com/czy0729/Bangumi)

- [Bangumi 自身的开源设施](https://github.com/bangumi)

- 一些组件设计和文件结构值得参考 [AFFiNE](https://github.com/toeverything/AFFiNE)

- Electron 部分的文件组织 [Follow](https://github.com/RSSNext/Follow)
