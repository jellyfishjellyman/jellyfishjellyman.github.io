from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
from datetime import datetime, timezone, timedelta
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[1]
POSTS_DIR = ROOT / "content" / "posts"
HUGO_EXE = ROOT / ".tools" / "hugo" / "hugo.exe"
TZ = timezone(timedelta(hours=8))
CATEGORIES = ["随感", "网上文案", "其他"]
IMAGE_MARKER = "{{images}}"


def slugify(value: str) -> str:
    value = value.strip().lower()
    value = re.sub(r"\s+", "-", value)
    value = re.sub(r"[^a-z0-9._-]+", "", value)
    value = value.strip("._-")
    if not value:
        value = "post-" + datetime.now(TZ).strftime("%Y%m%d-%H%M%S")
    return value[:80]


def toml_escape(value: str) -> str:
    return value.replace("\\", "\\\\").replace('"', '\\"')


def run_command(args: list[str]) -> tuple[int, str]:
    proc = subprocess.run(
        args,
        cwd=ROOT,
        text=True,
        encoding="utf-8",
        errors="replace",
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )
    return proc.returncode, proc.stdout.strip()


def git_status() -> str:
    code, output = run_command(["git", "status", "--short"])
    if code != 0:
        return output or "git status failed"
    return output or "clean"


def push_to_github() -> dict[str, object]:
    code, output = run_command(["git", "push", "origin", "main"])
    return {
        "command": "git push origin main",
        "code": code,
        "output": output,
        "published": code == 0,
        "gitStatus": git_status(),
    }


def build_post(data: dict[str, str], files: list[tuple[str, bytes]]) -> dict[str, object]:
    title = data.get("title", "").strip()
    body = data.get("body", "").replace("\r\n", "\n").strip()
    category = data.get("category", "").strip()
    tags = [tag.strip() for tag in re.split(r"[,，]", data.get("tags", "")) if tag.strip()]
    draft = data.get("draft", "false") == "true"
    publish = data.get("publish", "false") == "true"

    if not title:
        raise ValueError("标题不能为空")
    if not body:
        raise ValueError("正文不能为空")

    slug = slugify(data.get("slug", "") or title)
    post_dir = POSTS_DIR / slug
    if post_dir.exists():
        raise ValueError(f"文章路径已存在：content/posts/{slug}")
    post_dir.mkdir(parents=True, exist_ok=False)

    saved_images: list[str] = []
    for original_name, content in files:
        if not original_name or not content:
            continue
        safe_name = Path(original_name).name
        safe_name = re.sub(r"[^A-Za-z0-9._-]+", "-", safe_name).strip(".-")
        if not safe_name:
            safe_name = f"image-{len(saved_images) + 1}.jpg"
        target = post_dir / safe_name
        stem = target.stem
        suffix = target.suffix
        counter = 2
        while target.exists():
            target = post_dir / f"{stem}-{counter}{suffix}"
            counter += 1
        target.write_bytes(content)
        saved_images.append(target.name)

    now = datetime.now(TZ).isoformat(timespec="seconds")
    front = [
        "+++",
        f'title = "{toml_escape(title)}"',
        f"date = {now}",
        f"draft = {'true' if draft else 'false'}",
    ]
    if category:
        front.append(f'category = "{toml_escape(category)}"')
    if tags:
        front.append("tags = [" + ", ".join(f'"{toml_escape(tag)}"' for tag in tags) + "]")
    front.extend(["+++", ""])

    image_markdown = "\n".join(f"![{name}]({name})" for name in saved_images)
    if image_markdown and IMAGE_MARKER in body:
        body = body.replace(IMAGE_MARKER, image_markdown)
        image_tail = ""
    elif image_markdown:
        image_tail = "\n\n" + image_markdown
    else:
        image_tail = ""

    index = post_dir / "index.md"
    index.write_text("\n".join(front) + body + image_tail + "\n", encoding="utf-8")

    hugo_cmd = [str(HUGO_EXE if HUGO_EXE.exists() else "hugo"), "--minify"]
    build_code, build_output = run_command(hugo_cmd)
    result: dict[str, object] = {
        "slug": slug,
        "path": str(index.relative_to(ROOT)).replace("\\", "/"),
        "images": saved_images,
        "buildCode": build_code,
        "buildOutput": build_output,
        "gitStatus": git_status(),
        "published": False,
        "committed": False,
    }

    if build_code != 0:
        return result

    if publish:
        msg = f"新增文章：{title}"
        commands = [
            ["git", "add", str(post_dir.relative_to(ROOT)).replace("\\", "/")],
            ["git", "commit", "-m", msg],
            ["git", "push", "origin", "main"],
        ]
        publish_logs = []
        for command in commands:
            code, output = run_command(command)
            publish_logs.append({"command": " ".join(command), "code": code, "output": output})
            if command[1] == "commit" and code == 0:
                result["committed"] = True
            if code != 0:
                break
        result["publishLogs"] = publish_logs
        result["published"] = bool(publish_logs and publish_logs[-1]["code"] == 0)
        result["gitStatus"] = git_status()

    return result


