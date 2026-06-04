# 手机发文 PWA

访问地址：

```text
https://gwbblog.top/publisher/
```

手机浏览器打开后，可以添加到主屏幕，作为轻量 App 使用。

## GitHub Token 权限

使用 fine-grained personal access token，建议只授予这个仓库：

```text
jellyfishjellyman/jellyfishjellyman.github.io
```

Repository permissions 至少需要：

```text
Contents: Read and write
```

不要把 Token 写进代码。页面只会在你勾选“只保存在这台手机”时写入浏览器 localStorage。

## 当前能力

- 手机端创建 Hugo 文章
- 分类、标签、草稿
- 加粗、斜体、二级标题、引用、列表、链接、代码块、分割线
- 摘要分隔和提示块短代码
- 编辑 / 预览双模式
- 本地自动草稿
- 图片插入到光标位置，并上传到同一文章目录
- 发布后由 GitHub Pages 自动部署

## 当前限制

- 上传多张图片会产生多个 GitHub commit
- 还没有文章列表、编辑旧文章和删除文章
- Token 保存在浏览器本地时，手机丢失会有风险
