const repoOwner = "jellyfishjellyman";
const repoName = "jellyfishjellyman.github.io";
const branch = "main";
const repoApi = `https://api.github.com/repos/${repoOwner}/${repoName}`;
const tzOffset = "+08:00";
const draftKey = "publisher.currentDraft";
const tokenKey = "publisher.githubToken";

const state = {
  imageFiles: [],
  currentPostPath: "",
  currentPostSha: "",
  activePane: "write",
  saveTimer: 0
};

const els = {
  form: document.querySelector("#postForm"),
  token: document.querySelector("#token"),
  rememberToken: document.querySelector("#rememberToken"),
  loadPosts: document.querySelector("#loadPosts"),
  postPickerWrap: document.querySelector("#postPickerWrap"),
  postPicker: document.querySelector("#postPicker"),
  postPickerHelp: document.querySelector("#postPickerHelp"),
  title: document.querySelector("#title"),
  slug: document.querySelector("#slug"),
  category: document.querySelector("#category"),
  tags: document.querySelector("#tags"),
  body: document.querySelector("#body"),
  images: document.querySelector("#images"),
  imagePreview: document.querySelector("#imagePreview"),
  imageHint: document.querySelector("#imageHint"),
  draft: document.querySelector("#draft"),
  output: document.querySelector("#output"),
  writeTab: document.querySelector("#writeTab"),
  previewTab: document.querySelector("#previewTab"),
  publishTab: document.querySelector("#publishTab"),
  writePane: document.querySelector("#writePane"),
  previewPane: document.querySelector("#previewPane"),
  publishPane: document.querySelector("#publishPane"),
  preview: document.querySelector("#preview"),
  previewMeta: document.querySelector("#previewMeta"),
  clearDraft: document.querySelector("#clearDraft"),
  saveStatus: document.querySelector("#saveStatus"),
  currentPostLabel: document.querySelector("#currentPostLabel"),
  wordCount: document.querySelector("#wordCount"),
  imageCount: document.querySelector("#imageCount"),
  insertImageTrigger: document.querySelector("#insertImageTrigger"),
  jumpPreview: document.querySelector("#jumpPreview"),
  jumpPublish: document.querySelector("#jumpPublish"),
  backToWrite: document.querySelector("#backToWrite"),
  confirmDialog: document.querySelector("#confirmDialog"),
  confirmSummary: document.querySelector("#confirmSummary"),
  confirmPublish: document.querySelector("#confirmPublish"),
  publishButton: document.querySelector("#publishButton")
};

const savedToken = localStorage.getItem(tokenKey);
if (savedToken) {
  els.token.value = savedToken;
  els.rememberToken.checked = true;
}

restoreDraft();
renderAll("准备就绪");
registerServiceWorker();

function setStatus(message) {
  els.saveStatus.textContent = message;
}

function log(message) {
  els.output.textContent = message;
}

function authHeaders(token) {
  return {
    "Accept": "application/vnd.github+json",
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  };
}

