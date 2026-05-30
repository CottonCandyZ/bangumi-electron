# Agent Notes

## Git Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/) for all agent-created commits.
In this repository, a scope is required.

- Format: `<type>(<scope>): <description>`
- Common types: `feat`, `fix`, `refactor`, `perf`, `chore`, `docs`, `test`, `build`, `ci`
- Use `feat` for user-facing capabilities and `fix` for user-facing bug fixes.
- Use `!` after the scope for breaking changes, and include a `BREAKING CHANGE:` footer.
- Keep the description imperative, concise, and lower-case unless it names a proper noun.
- Prefer concrete user-facing semantics over vague messages.
- Examples: `fix(mono-list): handle trending page retry`, `feat(community): add topic sidebar`

Scope definitions:

- `home`: home page layout, carousels, timeline, and home previews.
- `community`: community/talk pages, groups, topics, and discussion previews.
- `group`: group detail pages and group topic/member lists.
- `subject`: subject detail pages, related sections, discussions, episodes, and characters.
- `mono-list`: left-panel mono list tabs, virtual lists, panel refresh/retry behavior.
- `collection`: collection panel, collection lists, and collection item interactions.
- `search`: search pages, search filters, tags, and search-side panels.
- `timeline`: site/user timeline data and timeline presentation.
- `api`: API hooks, fetchers, query caching, and request/session behavior.
- `release`: version bumps, packaging, signing, and publishing.
- `build`: build tooling, bundling, lint/typecheck, and CI-adjacent scripts.
- `docs`: repository documentation and agent instructions.

## Electron CDP

Development runs expose the Electron Chrome DevTools Protocol endpoint by default.

- Default endpoint: `http://127.0.0.1:9222`
- Override port: set `BANGUMI_ELECTRON_CDP_PORT` before starting dev.
- Start normally: `pnpm dev`
- Start explicitly for Codex inspection: `pnpm dev:codex`

When the app is already running from a dev command, prefer agent-browser for CDP automation:

```bash
pnpm exec agent-browser --cdp 9222 snapshot
pnpm exec agent-browser --cdp 9222 screenshot
pnpm exec agent-browser --cdp 9222 tab
```

Use the project-installed skill at `.agents/skills/agent-browser/SKILL.md`. For current usage instructions, run `pnpm exec agent-browser skills get core`; for Electron-specific workflows, run `pnpm exec agent-browser skills get electron`.

If the endpoint does not respond, restart the dev process. Electron command-line switches must be registered before the app is ready, so an app instance that was started before CDP was enabled will not expose the port.

## Reading Electron Pages

Before inspecting UI state, list tabs and confirm the selected URL:

```bash
pnpm exec agent-browser --cdp 9222 tab
pnpm exec agent-browser --cdp 9222 get url
pnpm exec agent-browser --cdp 9222 get title
```

There can be more than one Electron target. The command palette route may appear as `/#/command`; do not confuse its `Command Panel` content with the app page being inspected. If needed, switch tabs with `pnpm exec agent-browser --cdp 9222 tab <tab-id>` or navigate the selected tab directly.

Prefer compact snapshots to keep context clean:

```bash
pnpm exec agent-browser --cdp 9222 snapshot -i -c -d 2
pnpm exec agent-browser --cdp 9222 snapshot -c -d 4
```

Use `-i -c -d 2` for interactive controls, and `-c -d 4` for page structure. Avoid a full `snapshot` unless the compact output is insufficient.

When navigating routes, reuse the current origin from `get url` rather than assuming the renderer port. The Vite renderer port can move if another dev server is already running. Example route navigation:

```bash
pnpm exec agent-browser --cdp 9222 open http://localhost:5173/#/subject/4022
pnpm exec agent-browser --cdp 9222 wait --load networkidle
```

The home page snapshot is expected to include category carousel regions such as `动画`, `游戏`, `书`, `音乐`, and `三次元`, plus the persistent TanStack query devtools button.
