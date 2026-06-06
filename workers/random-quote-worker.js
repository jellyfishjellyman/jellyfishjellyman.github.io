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

const fallbackNicknames = [
  "月亮邮差", "云边散步者", "晚风收藏家", "海盐小熊", "银河值班员", "橘子汽水",
  "松间听雨", "半颗薄荷糖", "玻璃水母", "夜航纸飞机", "小镇观星人", "雨后蘑菇",
  "蒲公英旅客", "星星保管员", "风铃便利店", "奶油小行星", "雾里看花人", "春日逃课生",
  "蓝莓气泡", "猫耳耳机", "雪糕巡逻员", "凌晨三点半", "芝士月球", "晴天备用伞",
  "不吃香菜星人", "慢吞吞企鹅", "便利店诗人", "软糖工程师", "海边旧信箱", "咖啡续命师",
  "路过小水母", "树洞管理员", "云朵修理铺", "星河漫游者", "柠檬味晚霞", "蘑菇云游客",
  "西瓜小电台", "迷路的信号", "夏夜放映员", "纸船观察员", "奶茶不加冰", "宇宙小便签"
];

const fallbackNickname = () => `${pick(fallbackNicknames)}${Math.floor(100 + Math.random() * 900)}`;

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

const fromApihzNickname = async (env) => {
  if (!env.APIHZ_ID || !env.APIHZ_KEY) throw new Error("missing apihz credentials");
  const data = await fetchJson(`https://cn.apihz.cn/api/zici/sjwm.php?id=${env.APIHZ_ID}&key=${env.APIHZ_KEY}`);
  const nickname = data?.msg || data?.nickname || data?.name || data?.data?.msg || data?.data?.nickname || data?.data?.name;
  if (!nickname || String(data?.code || "") !== "200") throw new Error("bad apihz nickname");
  return {
    nickname: String(nickname).trim().slice(0, 20),
    source: "APIHZ"
  };
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
    if (request.method !== "GET") return json({ error: "method_not_allowed" }, { status: 405 });

    if (url.pathname === "/nickname") {
      try {
        return json(await fromApihzNickname(env));
      } catch (_) {
        return json({
          nickname: fallbackNickname(),
          source: "local"
        });
      }
    }

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
