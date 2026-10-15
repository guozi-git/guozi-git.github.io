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

正式入口：https://guozi-git.github.io/ 。权威源码仓库：guozi-git/guozi-git.github.io。旧站 https://guozi-git.github.io/guozi-website/ 保留为历史兼容入口，不停用旧论文与PDF链接。配置从 GitHub Pages 读取实际网址与路径。

发布已启用；main 更新可触发自动部署，推送前须获得当次授权。构建、线上验证和回滚见 [发布说明](docs/PUBLISH.md)，日常内容编辑见 [维护说明](docs/MAINTENANCE.md)。仓库公开前仍应检查所有准备公开的文字和图片。

本目录是一份可独立构建的公开源码快照，不包含原始开发历史、聊天记录、原始订单截图、未使用的个人原图或本地机器配置。此目录是当前网站的维护源码；未推送的本地修改不代表已上线。

## 内容与素材

公开源码不等于授予转载个人文章、照片或第三方素材的许可。本仓库暂未指定开源许可证；图片来源见 [素材说明](docs/ASSETS.md)。

论文工厂的百分制数据、原文与补充材料更新、备份和恢复步骤见 [维护流程](docs/1013_论文维护流程_v2.txt)。所有内容更新先本地校验与预览，经确认再发布。

## 当前研究评价数据

2026-10-14 起，实际页面使用 `src/lib/research-reviews.json` 中的 80 项评价（匠心造 1 项、小作坊 79 项）。`factory-papers.json` 保留历史评分快照和原题、摘要、原文信息；页面覆盖历史评分，不展示旧分。`research-stage-paper.json` 保存新增阶段报告的原文信息。

后续维护评分须更新 `research-reviews.json` 并运行 `content:check`；旧 `papers:update` 命令只维护历史格式与原文元数据，不能替代新版评价更新。报告归并关系在 `coverage` 中维护，旧链接显示归并提示。

## 工程维护

- src/app：真实静态页面与元数据；src/components：界面；src/lib：内容和评价。
- public：公开资源；scripts/public-assets.json：发布白名单；scripts：维护与检查。
- .github/workflows：验证与发布；docs：维护约定。out/.next/.preview 均为本地产物，不提交。
- 评分展示编号按全局排名生成，稳定ID和旧PDF/链接不变。未评分项目无排名。
- 字体仍使用原有本地子集，首页预载，不依赖第三方字体服务。
- Sitemap仅包含实际静态页面；hash论文详情暂不具备独立索引URL。

等级说明固定展开；S/C/O 等级从高到低展示，待核验/待定放在末尾。

首页地球使用同一静态资源进行预载和显示，不重复下载。论文工厂入口与两房间按需加载，房间入口悬停、聚焦、按下时提前准备内容。首页完成加载后，仅在浏览器支持空闲调度、网络报告为良好 4G 且未开启省流量时预热工厂入口；不预下载论文 PDF。缺少相关浏览器能力时沿用点击加载。各板块下载期间提供加载提示。

分区模块加载失败时，内容区显示中文错误，保留外层导航。用户可返回上一级，或点击“重新加载此页”刷新并保留当前 hash；没有后台自动刷新或无穷重试。

首页头像使用预生成的320/640像素WebP及原始照片构成srcset，sizes随地球尺寸变化；原始照片继续用于自我介绍详情和高分辨率显示。替换头像后运行 `node scripts/generate-portrait.mjs` 更新衍生图（使用锁文件中Next.js已有的sharp，WebP quality 95），检查画质后重新构建。原图不覆盖，新增资源须登记白名单。

2026-10-15 新增两篇数学力学与非线性动力学论文，英文原题、摘要和 PDF 记录于 `src/lib/research-additional-papers.json`，专项评价并入 `research-reviews.json`。各记录的 `review_date` 优先于旧批次日期；核心贡献未给数值时只展示报告中的等级，不补造分数。稳定 ID 为 P092/P093，展示编号随排名生成。

2026-10-15 对小作坊79项开展期刊方向匹配修正：`journal_fit` 保存细分方向、判断依据、核验日期及官方来源键；`docs/journal-sources.json` 保存来源范围。`journal_position` 的三个字段在有 `journal_fit` 时显示为首选、备选、条件性候选，不表示固定期刊等级阶梯。该判断独立于既有评分，不修改目录分类、稳定ID及论文原文；未通过整稿门槛的条目仅记录条件性候选，详情继续不显示可投稿定位。P089不属于本次77+2范围。

本次匹配核对还依据英文原文纠正P072的模型名称（两条仿射直线之并与第三条直线，不含圆），并将P070方向表述为预设调度；不更改证明结论或分数。

期刊区展示约定：页面只读取 `journal_names` 的英文刊名，空值栏目隐藏；`journal_position` 与 `journal_fit` 保留详细核对依据，不在页面展开。后续新增论文须同步维护精简刊名。

展示补充：第三栏统一称“挑战目标”，允许保留主题适配的挑战刊物；只显示英文刊名，不显示改进要求或冲刺条件。无候选仍隐藏。
