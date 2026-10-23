# 测试

## 日常回归：Vitest

项目已使用 Vitest。局部修改优先运行相关测试，以下命令均可从仓库根目录执行，文件路径相对于 `app/bangumi`：

```bash
# 根据源码的依赖关系选择测试，一次执行后退出
pnpm test:related src/renderer/src/components/carousel/big-carousel.tsx

# 已知对应测试时直接指定文件，也可通过 -t 选择用例
pnpm test scripts/test/big-carousel.test.tsx
pnpm test scripts/test/big-carousel.test.tsx -t "hover pauses"

# 根据未提交的 Git 改动选择测试，或指定比较的基准
pnpm test:changed
pnpm test:changed origin/main
```

`test:related` 使用 [Vitest related](https://v3.vitest.dev/guide/cli#vitest-related) 的静态依赖图，支持一次传入多个源码文件或绝对路径。通过变量动态导入、IPC 或运行时注册建立的关系可能无法被追踪，应显式指定对应测试。没有匹配测试表示缺少覆盖，不能视为验证通过，也不要因此自动改跑全量。

修改完成后集中跑一次能覆盖改动的测试；只有继续改代码、测试失败或仍有未解决的疑点时才重跑。文案、样式等低风险修改按影响选择验证方式，不为提交重复跑已通过的检查。

完整回归使用 `pnpm test`，用于明确要求全量测试或影响范围广且无法用定向用例覆盖的修改。共享模块或 Vitest 配置变化可能使 `test:changed` 选择更多测试；局部验证应优先使用明确的 `test:related` 输入或测试文件。开发时可使用 `pnpm test:watch <test-file>`。

测试使用真实业务模块，通过 `vi.mock` 替换网络、Electron IPC 和会话存储等外部依赖。

- `pnpm --filter bangumi-electron test:collections`：SQLite 事务、重启恢复、冲突合并、分页和网络失败。
- `pnpm --filter bangumi-electron test:web-access`：CF 验证、OAuth 与验证码隔离、各分类恢复、404 和离线缓存。

`scripts/test.mjs` 只负责用 Electron 的 Node 启动 Vitest，保证 `better-sqlite3` 的 ABI 与应用一致，不打开 Electron 窗口。它不实现测试框架，也不重新编译原生模块。Vitest 使用单个 fork worker；测试不访问真实 Bangumi 服务。

## React 组件：Vitest + jsdom + React Testing Library

默认环境仍为 Node。组件测试放在 `scripts/test/*.test.tsx`，在文件顶部加上 `// @vitest-environment jsdom` 即可启用 DOM；JSX 使用自动运行时，不需要启动应用。

状态、点击、悬停、焦点、页面可见性和计时器逻辑优先在这一层验证。使用 `vi.useFakeTimers()` 和 `act()` 推进时间，在 `afterEach` 中调用 `cleanup()`、恢复真实计时器及被替换的浏览器 API。参考 [`big-carousel.test.tsx`](../app/bangumi/scripts/test/big-carousel.test.tsx)，六秒自动切换和暂停恢复均无需实际等待。

jsdom 不提供真实布局和动画渲染；涉及卡片可见范围、拖拽几何、实际动画效果或原生窗口集成时，再选择对应的 Electron 回归。

## 界面回归：Vitest + agent-browser CLI + CDP

先以隔离的用户目录启动开发实例，避免修改日常使用的数据。以下命令在仓库根目录的 PowerShell 中执行：

```powershell
$env:BANGUMI_ELECTRON_USER_DATA = Join-Path (Get-Location) '.local-doc/electron-test-profile'
pnpm dev:codex
```

另一个终端中，只运行与改动相关的文件，例如轮播布局回归：

```powershell
pnpm --filter bangumi-electron exec node scripts/test.mjs run --config vitest.electron.config.ts scripts/test/electron/big-carousel.test.mjs
```

需要运行完整的窗口回归时，确认首页已有缓存，再运行：

```powershell
pnpm --filter bangumi-electron test:electron:offline
```

该入口单独运行，不包含在默认 `pnpm test`、`test:related` 或 `test:changed` 中。`test:electron:offline` 是现有名称，实际会运行 `scripts/test/electron/*.test.mjs` 的全部窗口用例，局部修改不要默认使用它。离线用例检查刷新保留缓存、不新增错误 toast，以及无缓存区域显示 fallback、禁用重试；在 `finally` 中恢复查询状态和网络，不输入登录凭据。`BANGUMI_ELECTRON_CDP_PORT` 可覆盖默认 9222。

更换依赖或 QueryClient 模块后，应重新加载测试页面，避免 HMR 残留多个模块实例。不要在测试期间操作被测窗口。

为减少上下文和输出，优先使用 `--json` 和只返回布尔值、计数的 `eval`；交互时用 `snapshot -i -c -d 2`，只在布局检查时截图。不要反复输出整个首页和条目列表。

Windows 上使用 `pnpm browser --cdp 9222 ...`。项目启动器直接调用原生 agent-browser CLI，并设置 `windowsHide: true` 和 `shell: false`，避免上游 JS 启动器的 `windowsHide: false` 弹出控制台。Vitest 界面测试也共用此入口。

## 测试边界和后续选择

CDP 的 renderer 离线模拟不能证明主进程 `session.fetch` 也断网。当前主进程网络失败由 Vitest transport 测试覆盖。要做端到端的真实断网回归，应在隔离实例中同时控制主进程会话网络，例如 Electron 的 [`session.enableNetworkEmulation`](https://www.electronjs.org/docs/latest/api/session#sesenablenetworkemulationoptions)，并保证恢复。

如果之后需要 CI 自动启动窗口、控制主进程和 renderer、保存失败 trace，可以考虑 Playwright 的 [`_electron.launch`](https://playwright.dev/docs/api/class-electron)。该 API 仍标注为实验性；无需为了当前检查马上增加另一套框架。连接已有窗口的 [`connectOverCDP`](https://playwright.dev/docs/api/class-browsertype#browser-type-connect-over-cdp) 能力也弱于 Playwright 自身协议。

[Electron 官方自动化指南](https://www.electronjs.org/docs/latest/tutorial/automated-testing)列出了 Playwright 和 WebdriverIO 等方案。当前采用 Vitest 做确定性业务回归、CLI + CDP 做少量真实窗口检查，能复用现有工具并控制输出量。