def parse_multipart(body: bytes, content_type: str) -> tuple[dict[str, str], list[tuple[str, bytes]]]:
    match = re.search(r"boundary=([^;]+)", content_type)
    if not match:
        raise ValueError("缺少 multipart boundary")
    boundary = match.group(1).strip().strip('"').encode()
    fields: dict[str, str] = {}
    files: list[tuple[str, bytes]] = []
    for part in body.split(b"--" + boundary):
        part = part.strip()
        if not part or part == b"--":
            continue
        header_blob, _, content = part.partition(b"\r\n\r\n")
        if not header_blob:
            continue
        content = content.removesuffix(b"\r\n")
        headers = header_blob.decode("utf-8", errors="replace")
        name_match = re.search(r'name="([^"]+)"', headers)
        if not name_match:
            continue
        name = name_match.group(1)
        file_match = re.search(r'filename="([^"]*)"', headers)
        if file_match:
            if file_match.group(1):
                files.append((file_match.group(1), content))
        else:
            fields[name] = content.decode("utf-8", errors="replace")
    return fields, files


INDEX_HTML = """<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>博客发布</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <main class="shell">
    <header class="top">
      <div>
        <p class="eyebrow">Hugo Publisher</p>
        <h1>发布博客</h1>
      </div>
      <a class="ghost" href="/status">状态</a>
    </header>

    <form id="postForm">
      <label>标题<input name="title" required autocomplete="off"></label>
      <label>文章路径<input name="slug" autocomplete="off" placeholder="留空则自动生成，例如 post-20260604-123000"></label>
      <p class="hint">文章路径是网页地址和文件夹名，只建议用英文、数字和短横线；不填也可以。</p>
      <div class="grid">
        <label>分类
          <select name="category">
            <option value="随感">随感</option>
            <option value="网上文案">网上文案</option>
            <option value="其他">其他</option>
          </select>
        </label>
        <label>标签<input name="tags" autocomplete="off" placeholder="用逗号分隔"></label>
      </div>
      <label>正文<textarea name="body" required spellcheck="false"></textarea></label>
      <p class="hint">图片默认放在正文最后；如果想指定位置，在正文里写 {{images}}。</p>
      <label>图片<input name="images" type="file" multiple accept="image/*"></label>
      <div class="actions">
        <label class="check"><input name="draft" type="checkbox" value="true"> 保存为草稿</label>
        <label class="check"><input name="publish" type="checkbox" value="true"> 保存后直接推送 GitHub</label>
      </div>
      <div class="buttonRow">
        <button type="submit">保存文章</button>
        <button type="button" class="secondary" id="pushButton">重试推送</button>
      </div>
    </form>
    <pre id="output" aria-live="polite"></pre>
  </main>
  <script src="/app.js"></script>
</body>
</html>
"""


STYLE_CSS = """
:root { color-scheme: light; font-family: "Microsoft YaHei", "Segoe UI", sans-serif; }
body { margin: 0; background: #f5f6f2; color: #1f2520; }
.shell { width: min(920px, calc(100% - 32px)); margin: 32px auto; }
.top { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 24px; }
.eyebrow { margin: 0 0 4px; color: #667066; font-size: 13px; text-transform: uppercase; }
h1 { margin: 0; font-size: 32px; font-weight: 700; }
form { display: grid; gap: 16px; }
label { display: grid; gap: 7px; font-size: 14px; color: #3d463e; }
input, textarea, select { box-sizing: border-box; width: 100%; border: 1px solid #c9cec7; border-radius: 6px; padding: 11px 12px; font: inherit; background: #fff; color: #151916; }
textarea { min-height: 360px; resize: vertical; line-height: 1.65; }
.hint { margin: -8px 0 0; color: #657166; font-size: 13px; line-height: 1.5; }
.grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.actions { display: flex; flex-wrap: wrap; gap: 14px; align-items: center; }
.check { display: flex; grid-template-columns: none; align-items: center; gap: 8px; }
.check input { width: auto; }
button, .ghost { border: 0; border-radius: 6px; padding: 12px 16px; background: #225b43; color: #fff; font: inherit; font-weight: 700; cursor: pointer; text-decoration: none; text-align: center; }
.buttonRow { display: flex; flex-wrap: wrap; gap: 12px; }
.secondary { background: #dde4dc; color: #253027; }
.ghost { background: #dde4dc; color: #253027; }
pre { min-height: 84px; margin-top: 18px; padding: 14px; overflow: auto; border-radius: 6px; background: #172019; color: #d8eadb; white-space: pre-wrap; }
@media (max-width: 680px) {
  .shell { width: min(100% - 24px, 920px); margin: 18px auto; }
  .top { align-items: flex-start; }
  h1 { font-size: 26px; }
  .grid { grid-template-columns: 1fr; }
  textarea { min-height: 300px; }
}
"""


