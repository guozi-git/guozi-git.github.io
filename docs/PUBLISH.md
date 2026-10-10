# 首次发布到 GitHub Pages

2026-10-10 本地准备记录：论文工厂已接入正式入口，尚未推送或部署。下方首次发布状态为历史记录，下一次发布前需重新确认实际 Pages 设置。新维护流程见 [论文维护流程](1010_论文维护流程_v1.txt)。

仓库：[guozi-git/guozi-website](https://github.com/guozi-git/guozi-website)，可见性 Public，默认分支 main。源码和工作流已上传，线上验证已通过。预定网站地址为 `https://guozi-git.github.io/guozi-website/`；Pages 尚未启用，此地址尚未发布。

## 上传源码（已完成，保留作为迁移参考）

1. 登录 GitHub，创建名为 guozi-website 的公开仓库。若通过 Git 推送，创建空仓库，不预先生成 README 或许可证。
2. 上传本目录中的源码，保留 .github/workflows 等点开头的配置文件。不要把 ZIP 文件本身或整个外层目录作为网站代码上传；package.json 应处于仓库根目录。
3. 建议使用 GitHub Desktop 的添加本地仓库及发布功能，或在本目录初始化 Git 后推送。首次提交使用你自己确认的 Git 姓名与邮箱，不使用环境中猜测的身份。
4. 不要上传原开发目录的 .git；这个快照有意不携带旧历史。不要上传 node_modules、out、.next、.preview 或 .env。

## 验证并发布

以下启用 Pages、开启变量和运行发布工作流的步骤，只在网站所有者明确同意发布后执行。当前仅允许源码维护和验证；不要创建 Pages 站点或设置 PAGES_ENABLED=true。

1. 上传后先查看 Actions → Verify static website，两个路径构建均应通过。
2. Settings → Pages → Build and deployment → Source 选择 GitHub Actions。
3. Settings → Secrets and variables → Actions → Variables 新建 PAGES_ENABLED，值设为 true。无需提供个人访问令牌。
4. Actions → Publish GitHub Pages → Run workflow，选择 main。
5. 发布成功后使用任务给出的真实网址访问。后续 main 提交会自动更新。

工作流使用仓库自动提供的 GITHUB_TOKEN。若账号要求重新登录、双重验证或组织批准，由账号持有者在 GitHub 界面完成。

## 本地模拟仓库路径（PowerShell）

```powershell
$env:NEXT_PUBLIC_BASE_PATH = '/guozi-website'
$env:NEXT_TELEMETRY_DISABLED = '1'
npm run build
npm start -- --port 3100 --base-path /guozi-website
```

另开终端运行：

```powershell
npm run test:static -- http://127.0.0.1:3100/guozi-website/
```

切回根路径时清空 NEXT_PUBLIC_BASE_PATH 并重新构建。公开网址由发布流程注入 NEXT_PUBLIC_SITE_URL，INDEX_SITE=true 开启索引。本地默认 noindex。

线上 Verify static website 已运行。根路径验证预览模式，仓库子路径还验证正式网址的 canonical、分享图 URL 与索引设置；构建这些文件不会发布网站。真实网站访问、第三方分享抓取和真实手机验收仍留待上线后完成。

## 更新与回退

发布开关关闭期间，推送 main 只运行验证，Publish GitHub Pages 会跳过。启用后，每次 main 提交都会触发发布。

若上线后需要回退，使用 git revert 撤销问题提交，再推送 main，让工作流重新部署；不改写仓库历史。关闭 PAGES_ENABLED 只停止后续部署，不会撤下已经上线的网站。需要下线时另行使用 Pages 设置中的取消发布操作。

参考：https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
