# Release Checklist

本文档记录本项目的本地打包与 GitHub Release 发布流程。目标是尽量不依赖 GitHub CI，同时保证 beta 包到用户手里前经过必要检查。

## 发布前检查

发布前请确认当前工作区干净，且发版 commit 已经在目标分支上：

```powershell
git status
git log --oneline -5
```

依赖与类型检查：

```powershell
pnpm install --frozen-lockfile
pnpm typecheck
```

Velopack 打包需要本机安装 .NET SDK 和 `vpk` CLI。先确认本机能找到 SDK：

```powershell
dotnet --list-sdks
```

如果没有 `dotnet`，Windows 可以用 winget 安装 SDK，macOS 可以用 Homebrew 安装 SDK：

```powershell
winget install Microsoft.DotNet.SDK.8
```

```bash
brew install --cask dotnet-sdk
```

安装后重开 shell，再安装 `vpk`。`vpk` 版本应和应用依赖的 `velopack` npm 包保持一致：

```powershell
dotnet tool install -g vpk --version 1.1.1
```

如果 `vpk` 安装成功但命令找不到，确认 `~/.dotnet/tools` 或 Windows 的 `%USERPROFILE%\.dotnet\tools` 已在 `PATH` 里。

构建检查：

```powershell
pnpm --filter bangumi-electron build
```

本地安装包试打，不上传：

```powershell
pnpm build:bangumi:win:beta
```

Windows 产物会输出到 `app/bangumi/dist/velopack/win-x64-beta`，其中包含 Velopack installer、Portable zip、`.nupkg` 和 `releases.win-x64-beta.json`。

macOS 机器上试打 macOS 包：

```bash
pnpm build:bangumi:mac:beta
```

默认 macOS 命令会同时打 `x64` 和 `arm64`，分别输出到 `app/bangumi/dist/velopack/osx-x64-beta` 和 `app/bangumi/dist/velopack/osx-arm64-beta`。如果只需要单架构：

```bash
pnpm build:bangumi:mac:beta:x64
pnpm build:bangumi:mac:beta:arm64
```

macOS 打包脚本会按目标架构临时 rebuild `better-sqlite3`，结束后恢复成本机架构；本地 `dev` 启动前也会检查 native 模块架构，避免在 Apple Silicon 上误用 x64 native 包。

发布前手动验收建议：

- 全新安装启动成功。
- 登录流程可用，验证码可刷新。
- 记住密码可用，重新打开登录弹窗会预填。
- token 过期、网页登录 cookie 过期时会弹登录框。
- Command 搜索条、`Ctrl/Command + K`、全局 Command 窗口可用。
- 关闭窗口、托盘、再次打开窗口行为符合预期。
- 卸载、覆盖安装、重装后行为符合预期。
- 打包产物中没有临时日志、测试截图、调试输出。

## GitHub Token

发布到 GitHub Release 需要有目标仓库 Release 相关权限。发布脚本会优先使用当前 shell 中的 `GH_TOKEN`，其次使用 `GITHUB_TOKEN`，如果都没有配置，会尝试读取本机已登录的 GitHub CLI token。

```powershell
$env:GH_TOKEN="ghp_xxx"
```

通常本机只需要先登录 GitHub CLI：

```powershell
gh auth login
```

不要把 token 写入仓库文件或命令输出。

## Beta 版本发布

Beta 版本使用 prerelease 版本号，例如：

```powershell
pnpm --filter bangumi-electron version 0.0.1-beta.1 --no-git-tag-version
```

提交版本号：

```powershell
git add app/bangumi/package.json pnpm-lock.yaml
git commit -m "chore(release): release 0.0.1-beta.1"
```

推送 release commit 后，本地构建并发布 Velopack release 到同名 GitHub prerelease：

```powershell
pnpm publish:bangumi:win:beta
```

macOS 机器上发布 macOS beta 包到同一个版本号 prerelease：

```bash
pnpm publish:bangumi:mac:beta
```

只发布单架构时使用：

```bash
pnpm publish:bangumi:mac:beta:x64
pnpm publish:bangumi:mac:beta:arm64
```

Windows beta 发布脚本在 `app/bangumi/scripts/velopack-win.mjs`；macOS beta 发布脚本在 `app/bangumi/scripts/velopack-mac.mjs`。它们会使用系统和架构生成实际 channel，例如 `win-x64-beta`、`osx-arm64-beta`：

```powershell
pnpm publish:bangumi:win:beta
```

```bash
pnpm publish:bangumi:mac:beta:arm64
```