async function gh(path, options = {}) {
  const token = els.token.value.trim();
  if (!token) throw new Error("缺少 GitHub Token。");
  const response = await fetch(`${repoApi}${path}`, {
    ...options,
    headers: { ...authHeaders(token), ...(options.headers || {}) }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || `GitHub API ${response.status}`);
  return payload;
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
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function tagsList(value) {
  return value
    .split(/[,，]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildMarkdown() {
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
  renderAll();
  scheduleDraftSave();
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

els.images.addEventListener("change", async () => {
  const files = Array.from(els.images.files || []);
  if (!files.length) return;
  setBusy(true, "正在压缩图片...");
  try {
    const prepared = [];
    for (const file of files) {
      prepared.push(await compressImage(file));
    }
    state.imageFiles.push(...prepared);
    const lines = prepared.map((file) => `![${file.name}](${file.name})`).join("\n");
    insertText(`\n${lines}\n`);
    renderImages();
    renderStats();
    setStatus("图片已准备");
    log(`已准备 ${prepared.length} 张图片。\n发布时会和文章一次提交。`);
  } catch (error) {
    log(`图片处理失败：${error.message}`);
  } finally {
    els.images.value = "";
    setBusy(false);
  }
});

els.insertImageTrigger.addEventListener("click", () => els.images.click());
els.jumpPreview.addEventListener("click", () => showPane("preview"));
els.jumpPublish.addEventListener("click", () => showPane("publish"));
els.backToWrite.addEventListener("click", () => showPane("write"));
els.writeTab.addEventListener("click", () => showPane("write"));
els.previewTab.addEventListener("click", () => showPane("preview"));
els.publishTab.addEventListener("click", () => showPane("publish"));

function safeFileName(name, fallbackExt = ".jpg") {
  const cleaned = name
    .split(/[\\/]/)
    .pop()
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^[.-]+|[.-]+$/g, "");
  return cleaned || `image-${Date.now()}${fallbackExt}`;
}

async function compressImage(file) {
  if (!file.type.startsWith("image/")) {
    return { name: safeFileName(file.name), file, blob: file, originalSize: file.size, previewUrl: URL.createObjectURL(file) };
  }
  const bitmap = await loadImageSource(file);
  const maxSide = 1800;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, width, height);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
  const baseName = safeFileName(file.name).replace(/\.[^.]+$/, "");
  const finalBlob = blob || file;
  return {
    name: `${baseName}.jpg`,
    file,
    blob: finalBlob,
    originalSize: file.size,
    previewUrl: URL.createObjectURL(finalBlob)
  };
}

async function loadImageSource(file) {
  if ("createImageBitmap" in window) return createImageBitmap(file);
  const url = URL.createObjectURL(file);
  try {
    return await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function renderImages() {
  els.imagePreview.innerHTML = "";
  state.imageFiles.forEach((image, index) => {
    const card = document.createElement("div");
    card.className = "image-card";
    const saved = image.originalSize ? Math.max(0, image.originalSize - image.blob.size) : 0;
    card.innerHTML = `
      <img src="${image.previewUrl}" alt="">
      <div>
        <strong>${escapeHtml(image.name)}</strong>
        <span>${formatBytes(image.blob.size)}${saved ? `，压缩 ${formatBytes(saved)}` : ""}</span>
      </div>
    `;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "secondary";
    remove.textContent = "移除";
    remove.addEventListener("click", () => {
      URL.revokeObjectURL(image.previewUrl);
      state.imageFiles.splice(index, 1);
      renderAll();
      scheduleDraftSave();
    });
    card.appendChild(remove);
    els.imagePreview.appendChild(card);
  });
  els.imageHint.textContent = state.imageFiles.length
    ? `${state.imageFiles.length} 张图片待发布。`
    : "图片会先压缩，再随文章一起提交。";
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inlineMarkdown(value) {
  return escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" rel="noopener noreferrer">$1</a>');
}

function markdownToHtml(markdown) {
  const lines = markdown.split("\n");
  const html = [];
  let inCode = false;
  let code = [];
  let list = [];
  let inNotice = false;
  let notice = [];

  const closeList = () => {
    if (!list.length) return;
    html.push(`<ul>${list.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</ul>`);
    list = [];
  };
  const closeNotice = () => {
    if (!notice.length) return;
    html.push(`<aside class="callout">${notice.map((item) => `<p>${inlineMarkdown(item)}</p>`).join("")}</aside>`);
    notice = [];
  };

  for (const line of lines) {
    if (line.includes("{{< notice >}}")) {
      closeList();
      inNotice = true;
      notice = [];
      continue;
    }
    if (line.includes("{{< /notice >}}")) {
      inNotice = false;
      closeNotice();
      continue;
    }
    if (inNotice) {
      if (line.trim()) notice.push(line);
      continue;
    }
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
      if (match) {
        const localImage = state.imageFiles.find((image) => image.name === match[2]);
        html.push(`<img alt="${escapeHtml(match[1] || match[2])}" src="${localImage ? localImage.previewUrl : escapeHtml(match[2])}">`);
      }
    } else {
      closeList();
      html.push(`<p>${inlineMarkdown(line)}</p>`);
    }
  }
  closeList();
  closeNotice();
  return html.join("\n");
}

function renderPreview() {
  const title = els.title.value.trim() || "未命名文章";
  const category = els.category.value || "其他";
  els.preview.innerHTML = `<h1>${escapeHtml(title)}</h1>${markdownToHtml(els.body.value.trim())}`;
  els.previewMeta.textContent = `${category} · ${countWords()} 字 · ${state.imageFiles.length} 图`;
}

function countWords() {
  const text = els.body.value.trim();
  if (!text) return 0;
  const cjk = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const latin = text.replace(/[\u4e00-\u9fff]/g, " ").trim().split(/\s+/).filter(Boolean).length;
  return cjk + latin;
}

function renderStats() {
  const title = els.title.value.trim();
  const slug = els.slug.value.trim();
  els.currentPostLabel.textContent = state.currentPostPath
    ? state.currentPostPath.replace("content/posts/", "").replace("/index.md", "")
    : (title || slug || "新文章");
  els.wordCount.textContent = String(countWords());
  els.imageCount.textContent = String(state.imageFiles.length);
}

function renderAll(status) {
  renderPreview();
  renderImages();
  renderStats();
  if (status) setStatus(status);
}

function showPane(mode) {
  state.activePane = mode;
  const map = {
    write: els.writePane,
    preview: els.previewPane,
    publish: els.publishPane
  };
  Object.entries(map).forEach(([name, pane]) => {
    pane.hidden = name !== mode;
    pane.classList.toggle("is-active", name === mode);
  });
  [
    [els.writeTab, "write"],
    [els.previewTab, "preview"],
    [els.publishTab, "publish"]
  ].forEach(([button, name]) => button.classList.toggle("is-active", name === mode));
  if (mode === "preview") renderPreview();
  if (mode === "publish") renderStats();
}

function scheduleDraftSave() {
  clearTimeout(state.saveTimer);
  setStatus("正在保存...");
  state.saveTimer = window.setTimeout(() => {
    saveDraft();
    setStatus("草稿已保存");
  }, 320);
}

function saveDraft() {
  const data = {
    title: els.title.value,
    slug: els.slug.value,
    category: els.category.value,
    tags: els.tags.value,
    body: els.body.value,
    draft: els.draft.checked,
    currentPostPath: state.currentPostPath
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
    state.currentPostPath = data.currentPostPath || "";
    setStatus("已恢复草稿");
  } catch {
    localStorage.removeItem(draftKey);
  }
}

["input", "change"].forEach((eventName) => {
  [els.title, els.slug, els.category, els.tags, els.body, els.draft].forEach((item) => {
    item.addEventListener(eventName, () => {
      renderAll();
      scheduleDraftSave();
    });
  });
});

els.rememberToken.addEventListener("change", () => {
  if (els.rememberToken.checked && els.token.value.trim()) {
    localStorage.setItem(tokenKey, els.token.value.trim());
    log("Token 已保存在当前设备。");
  } else {
    localStorage.removeItem(tokenKey);
    log("Token 已从当前设备移除。");
  }
});

els.token.addEventListener("change", () => {
  if (els.rememberToken.checked && els.token.value.trim()) {
    localStorage.setItem(tokenKey, els.token.value.trim());
  }
});

els.clearDraft.addEventListener("click", () => {
  if (!window.confirm("确认清空本地草稿？这不会删除 GitHub 上的文章。")) return;
  localStorage.removeItem(draftKey);
  state.currentPostPath = "";
  state.currentPostSha = "";
  state.imageFiles.forEach((image) => URL.revokeObjectURL(image.previewUrl));
  state.imageFiles = [];
  els.form.reset();
  if (localStorage.getItem(tokenKey)) {
    els.token.value = localStorage.getItem(tokenKey);
    els.rememberToken.checked = true;
  }
  renderAll("草稿已清空");
  log("本地草稿已清空。");
});

async function getRef() {
  return gh(`/git/ref/heads/${branch}`);
}

async function createBlob(content, encoding = "utf-8") {
  return gh("/git/blobs", {
    method: "POST",
    body: JSON.stringify({ content, encoding })
  });
}

async function createTree(baseTree, entries) {
  return gh("/git/trees", {
    method: "POST",
    body: JSON.stringify({ base_tree: baseTree, tree: entries })
  });
}

async function createCommit(message, treeSha, parentSha) {
  return gh("/git/commits", {
    method: "POST",
    body: JSON.stringify({ message, tree: treeSha, parents: [parentSha] })
  });
}

async function updateRef(commitSha) {
  return gh(`/git/refs/heads/${branch}`, {
    method: "PATCH",
    body: JSON.stringify({ sha: commitSha })
  });
}

async function blobBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || "").split(",")[1] || "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function publishOnce(basePath, markdown, title) {
  const ref = await getRef();
  const parentSha = ref.object.sha;
  const parentCommit = await gh(`/git/commits/${parentSha}`);
  const entries = [];

  const articleBlob = await createBlob(markdown, "utf-8");
  entries.push({ path: `${basePath}/index.md`, mode: "100644", type: "blob", sha: articleBlob.sha });

  for (const image of state.imageFiles) {
    const content = await blobBase64(image.blob);
    const blob = await createBlob(content, "base64");
    entries.push({ path: `${basePath}/${image.name}`, mode: "100644", type: "blob", sha: blob.sha });
  }

  const tree = await createTree(parentCommit.tree.sha, entries);
  const action = state.currentPostPath ? "更新文章" : "新增文章";
  const commit = await createCommit(`${action}: ${title}`, tree.sha, parentSha);
  await updateRef(commit.sha);
  return commit;
}

async function loadPosts() {
  setBusy(true, "正在加载旧文章...");
  log("正在加载文章列表...");
  const ref = await getRef();
  const commit = await gh(`/git/commits/${ref.object.sha}`);
  const tree = await gh(`/git/trees/${commit.tree.sha}?recursive=1`);
  const posts = tree.tree
    .filter((item) => item.type === "blob" && item.path.startsWith("content/posts/") && item.path.endsWith("/index.md"))
    .sort((a, b) => a.path.localeCompare(b.path));

  els.postPicker.innerHTML = '<option value="">新建文章</option>';
  for (const post of posts) {
    const option = document.createElement("option");
    option.value = post.path;
    option.textContent = post.path.replace("content/posts/", "").replace("/index.md", "");
    els.postPicker.appendChild(option);
  }
  els.postPickerWrap.hidden = false;
  els.postPickerHelp.textContent = `已加载 ${posts.length} 篇文章。`;
  setStatus("文章已加载");
  log(`已加载 ${posts.length} 篇文章。`);
}

function parseFrontMatter(markdown) {
  const match = markdown.match(/^\+\+\+\n([\s\S]*?)\n\+\+\+\n?([\s\S]*)$/);
  if (!match) return { params: {}, body: markdown };
  const params = {};
  for (const line of match[1].split("\n")) {
    const pair = line.match(/^(\w+)\s*=\s*(.*)$/);
    if (!pair) continue;
    const key = pair[1];
    const raw = pair[2].trim();
    if (raw.startsWith('"')) params[key] = raw.replace(/^"|"$/g, "");
    else if (raw === "true" || raw === "false") params[key] = raw === "true";
    else if (raw.startsWith("[")) params[key] = raw.replace(/^\[|\]$/g, "").split(",").map((item) => item.trim().replace(/^"|"$/g, "")).filter(Boolean);
    else params[key] = raw;
  }
  return { params, body: match[2].trim() };
}

function decodeBase64Utf8(value) {
  const binary = atob(value.replace(/\s/g, ""));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder("utf-8").decode(bytes);
}

async function loadPost(path) {
  if (!path) {
    state.currentPostPath = "";
    state.currentPostSha = "";
    els.form.reset();
    renderAll("新文章");
    return;
  }
  setBusy(true, "正在加载旧文章...");
  log("正在加载旧文章...");
  const file = await gh(`/contents/${path}`);
  const markdown = decodeBase64Utf8(file.content);
  const parsed = parseFrontMatter(markdown);
  const slug = path.replace("content/posts/", "").replace("/index.md", "");
  state.currentPostPath = path;
  state.currentPostSha = file.sha;
  els.title.value = parsed.params.title || slug;
  els.slug.value = slug;
  els.category.value = parsed.params.category || "其他";
  els.tags.value = Array.isArray(parsed.params.tags) ? parsed.params.tags.join(", ") : "";
  els.draft.checked = Boolean(parsed.params.draft);
  els.body.value = parsed.body;
  saveDraft();
  renderAll("旧文章已加载");
  log(`已加载：${path}`);
}

els.loadPosts.addEventListener("click", () => {
  loadPosts()
    .catch((error) => log(`加载失败：${error.message}`))
    .finally(() => setBusy(false));
});

els.postPicker.addEventListener("change", () => {
  loadPost(els.postPicker.value)
    .catch((error) => log(`加载失败：${error.message}`))
    .finally(() => setBusy(false));
});

els.form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const token = els.token.value.trim();
  const title = els.title.value.trim();
  if (!token) {
    showPane("publish");
    return log("缺少 GitHub Token。");
  }
  if (!title) {
    showPane("write");
    els.title.focus();
    return log("标题不能为空。");
  }

  if (els.rememberToken.checked) localStorage.setItem(tokenKey, token);
  else localStorage.removeItem(tokenKey);

  const confirmed = await confirmPublish();
  if (!confirmed) return log("已取消发布。");

  const slug = slugify(els.slug.value || title);
  const basePath = state.currentPostPath ? state.currentPostPath.replace("/index.md", "") : `content/posts/${slug}`;

  setBusy(true, "正在发布...");
  try {
    log("正在一次性提交文章和图片...");
    const markdown = buildMarkdown();
    const commit = await publishOnce(basePath, markdown, title);
    localStorage.removeItem(draftKey);
    state.currentPostPath = `${basePath}/index.md`;
    state.imageFiles.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    state.imageFiles = [];
    renderAll("发布成功");
    log(`发布成功：${basePath}/index.md\n提交：${commit.sha.slice(0, 7)}\nGitHub Pages 会自动部署，稍等后刷新网站即可。`);
  } catch (error) {
    log(`发布失败：${error.message}`);
    setStatus("发布失败");
  } finally {
    setBusy(false);
  }
});

function confirmPublish() {
  const title = els.title.value.trim();
  const mode = state.currentPostPath ? "更新旧文章" : "发布新文章";
  const draftText = els.draft.checked ? "草稿" : "公开文章";
  const summary = `${mode}「${title}」，状态为${draftText}，附带 ${state.imageFiles.length} 张图片。`;

  if (!els.confirmDialog || typeof els.confirmDialog.showModal !== "function") {
    return Promise.resolve(window.confirm(summary));
  }

  els.confirmSummary.textContent = summary;
  els.confirmDialog.showModal();
  return new Promise((resolve) => {
    const close = () => {
      els.confirmDialog.removeEventListener("close", close);
      resolve(els.confirmDialog.returnValue === "confirm");
    };
    els.confirmDialog.addEventListener("close", close);
  });
}

function setBusy(isBusy, status = "") {
  [els.publishButton, els.loadPosts].forEach((button) => {
    if (button) button.disabled = isBusy;
  });
  if (status) setStatus(status);
  if (!isBusy && !status) renderStats();
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/publisher/sw.js").catch(() => {
      setStatus("离线壳注册失败");
    });
  });
}
