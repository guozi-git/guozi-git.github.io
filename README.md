# guozi-website

果子的个人网站。以地球与玻璃圆环作为首页入口，记录数学论文、羽毛球装备、游泳数据、游戏回忆与收藏、个人小作品和 AI 数学论文工厂。

## 本地运行

Node.js 24.21.0、npm 11.19.0。Next.js 16.3.6、React 19.3.0，版本锁定于 package-lock.json。

```sh
npm ci
npm run dev
```

打开 http://localhost:3000/ 。静态构建与预览：

```sh
npm run build
npm start
```

生成目录为 out，不需要 Next.js 服务端。不要使用 next start。

## 检查

```sh
npm run typecheck
npm run lint
npm run format:check
npm run content:check
npm run build
```

启动本地预览后运行 npm run test:browser 和 npm run test:static。Windows 默认使用已安装的 Edge；CI 使用 Chromium。

## 发布

正式网站：https://guozi-git.github.io/guozi-website/ 。配置从 GitHub Pages 读取实际网址与路径。根域名迁移尚未实施。

发布已启用；main 更新可触发自动部署，推送前须获得当次授权。构建、线上验证和回滚见 [发布说明](docs/PUBLISH.md)，日常内容编辑见 [维护说明](docs/MAINTENANCE.md)。仓库公开前仍应检查所有准备公开的文字和图片。

本目录是一份可独立构建的公开源码快照，不包含原始开发历史、聊天记录、原始订单截图、未使用的个人原图或本地机器配置。此目录是当前网站的维护源码；未推送的本地修改不代表已上线。

## 内容与素材

公开源码不等于授予转载个人文章、照片或第三方素材的许可。本仓库暂未指定开源许可证；图片来源见 [素材说明](docs/ASSETS.md)。

论文工厂的百分制数据、原文与补充材料更新、备份和恢复步骤见 [维护流程](docs/1013_论文维护流程_v2.txt)。所有内容更新先本地校验与预览，经确认再发布。

## 当前研究评价数据

2026-10-14 起，实际页面使用 `src/lib/research-reviews.json` 中的 78 项评价（匠心造 1 项、小作坊 77 项）。`factory-papers.json` 保留历史评分快照和原题、摘要、原文信息；页面覆盖历史评分，不展示旧分。`research-stage-paper.json` 保存新增阶段报告的原文信息。

后续维护评分须更新 `research-reviews.json` 并运行 `content:check`；旧 `papers:update` 命令只维护历史格式与原文元数据，不能替代新版评价更新。报告归并关系在 `coverage` 中维护，旧链接显示归并提示。

## 工程维护

- src/app：真实静态页面与元数据；src/components：界面；src/lib：内容和评价。
- public：公开资源；scripts/public-assets.json：发布白名单；scripts：维护与检查。
- .github/workflows：验证与发布；docs：维护约定。out/.next/.preview 均为本地产物，不提交。
- 评分展示编号按全局排名生成，稳定ID和旧PDF/链接不变。未评分项目无排名。
- 字体仍使用原有本地子集，首页预载，不依赖第三方字体服务。
- Sitemap仅包含实际静态页面；hash论文详情暂不具备独立索引URL。
