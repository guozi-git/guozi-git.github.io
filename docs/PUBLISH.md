# GitHub Pages 发布与回滚

2026-10-15 经用户授权，正式入口改为 https://guozi-git.github.io/ ，权威源码仓库为 guozi-git/guozi-git.github.io，默认分支 main，Pages Source 为 GitHub Actions。具体发布状态以 Actions 与线上 version.json 为准；不能把本地检查视为线上验收。旧 guozi-website 仓库及项目站保留，不停用旧链接。

## 日常发布

1. 本地运行 `npm ci`、`npm run lint`、`npm run format:check`、`npm run content:check`、`npm run papers:test`。
2. `npm run build` 后执行 `npm run typecheck`。静态产物在 out；构建自动检查 HTML 链接、公开资源、PDF 文件头、SEO 与版本文件。
3. `npm start` 后运行 `npm run test:browser`、`npm run test:static`。浏览器检查必须使用与构建一致的路径；完整浏览器回归默认测试根路径，子路径用 test:static。
4. 获得当次发布授权后，推送经验证的提交到 main。不要使用强制推送。
5. Actions 的 Verify static website 检查根路径与项目路径；Publish GitHub Pages 在独立构建、静态检查及完整交互回归全部通过后才上传产物并部署。完整交互测试在发布工作流内执行，失败会中止 build，deploy 因 needs: build 被跳过；不能依赖并行 Verify 工作流作为发布门槛。只有 Publish 部署网站，两者不是重复部署。
6. 发布后工作流核对 `version.json` 的提交 SHA、所有允许公开的资源、论文 PDF、主要页面和真实 404。最多等待传播重试4次；失败保留失败状态，不能当作发布成功。
7. 最后人工打开首页、两个论文板块及原文，检查外观、切换、搜索、手机宽度。版本文件成功不替代视觉检查。

## 配置来源

- Node.js 24.21.0 / npm 11.19.0，使用锁文件和 npm ci。
- `PAGES_ENABLED=true` 是仓库 Actions 变量。关闭只阻止新部署，不撤下现有网站。
- 工作流从 configure-pages 读取 base_path/base_url，注入 `NEXT_PUBLIC_BASE_PATH`、`NEXT_PUBLIC_SITE_URL`，正式构建 `INDEX_SITE=true`。
- 本地默认根路径，默认 noindex。`.env.example` 说明变量，不包含秘密。
- 无需个人令牌，部署使用平台 GITHUB_TOKEN/OIDC；contents:read，只有部署作业增加 pages:write 和 id-token:write。
- 部署并发串行，构建失败不会进入部署。静态站无需 next start、数据库或常驻Node服务。
- robots.txt 在项目路径下不能代替域名根 `/robots.txt` 的作用；根域名迁移获准后才可控制根文件。当前索引规则主要由页面meta提供。

## 子路径模拟（PowerShell）

```powershell
$env:NEXT_PUBLIC_BASE_PATH='/guozi-website'
$env:NEXT_PUBLIC_SITE_URL='https://guozi-git.github.io/guozi-website'
$env:INDEX_SITE='true'
npm run build
npm start -- --port 3100
```

另一个终端使用相同环境运行：

```powershell
npm run test:static -- http://127.0.0.1:3100/guozi-website/
node scripts/check-deployed.mjs http://127.0.0.1:3100/guozi-website/
```

切回本地预览时清空三个变量并重新构建。本地version可标记dirty；正式检查要求SHA匹配且dirty=false。

## 故障定位

- 构建失败：先看失败步骤，不发布旧out充当新版本。检查content/PDF哈希和导出资源错误。
- 测试失败：Actions下载 verification-logs 或 pages-verification-logs，查看测试结果和预览服务日志。
- 部署成功而验证失败：查看报告的具体URL、响应状态和版本SHA；检查CDN传播、basePath与公开资源白名单。
- 缺失PDF：检查src/lib元数据及public原件；不要重命名ID或用首页掩盖404。
- 论文排名编号只是展示标签；历史hash和PDF始终使用稳定ID。维护时按原题及稳定ID匹配，不按变化中的排名文件名匹配。
- 搜索可匹配原ID或排名标签，若两者碰巧相同可能返回多篇，用英文标题进一步缩小。

## 回滚（不改写历史）

2026-10-26 本轮发布前核对的根站版本：`bd928a0f79395dd2270d46e11f863dcc94960976`，Publish 运行40051138636成功，线上 version.json 的 SHA 一致且 dirty=false。后续回滚前须重新核对当时的线上版本；旧项目兼容站仍使用下文记录的历史版本。

1. 记录线上version.json、失败workflow和问题提交SHA。
2. 对本次问题提交执行 `git revert <问题提交SHA>`；多个提交按从新到旧逐个撤销，解决冲突时保留论文/PDF原数据。
3. 运行完整检查和正式构建，再经授权推送main。等待Publish以及发布后检查成功。
4. 核对线上版本与关键页面。不得以本地revert成功代替线上恢复成功。

若工作流本身有问题，可先关闭PAGES_ENABLED阻止后续部署，修复后重新开启；不要取消发布现有站点。不要删除仓库或改写Git历史。

## 根域名部署与旧站兼容

本次迁移已获得用户明确授权。新仓库guozi-git.github.io作为唯一权威源码维护入口，根站构建basePath为空、siteURL为https://guozi-git.github.io。旧项目站仍完整提供原有页面、hash与PDF，不改名、不强制跳转、不删除。

日常修改只推送新仓库。旧仓库保留已验证a9285f4版本供兼容和回退，不进行两边独立开发。若新站验收失败，继续使用旧网址，无需先恢复旧站。新站后续回退采用revert后重新部署，不改写历史。

当前旧站canonical仍指向旧地址，保留它有利于原站独立回退，但短期可能出现重复索引。后续若统一旧站canonical或设置重定向，应另行验证完整hash/PDF兼容，不把这一操作混入根站首次上线。

本地Git remote：origin指向新权威仓库，legacy指向旧仓库。执行推送前检查git remote -v，避免误更新历史兼容站。
新增独立论文静态URL也是独立待确认项目，现有hash没有被伪装成可独立索引页面。论文详情在浏览器中更新标题、description、OG/Twitter 描述和 citation_title/pdf，退出详情时恢复描述。复制论文链接保留现有 hash；这些运行时元数据不等于爬虫可读的独立分享卡片，也不保证学术搜索收录，不补造作者、期刊或发表日期。

官方说明：https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
