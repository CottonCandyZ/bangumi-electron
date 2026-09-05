# Electron 测试

## 日常回归：Vitest

在仓库根目录运行 `pnpm test`；开发时运行 `pnpm test:watch`。测试使用真实业务模块，通过 `vi.mock` 替换网络、Electron IPC 和会话存储等外部依赖。

- `pnpm --filter bangumi-electron test:collections`：SQLite 事务、重启恢复、冲突合并、分页和网络失败。
- `pnpm --filter bangumi-electron test:web-access`：CF 验证、OAuth 与验证码隔离、各分类恢复、404 和离线缓存。

`scripts/test.mjs` 只负责用 Electron 的 Node 启动 Vitest，保证 `better-sqlite3` 的 ABI 与应用一致。它不实现测试框架，也不重新编译原生模块。Vitest 使用单个 fork worker；测试不访问真实 Bangumi 服务。

## 界面回归：Vitest + agent-browser CLI + CDP

先以隔离的用户目录启动开发实例，避免修改日常使用的数据。以下命令在仓库根目录的 PowerShell 中执行：

```powershell
$env:BANGUMI_ELECTRON_USER_DATA = Join-Path (Get-Location) '.local-doc/electron-test-profile'
pnpm dev:codex
```

另一个终端中，确认首页已有缓存，再运行：

```powershell
pnpm --filter bangumi-electron test:electron:offline
```

该入口单独运行，不包含在默认 `pnpm test` 中。它通过 CLI 连接已有的 CDP 端点，检查离线刷新保留缓存、不新增错误 toast，以及无缓存区域显示 fallback、禁用重试。测试在 `finally` 中恢复查询状态和网络；不输入登录凭据。`BANGUMI_ELECTRON_CDP_PORT` 可覆盖默认 9222。

更换依赖或 QueryClient 模块后，应重新加载测试页面，避免 HMR 残留多个模块实例。不要在测试期间操作被测窗口。

为减少上下文和输出，优先使用 `--json` 和只返回布尔值、计数的 `eval`；交互时用 `snapshot -i -c -d 2`，只在布局检查时截图。不要反复输出整个首页和条目列表。

Windows 上使用 `pnpm browser --cdp 9222 ...`。项目启动器直接调用原生 agent-browser CLI，并设置 `windowsHide: true` 和 `shell: false`，避免上游 JS 启动器的 `windowsHide: false` 弹出控制台。Vitest 界面测试也共用此入口。

Windows 上使用 `pnpm browser --cdp 9222 ...`。项目启动器直接调用原生 agent-browser CLI，并设置 `windowsHide: true` 和 `shell: false`，避免上游 JS 启动器的 `windowsHide: false` 弹出控制台。Vitest 界面测试也共用此入口。

## 测试边界和后续选择

CDP 的 renderer 离线模拟不能证明主进程 `session.fetch` 也断网。当前主进程网络失败由 Vitest transport 测试覆盖。要做端到端的真实断网回归，应在隔离实例中同时控制主进程会话网络，例如 Electron 的 [`session.enableNetworkEmulation`](https://www.electronjs.org/docs/latest/api/session#sesenablenetworkemulationoptions)，并保证恢复。

如果之后需要 CI 自动启动窗口、控制主进程和 renderer、保存失败 trace，可以考虑 Playwright 的 [`_electron.launch`](https://playwright.dev/docs/api/class-electron)。该 API 仍标注为实验性；无需为了当前检查马上增加另一套框架。连接已有窗口的 [`connectOverCDP`](https://playwright.dev/docs/api/class-browsertype#browser-type-connect-over-cdp) 能力也弱于 Playwright 自身协议。

[Electron 官方自动化指南](https://www.electronjs.org/docs/latest/tutorial/automated-testing)列出了 Playwright 和 WebdriverIO 等方案。当前采用 Vitest 做确定性业务回归、CLI + CDP 做少量真实窗口检查，能复用现有工具并控制输出量。
