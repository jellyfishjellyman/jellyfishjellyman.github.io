# Jellyfish 的博客维护说明

这个仓库是 `https://gwbblog.top/` 的 Hugo 源码。远端仓库是：

```text
git@github.com:jellyfishjellyman/jellyfishjellyman.github.io.git
```

## 常用目录

- `content/posts/`：文章目录。
- `content/about.md`：关于页。
- `content/_index.md`：首页文字。
- `layouts/`：自定义页面模板。
- `static/css/custom.css`：自定义样式。
- `static/js/custom.js`：自定义交互脚本。
- `static/images/`：网站图片。

## 新建文章

最简单的方法是双击运行：

```text
newspost.bat
```

它会让你输入文章标题和路径 slug，然后在 `content/posts/` 下创建一个文章文件夹。

也可以手动创建：

```text
content/posts/my-post/index.md
```

文章模板：

```markdown
+++
title = "文章标题"
date = 2026-06-03T21:00:00+08:00
draft = false
+++

这里开始写正文。
```

如果文章有图片，把图片放进同一个文章文件夹，然后这样引用：

```markdown
![图片说明](demo.jpg)
```

## 本地预览

本仓库已经在 `.tools/hugo/` 放了一份 Hugo Extended。预览时用：

```powershell
cd D:\blog\myblog
.\.tools\hugo\hugo.exe server -D --bind 127.0.0.1 --baseURL http://localhost:1313/ --port 1313
```

然后打开：

```text
http://localhost:1313/
```

如果以后你把 Hugo 加入了系统 PATH，也可以简写为：

```powershell
hugo server -D
```

## 发布到网站

这个仓库已经配置了 GitHub Actions。只要把 `main` 分支推送到 GitHub，GitHub 会自动构建并部署到 GitHub Pages。

命令行流程：

```powershell
cd D:\blog\myblog
git status
git add .
git commit -m "新增文章：文章标题"
git push
```

GitHub Desktop 流程：

1. 打开 GitHub Desktop。
2. 选择本仓库：`D:\blog\myblog`。
3. 检查左侧改动列表。
4. 在 Summary 写本次改动说明。
5. 点击 `Commit to main`。
6. 点击 `Push origin`。

## 发布状态

推送后，到 GitHub 仓库的 `Actions` 页面查看部署进度。构建完成后，访问：

```text
https://gwbblog.top/
```
