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

构建检查：

```powershell
pnpm --filter bangumi-electron build
```

本地安装包试打，不上传：

```powershell
pnpm --dir app/bangumi exec electron-builder --win --publish never
```

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

发布到 GitHub Release 需要本地配置 `GH_TOKEN`。Token 需要有目标仓库 Release 相关权限。

```powershell
$env:GH_TOKEN="ghp_xxx"
```

不要把 token 写入仓库文件。

## Beta 版本发布

Beta 版本使用 prerelease 版本号，例如：

```powershell
pnpm --filter bangumi-electron version 0.0.1-beta.1 --no-git-tag-version
```

提交版本号：

```powershell
git add app/bangumi/package.json pnpm-lock.yaml
git commit -m "chore: release 0.0.1-beta.1"
```

创建并推送 tag：

```powershell
git tag v0.0.1-beta.1
git push origin main
git push origin v0.0.1-beta.1
```

本地构建并发布到 GitHub prerelease：

```powershell
$env:GH_TOKEN="ghp_xxx"
pnpm --dir app/bangumi exec electron-builder --win --publish always
```

当前 `electron-builder.yml` 中 beta 发布配置为：

```yaml
publish:
  provider: github
  owner: CottonCandyZ
  repo: bangumi-electron
  releaseType: prerelease
  channel: beta
```

这会把产物和 auto-update metadata 发布到 GitHub Release。若只想试打包，使用 `--publish never`。

## Production 版本发布

正式版本使用普通 semver，例如：

```powershell
pnpm --filter bangumi-electron version 0.0.1 --no-git-tag-version
```

正式发布前需要把 `electron-builder.yml` 的 publish 配置切换到正式通道：

```yaml
publish:
  provider: github
  owner: CottonCandyZ
  repo: bangumi-electron
  releaseType: release
  channel: latest
```

提交、打 tag、推送：

```powershell
git add app/bangumi/package.json pnpm-lock.yaml app/bangumi/electron-builder.yml
git commit -m "chore: release 0.0.1"
git tag v0.0.1
git push origin main
git push origin v0.0.1
```

本地构建并发布：

```powershell
$env:GH_TOKEN="ghp_xxx"
pnpm --dir app/bangumi exec electron-builder --win --publish always
```

## 后补 macOS 包到同一个 tag

如果 Windows beta 已经发布，例如 `v0.0.1-beta.1`，后续要在同一个 tag 下补 macOS 包：

1. 切到同一个 tag 对应的代码或同一个 release commit。
2. 确认 `app/bangumi/package.json` 版本仍是 `0.0.1-beta.1`。
3. 在 macOS 机器上构建 mac 产物。

```bash
pnpm install --frozen-lockfile
pnpm --dir app/bangumi exec electron-builder --mac --publish never
```

4. 上传 macOS 产物和对应 metadata 到同一个 GitHub Release。

```bash
gh release upload v0.0.1-beta.1 app/bangumi/dist/* --repo CottonCandyZ/bangumi-electron
```

如果需要替换同名 asset：

```bash
gh release upload v0.0.1-beta.1 app/bangumi/dist/* --repo CottonCandyZ/bangumi-electron --clobber
```

注意：macOS 自动更新通常需要签名；未签名/未 notarize 的 beta 包可以用于手动下载测试，但不应假设自动更新在 macOS 上完整可用。

## Auto Update Channel

当前 beta 发布使用 `channel: beta`。通道建议：

- `beta`：版本号包含 prerelease，例如 `0.0.1-beta.1`，GitHub Release 使用 prerelease。
- `latest`：正式版本，例如 `0.0.1`，GitHub Release 使用 release。

通常 beta 用户可以收到 beta 和 stable 更新；stable 用户只收到 stable 更新。GitHub provider 下请显式设置 `channel`，不要只依赖版本号推断。

后续如果在应用内加更新检查逻辑，可以用 `electron-updater` 的 channel 能力区分 beta/latest。
