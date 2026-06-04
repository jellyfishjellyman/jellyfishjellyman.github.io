const repoOwner = "jellyfishjellyman";
const repoName = "jellyfishjellyman.github.io";
const branch = "main";
const apiBase = `https://api.github.com/repos/${repoOwner}/${repoName}/contents`;
const tzOffset = "+08:00";

const els = {
  form: document.querySelector("#postForm"),
  token: document.querySelector("#token"),
  rememberToken: document.querySelector("#rememberToken"),
  title: document.querySelector("#title"),
  slug: document.querySelector("#slug"),
  category: document.querySelector("#category"),
  tags: document.querySelector("#tags"),
  body: document.querySelector("#body"),
  images: document.querySelector("#images"),
  draft: document.querySelector("#draft"),
  output: document.querySelector("#output"),
  previewButton: document.querySelector("#previewButton"),
  previewDialog: document.querySelector("#previewDialog"),
  closePreview: document.querySelector("#closePreview"),
  preview: document.querySelector("#preview")
};

const savedToken = localStorage.getItem("publisher.githubToken");
if (savedToken) {
  els.token.value = savedToken;
  els.rememberToken.checked = true;
}

function log(message) {
  els.output.textContent = message;
}

function slugify(value) {
  const cleaned = value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]+/g, "")
    .replace(/^[._-]+|[._-]+$/g, "");
  return cleaned || `post-${formatDateSlug(new Date())}`;
}

function formatDateSlug(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

function formatHugoDate(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}${tzOffset}`;
}

function tomlEscape(value) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function tagsList(value) {
  return value
    .split(/[,，]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildMarkdown(slug) {
  const title = els.title.value.trim();
  const tags = tagsList(els.tags.value);
  const front = [
    "+++",
    `title = "${tomlEscape(title)}"`,
    `date = ${formatHugoDate(new Date())}`,
    `draft = ${els.draft.checked ? "true" : "false"}`,
    `category = "${tomlEscape(els.category.value)}"`
  ];
  if (tags.length) {
    front.push(`tags = [${tags.map((tag) => `"${tomlEscape(tag)}"`).join(", ")}]`);
  }
  front.push("+++", "");
  return `${front.join("\n")}${els.body.value.trim()}\n`;
}

function insertText(before, after = "") {
  const input = els.body;
  const start = input.selectionStart;
  const end = input.selectionEnd;
  const selected = input.value.slice(start, end);
  const next = input.value.slice(0, start) + before + selected + after + input.value.slice(end);
  input.value = next;
  const cursor = start + before.length + selected.length + after.length;
  input.focus();
  input.setSelectionRange(cursor, cursor);
}

document.querySelectorAll("[data-insert]").forEach((button) => {
  button.addEventListener("click", () => {
    const type = button.dataset.insert;
    if (type === "bold") insertText("**", "**");
    if (type === "h2") insertText("\n## ", "\n");
    if (type === "quote") insertText("\n> ", "\n");
    if (type === "hr") insertText("\n---\n");
    if (type === "color") insertText('{{< text color="#d35400" >}}', "{{< /text >}}");
    if (type === "size") insertText('{{< text size="20px" >}}', "{{< /text >}}");
  });
});

els.images.addEventListener("change", () => {
  const files = Array.from(els.images.files || []);
  if (!files.length) return;
  const lines = files.map((file) => `![${file.name}](${safeFileName(file.name)})`).join("\n");
  insertText(`\n${lines}\n`);
});

function safeFileName(name) {
  const cleaned = name.split(/[\\/]/).pop().replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^[.-]+|[.-]+$/g, "");
  return cleaned || `image-${Date.now()}.jpg`;
}

function markdownPreview(markdown) {
  return markdown
    .replace(/^---$/gm, "<hr>")
    .replace(/^## (.*)$/gm, "<h2>$1</h2>")
    .replace(/^> (.*)$/gm, "<blockquote>$1</blockquote>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/!\[(.*?)\]\((.*?)\)/g, '<img alt="$1" src="$2">')
    .replace(/\n{2,}/g, "</p><p>")
    .replace(/\n/g, "<br>");
}

els.previewButton.addEventListener("click", () => {
  const body = els.body.value.trim();
  els.preview.innerHTML = `<h1>${escapeHtml(els.title.value || "未命名文章")}</h1><p>${markdownPreview(escapeHtml(body))}</p>`;
  els.previewDialog.showModal();
});

els.closePreview.addEventListener("click", () => els.previewDialog.close());

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function githubPut(path, contentBase64, message, token) {
  const response = await fetch(`${apiBase}/${encodeURIComponentPath(path)}`, {
    method: "PUT",
    headers: {
      "Accept": "application/vnd.github+json",
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message,
      content: contentBase64,
      branch
    })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || `GitHub API ${response.status}`);
  }
  return payload;
}

function encodeURIComponentPath(path) {
  return path.split("/").map(encodeURIComponent).join("/");
}

function toBase64Utf8(value) {
  return btoa(unescape(encodeURIComponent(value)));
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      resolve(result.split(",")[1] || "");
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

els.form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const token = els.token.value.trim();
  const title = els.title.value.trim();
  if (!token) return log("缺少 GitHub Token。");
  if (!title) return log("标题不能为空。");

  if (els.rememberToken.checked) localStorage.setItem("publisher.githubToken", token);
  else localStorage.removeItem("publisher.githubToken");

  const slug = slugify(els.slug.value || title);
  const basePath = `content/posts/${slug}`;
  const files = Array.from(els.images.files || []);

  try {
    log("正在上传图片...");
    for (const file of files) {
      const name = safeFileName(file.name);
      const content = await fileToBase64(file);
      await githubPut(`${basePath}/${name}`, content, `上传图片：${name}`, token);
    }

    log("正在发布文章...");
    const markdown = buildMarkdown(slug);
    await githubPut(`${basePath}/index.md`, toBase64Utf8(markdown), `新增文章：${title}`, token);
    log(`发布成功：${basePath}/index.md\nGitHub Pages 会自动部署，稍等后刷新网站即可。`);
    els.form.reset();
    if (els.rememberToken.checked) els.token.value = token;
  } catch (error) {
    log(`发布失败：${error.message}`);
  }
});
