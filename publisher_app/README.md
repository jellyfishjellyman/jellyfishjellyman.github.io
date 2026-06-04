# 本地发文工具

这是一个只负责发文的小工具。它会在本机启动网页表单，保存文章到 Hugo 的 `content/posts/`，并运行 Hugo 构建检查。

## 启动

```powershell
cd D:\blog\myblog
python .\publisher_app\server.py
```

打开：

```text
http://127.0.0.1:8767/
```

## 当前功能

- 创建 `content/posts/<slug>/index.md`
- 上传图片到同一个文章目录
- 自动写入标题、日期、分类、标签、草稿状态
- 保存后运行 `.\.tools\hugo\hugo.exe --minify`
- 可选执行 `git add`、`git commit`、`git push origin main`

## 手机端下一步

当前默认只监听 `127.0.0.1`，适合电脑本机使用。要让手机在同一 Wi-Fi 下访问，需要改成绑定局域网地址，并加访问密码，否则不建议开放。
