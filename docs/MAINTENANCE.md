# 内容维护

使用连接 guozi-git/guozi-website 的 Git 工作副本作为维护来源。修改前检查 git status 和 git remote -v，先同步远程修改，再编辑。不要用旧 ZIP 或原始开发目录覆盖当前仓库。

所有内容在 src/lib：profile.ts 为自我介绍，publications.ts 为论文，equipment.ts 为羽毛球装备，swimming.ts 为游泳记录，devices.ts 为设备，cs-collection.ts 与 cs-memories.ts 为 CS，hearthstone.ts 为炉石，posts.ts 为随笔。

新增随笔应提供唯一 id、标题与 paragraphs。日期只写真实日期，可省略；不依据文章内容推断年份。新增游泳记录使用真实日期与数值，不补造数据。

作品页面目前在 src/components/projects.tsx；样式在 src/styles/globals.css。

图片保存于 public，正文中通过 assetPath 生成路径，避免 GitHub Pages 子目录下失效。新增资源后同步 scripts/public-assets.json。CSS 背景通过相对路径导入并由构建器打包，无需重复加入发布清单。

构建会排除 public 中未列入清单的导出副本，源文件不会被删除。发布的仅为 out；源码本身也可能公开，因此不要向仓库添加私密原始文件。

修改后运行 README 中的检查。兴趣分类图保留原始示意图，可运行 `node scripts/generate-interest-images.mjs` 按已确认裁切重新生成三张 WebP；其他历史素材沿用已处理的图片。

提交前用 git diff --stat 和 git diff --cached 检查修改范围，确认未包含原始订单、价格截图、凭据或生成缓存。上传后查看 Actions → Verify static website，两个路径均通过才算验证完成。PAGES_ENABLED 关闭时上传源码不会发布网站；开启后 main 更新会自动部署。
