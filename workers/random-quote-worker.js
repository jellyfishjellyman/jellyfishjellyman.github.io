const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, OPTIONS",
  "access-control-allow-headers": "content-type",
  "content-type": "application/json; charset=utf-8"
};

const json = (body, init = {}) => new Response(JSON.stringify(body), {
  ...init,
  headers: { ...corsHeaders, ...(init.headers || {}) }
});

const fetchJson = async (url) => {
  const response = await fetch(url, { headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`upstream ${response.status}`);
  return response.json();
};

const pick = (items) => items[Math.floor(Math.random() * items.length)];


const fromAlapiHitokoto = async (env) => {
  const data = await fetchJson(`https://v3.alapi.cn/api/hitokoto?token=${env.ALAPI_TOKEN}`);
  if (!data?.success || !data?.data?.hitokoto) throw new Error("bad alapi hitokoto");
  return {
    text: data.data.hitokoto,
    source: `${data.data.from || data.data.creator || "ALAPI"} · 一言`
  };
};

const fromAlapiShici = async (env) => {
  const data = await fetchJson(`https://v3.alapi.cn/api/shici?token=${env.ALAPI_TOKEN}`);
  if (!data?.success || !data?.data?.content) throw new Error("bad alapi shici");
  return {
    text: data.data.content,
    source: `${data.data.author || "佚名"}${data.data.origin ? "《" + data.data.origin + "》" : ""} · 诗词`
  };
};

const fromAlapiMingyan = async (env) => {
  const data = await fetchJson(`https://v3.alapi.cn/api/mingyan?token=${env.ALAPI_TOKEN}`);
  if (!data?.success || !data?.data?.content) throw new Error("bad alapi mingyan");
  return {
    text: data.data.content,
    source: `${data.data.author || "名人名言"} · ALAPI`
  };
};

const fromAlapiComment = async (env) => {
  const data = await fetchJson(`https://v3.alapi.cn/api/comment?token=${env.ALAPI_TOKEN}`);
  if (!data?.success || !data?.data?.comment_content) throw new Error("bad alapi comment");
  return {
    text: data.data.comment_content,
    source: `${data.data.title || "网易云乐评"} · ${data.data.comment_nickname || "ALAPI"}`
  };
};

const fromAlapiHistory = async (env) => {
  const data = await fetchJson(`https://v3.alapi.cn/api/eventHistory?token=${env.ALAPI_TOKEN}`);
  if (!data?.success || !Array.isArray(data.data) || !data.data.length) throw new Error("bad alapi history");
  const event = pick(data.data.slice(0, 12));
  return {
    text: `${event.date || "历史上的今天"}：${event.title}`,
    source: "ALAPI · 历史上的今天"
  };
};

const fromApihzJoke = async (env) => {
  const data = await fetchJson(`https://cn.apihz.cn/api/zici/xiaohua.php?id=${env.APIHZ_ID}&key=${env.APIHZ_KEY}`);
  const text = data?.content || data?.joke || data?.text || data?.msg || data?.data?.content || data?.data?.text || data?.data?.joke;
  if (!text) throw new Error("bad apihz joke");
  return {
    text,
    source: "接口盒子 · 随机笑话"
  };
};


export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
    if (request.method !== "GET") return json({ error: "method_not_allowed" }, { status: 405 });

    const sources = [
      ...(env.APIHZ_ID && env.APIHZ_KEY ? [fromApihzJoke] : []),
      ...(env.ALAPI_TOKEN ? [
        fromAlapiHitokoto,
        fromAlapiShici,
        fromAlapiMingyan,
        fromAlapiComment,
        fromAlapiHistory
      ] : [])
    ];

    if (!sources.length) return json({ error: "missing_upstream_credentials" }, { status: 500 });

    const ordered = [...sources].sort(() => Math.random() - 0.5);
    for (const source of ordered) {
      try {
        return json(await source(env));
      } catch (_) {
        continue;
      }
    }

    return json({ error: "all_sources_failed" }, { status: 502 });
  }
};
