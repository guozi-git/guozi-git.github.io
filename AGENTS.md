# 项目协作规则

- 本项目为果子的个人网站，仓库名称 guozi-website，计划使用 GitHub Pages 默认网址。
- 保留用户确认的个人经历、文字和图片，不编造内容。源码公开不代表第三方素材获得重新授权。
- 修改前检查 Git 状态及 README，保留已有改动；不自动推送或发布。
- 页面使用 Next.js App Router、React、TypeScript；数据在 src/lib，图片在 public。
- 新增公开资源时同步 scripts/public-assets.json；CSS 引用的图片由构建器打包。
- 完成后运行 typecheck、lint、format:check、content:check、build；交互或发布改动应运行对应浏览器检查。
- 不提交凭据、.env、node_modules、.next、out、.preview 或个人原始订单截图。
- 原始开发目录与历史不属于本公开快照，后续修改应同步到该快照或统一在本项目维护。

- 2026-10-15 工程维护：现有项目站已发布；不得沿用旧文档的未发布状态。正式迁移根域名、新仓库或改变公开URL前必须获得确认。
- 论文展示编号按全局已评分排名生成；内部ID、PDF路径、评分和历史hash不变。未评分不伪造排名。
- 发布前检查out中的SEO、资源和version；发布后须核对真实站点，详见docs/PUBLISH.md。