APP_JS = """
const form = document.querySelector("#postForm");
const output = document.querySelector("#output");
const pushButton = document.querySelector("#pushButton");

function lastFailedLog(payload) {
  if (!payload.publishLogs) return null;
  return payload.publishLogs.find((item) => item.code !== 0) || null;
}

function formatResult(payload) {
  if (payload.error) return `失败：${payload.error}`;
  const lines = [
    `文章已保存：${payload.path}`,
    `Hugo 构建：${payload.buildCode === 0 ? "成功" : "失败"}`,
  ];
  if (payload.images && payload.images.length) {
    lines.push(`图片：${payload.images.join(", ")}`);
  }
  if (payload.publishLogs) {
    lines.push(`Git commit：${payload.committed ? "成功" : "未完成"}`);
    lines.push(`GitHub 推送：${payload.published ? "成功" : "失败"}`);
    const failed = lastFailedLog(payload);
    if (failed) {
      lines.push("");
      lines.push(`失败命令：${failed.command}`);
      lines.push(failed.output || "没有输出");
    }
  } else {
    lines.push("GitHub 推送：未勾选");
  }
  if (payload.buildCode !== 0 && payload.buildOutput) {
    lines.push("");
    lines.push(payload.buildOutput);
  }
  return lines.join("\\n");
}

function formatPushResult(payload) {
  const lines = [
    `GitHub 推送：${payload.published ? "成功" : "失败"}`,
    `命令：${payload.command}`,
  ];
  if (payload.output) lines.push("", payload.output);
  if (payload.gitStatus) lines.push("", `当前状态：${payload.gitStatus}`);
  return lines.join("\\n");
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  output.textContent = "正在保存...";
  const data = new FormData(form);
  if (!form.draft.checked) data.set("draft", "false");
  if (!form.publish.checked) data.set("publish", "false");
  try {
    const response = await fetch("/api/posts", { method: "POST", body: data });
    const payload = await response.json();
    output.textContent = formatResult(payload);
    if (response.ok && payload.buildCode === 0 && (!payload.publishLogs || payload.published)) form.reset();
  } catch (error) {
    output.textContent = String(error);
  }
});

pushButton.addEventListener("click", async () => {
  output.textContent = "正在推送...";
  try {
    const response = await fetch("/api/push", { method: "POST" });
    const payload = await response.json();
    output.textContent = formatPushResult(payload);
  } catch (error) {
    output.textContent = String(error);
  }
});
"""


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt: str, *args: object) -> None:
        sys.stderr.write("[%s] %s\n" % (self.log_date_time_string(), fmt % args))

    def send_text(self, text: str, content_type: str = "text/html; charset=utf-8") -> None:
        encoded = text.encode("utf-8")
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def send_json(self, payload: object, status: HTTPStatus = HTTPStatus.OK) -> None:
        encoded = json.dumps(payload, ensure_ascii=False, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def do_GET(self) -> None:
        path = urlparse(self.path).path
        if path == "/":
            self.send_text(INDEX_HTML)
        elif path == "/style.css":
            self.send_text(STYLE_CSS, "text/css; charset=utf-8")
        elif path == "/app.js":
            self.send_text(APP_JS, "application/javascript; charset=utf-8")
        elif path == "/status":
            self.send_json({
                "root": str(ROOT),
                "postsDir": str(POSTS_DIR),
                "hugo": str(HUGO_EXE if HUGO_EXE.exists() else shutil.which("hugo") or "missing"),
                "gitStatus": git_status(),
            })
        else:
            self.send_error(HTTPStatus.NOT_FOUND)

    def do_POST(self) -> None:
        path = urlparse(self.path).path
        if path == "/api/push":
            self.send_json(push_to_github())
            return
        if path != "/api/posts":
            self.send_error(HTTPStatus.NOT_FOUND)
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            content_type = self.headers.get("Content-Type", "")
            fields, files = parse_multipart(self.rfile.read(length), content_type)
            result = build_post(fields, files)
            status = HTTPStatus.CREATED if result.get("buildCode") == 0 else HTTPStatus.ACCEPTED
            self.send_json(result, status)
        except Exception as exc:
            self.send_json({"error": str(exc)}, HTTPStatus.BAD_REQUEST)


def main() -> None:
    parser = argparse.ArgumentParser(description="Local Hugo blog publisher")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", default=8767, type=int)
    args = parser.parse_args()
    server = ThreadingHTTPServer((args.host, args.port), Handler)
    print(f"Publisher running at http://{args.host}:{args.port}/")
    print(f"Blog root: {ROOT}")
    server.serve_forever()


if __name__ == "__main__":
    main()