这会把 Velopack 产物和 `releases.<channel>.json` 发布到 GitHub 的版本号 release，例如 `v0.0.1-beta.14`。Beta release 应标记为 GitHub prerelease；发布脚本会给 `vpk download/upload github` 传 `--pre=true`，使它按 prerelease 链路读取上一版并发布当前版。

Agent 发布约束：

- 每个版本号 release 同时作为用户下载页和 Velopack update feed。
- beta/stable 同时通过 GitHub prerelease 状态和 Velopack channel 区分，例如 `win-x64-beta`、`osx-arm64-stable`。
- Windows 发布产物里会同时包含安装版 `Setup.exe`、免安装版 `Portable.zip`、`.nupkg` 和 feed json。
- 发布脚本会先尝试下载远端已有的同 channel feed，再打新包并上传；首次发布时远端 feed 不存在会继续生成 full 包。
- 若只想试打包，使用 `pnpm build:bangumi:win:beta` 或 `pnpm build:bangumi:mac:beta:arm64`。

发布脚本会自动创建或合并到版本号 release。需要手动补传资产时，上传到对应版本号 prerelease：

```powershell
$version = "0.0.1-beta.14"
gh release upload "v$version" `
  app/bangumi/dist/velopack/win-x64-beta/* `
  --repo CottonCandyZ/bangumi-electron `
  --clobber
```

如果同一个版本后补 macOS 包，上传到同一个版本号 prerelease：

```bash
pnpm publish:bangumi:mac:beta:arm64
```

## Production 版本发布

正式版本使用普通 semver，例如：

```powershell
pnpm --filter bangumi-electron version 0.0.1 --no-git-tag-version
```

正式通道当前还没有发布包；Windows 正式通道脚本会生成 `win-x64-stable` 这样的 Velopack channel：

```powershell
pnpm publish:bangumi:win:prod
```

提交并推送：

```powershell
git add app/bangumi/package.json pnpm-lock.yaml
git commit -m "chore(release): release 0.0.1"
git push origin main
```

本地构建并发布：

```powershell
pnpm publish:bangumi:win:prod
```

macOS 机器上发布正式 macOS 包：

```bash
pnpm publish:bangumi:mac:prod
```

正式版本同样支持单架构发布：

```bash
pnpm publish:bangumi:mac:prod:x64
pnpm publish:bangumi:mac:prod:arm64
```

## 后补 macOS 包到版本号 release

如果 Windows beta 已经发布，例如 `0.0.1-beta.1`，后续要补 macOS 包：

1. 切到同一个 release commit。
2. 确认 `app/bangumi/package.json` 版本仍是 `0.0.1-beta.1`。
3. 在 macOS 机器上发布 macOS 产物到同一个版本号 release。

```bash
pnpm install --frozen-lockfile
pnpm publish:bangumi:mac:beta
```

如果只后补单个架构：

```bash
pnpm publish:bangumi:mac:beta:x64
pnpm publish:bangumi:mac:beta:arm64
```

如果只需要试打包、不上传：

```bash
pnpm build:bangumi:mac:beta
```

注意：macOS 自动更新通常需要签名；未签名/未 notarize 的 beta 包可以用于手动下载测试，但不应假设自动更新在 macOS 上完整可用。

## 覆盖已发布资产

GitHub Release 可以替换同名 asset。Velopack 发布脚本会使用 `vpk upload github --merge true` 合并到当前版本号 release；如果需要手动覆盖，使用 `gh release upload --clobber`：

```powershell
gh release upload v0.0.1-beta.14 app/bangumi/dist/velopack/win-x64-beta/* --repo CottonCandyZ/bangumi-electron --clobber
```

如果需要替换整个 update feed，可以先删除对应版本号 release，再重新发布。但已经下载到用户机器上的安装包无法召回；如果内容已经发给外部用户，通常更建议发一个新的 prerelease 版本号，例如 `0.0.1-beta.15`。

## Auto Update Channel

应用设置里只暴露 `beta` 和 `stable`，实际 Velopack channel 会按系统和架构展开，避免某个平台误装另一个平台的包：

- `win-x64-beta`
- `win-arm64-beta`
- `osx-x64-beta`
- `osx-arm64-beta`
- `linux-x64-beta`

正式通道使用同样格式的 `stable` 后缀，例如 `win-x64-stable`。当前还没有正式发布包，所以用户选择正式通道时可能检查不到更新。

客户端默认使用 GitHub 仓库地址作为 Velopack 更新源：

```text
https://github.com/CottonCandyZ/bangumi-electron
```

本地测试可以用环境变量覆盖更新源：

```powershell
$env:BANGUMI_ELECTRON_UPDATE_URL="C:\path\to\local\velopack\feed"
```
