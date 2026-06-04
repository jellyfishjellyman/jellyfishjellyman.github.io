const repoOwner = "jellyfishjellyman";
const repoName = "jellyfishjellyman.github.io";
const branch = "main";
const apiBase = `https://api.github.com/repos/${repoOwner}/${repoName}/contents`;
const tzOffset = "+08:00";
const draftKey = "publisher.currentDraft";

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
  writeTab: document.querySelector("#writeTab"),
  previewTab: document.querySelector("#previewTab"),
  writePane: document.querySelector("#writePane"),
  previewPane: document.querySelector("#previewPane"),
  preview: document.querySelector("#preview"),
  clearDraft: document.querySelector("#clearDraft")
};

const savedToken = localStorage.getItem("publisher.githubToken");
if (savedToken) {
  els.token.value = savedToken;
  els.rememberToken.checked = true;
}

restoreDraft();
renderPreview();

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

function insertText(before, after = "", placeholder = "") {
  const input = els.body;
  const start = input.selectionStart;
  const end = input.selectionEnd;
  const selected = input.value.slice(start, end) || placeholder;
  input.value = input.value.slice(0, start) + before + selected + after + input.value.slice(end);
  input.focus();
  if (placeholder && start === end) {
    input.setSelectionRange(start + before.length, start + before.length + selected.length);
  } else {
    const cursor = start + before.length + selected.length + after.length;
    input.setSelectionRange(cursor, cursor);
  }
  saveDraft();
  renderPreview();
}

function insertLine(prefix, placeholder = "文字") {
  insertText(`\n${prefix}`, "\n", placeholder);
}

document.querySelectorAll("[data-insert]").forEach((button) => {
  button.addEventListener("click", () => {
    const type = button.dataset.insert;
    if (type === "h2") insertLine("## ", "小标题");
    if (type === "bold") insertText("**", "**", "重点");
    if (type === "italic") insertText("*", "*", "强调");
    if (type === "quote") insertLine("> ", "引用内容");
    if (type === "list") insertLine("- ", "列表项");
    if (type === "link") insertText("[", "](https://)", "链接文字");
    if (type === "code") insertText("\n```text\n", "\n```\n", "代码或原文");
    if (type === "hr") insertText("\n---\n");
    if (type === "more") insertText("\n<!--more-->\n");
    if (type === "callout") insertText('\n{{< notice >}}\n', '\n{{< /notice >}}\n', "提示内容");
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

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function inlineMarkdown(value) {
  return escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>");
}

function markdownToHtml(markdown) {
  const lines = markdown.split("\n");
  const html = [];
  let inCode = false;
  let code = [];
  let list = [];

  const closeList = () => {
    if (!list.length) return;
    html.push(`<ul>${list.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</ul>`);
    list = [];
  };

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (inCode) {
        html.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
        code = [];
        inCode = false;
      } else {
        closeList();
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      code.push(line);
      continue;
    }
    if (!line.trim()) {
      closeList();
      continue;
    }
    if (line.startsWith("## ")) {
      closeList();
      html.push(`<h2>${inlineMarkdown(line.slice(3))}</h2>`);
    } else if (line.startsWith("> ")) {
      closeList();
      html.push(`<blockquote>${inlineMarkdown(line.slice(2))}</blockquote>`);
    } else if (line.startsWith("- ")) {
      list.push(line.slice(2));
    } else if (line === "---") {
      closeList();
      html.push("<hr>");
    } else if (line === "<!--more-->") {
      closeList();
      html.push('<div class="more-marker">摘要分隔</div>');
    } else if (line.startsWith("![")) {
      closeList();
      const match = line.match(/^!\[(.*?)\]\((.*?)\)$/);
      if (match) html.push(`<img alt="${escapeHtml(match[1])}" src="${escapeHtml(match[2])}">`);
    } else if (line.includes("{{< notice >}}") || line.includes("{{< /notice >}}")) {
      closeList();
    } else {
      closeList();
      html.push(`<p>${inlineMarkdown(line)}</p>`);
    }
  }
  closeList();
  return html.join("\n");
}

function renderPreview() {
  const title = els.title.value.trim() || "未命名文章";
  els.preview.innerHTML = `<h1>${escapeHtml(title)}</h1>${markdownToHtml(els.body.value.trim())}`;
}

function showPane(mode) {
  const preview = mode === "preview";
  els.writePane.hidden = preview;
  els.previewPane.hidden = !preview;
  els.writeTab.classList.toggle("is-active", !preview);
  els.previewTab.classList.toggle("is-active", preview);
  if (preview) renderPreview();
}

els.writeTab.addEventListener("click", () => showPane("write"));
els.previewTab.addEventListener("click", () => showPane("preview"));

function saveDraft() {
  const data = {
    title: els.title.value,
    slug: els.slug.value,
    category: els.category.value,
    tags: els.tags.value,
    body: els.body.value,
    draft: els.draft.checked
  };
  localStorage.setItem(draftKey, JSON.stringify(data));
}

function restoreDraft() {
  const raw = localStorage.getItem(draftKey);
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    els.title.value = data.title || "";
    els.slug.value = data.slug || "";
    els.category.value = data.category || "随感";
    els.tags.value = data.tags || "";
    els.body.value = data.body || "";
    els.draft.checked = Boolean(data.draft);
  } catch {
    localStorage.removeItem(draftKey);
  }
}

["input", "change"].forEach((eventName) => {
  [els.title, els.slug, els.category, els.tags, els.body, els.draft].forEach((item) => {
    item.addEventListener(eventName, () => {
      saveDraft();
      renderPreview();
    });
  });
});

els.clearDraft.addEventListener("click", () => {
  localStorage.removeItem(draftKey);
  els.form.reset();
  renderPreview();
  log("本地草稿已清空。");
});

async function githubPut(path, contentBase64, message, token) {
  const response = await fetch(`${apiBase}/${encodeURIComponentPath(path)}`, {
    method: "PUT",
    headers: {
      "Accept": "application/vnd.github+json",
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ message, content: contentBase64, branch })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || `GitHub API ${response.status}`);
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
    reader.onload = () => resolve(String(reader.result || "").split(",")[1] || "");
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
    localStorage.removeItem(draftKey);
    log(`发布成功：${basePath}/index.md\nGitHub Pages 会自动部署，稍等后刷新网站即可。`);
    els.form.reset();
    if (els.rememberToken.checked) els.token.value = token;
    renderPreview();
  } catch (error) {
    log(`发布失败：${error.message}`);
  }
});
