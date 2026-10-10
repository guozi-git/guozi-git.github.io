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

计划使用公开仓库 guozi-website 和 GitHub Pages 默认网址，完整网址由仓库所属账号决定。配置会从 GitHub 读取实际网址与路径，不需要在代码中填账号。

发布默认关闭。启用方法见 [发布说明](docs/PUBLISH.md)，日常内容编辑见 [维护说明](docs/MAINTENANCE.md)。仓库公开前仍应检查所有准备公开的文字和图片。

本目录是一份可独立构建的公开源码快照，不包含原始开发历史、聊天记录、原始订单截图、未使用的个人原图或本地机器配置。并非已经发布的网站。

## 内容与素材

公开源码不等于授予转载个人文章、照片或第三方素材的许可。本仓库暂未指定开源许可证；图片来源见 [素材说明](docs/ASSETS.md)。

论文工厂的导入、更新、备份和恢复步骤见 [维护流程](docs/1010_论文维护流程_v1.txt)。所有内容更新先本地校验与预览，经确认再发布。
