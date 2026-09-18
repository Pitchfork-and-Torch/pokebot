const ALLOW = new Set(["x.ai", "www.x.ai", "grok.com", "www.grok.com"]);
const WINDOW_MS = 60_000;
const MAX_HITS = 20;
const hits = new Map<string, { n: number; t: number }>();

function allow(url: string): boolean {
  try {
    const u = new URL(url);
    return (u.protocol === "https:" || u.protocol === "http:") && ALLOW.has(u.hostname) && u.pathname.startsWith("/bot/");
  } catch {
    return false;
  }
}

function limited(ip: string): boolean {
  const now = Date.now();
  const cur = hits.get(ip);
  if (!cur || now - cur.t > WINDOW_MS) {
    hits.set(ip, { n: 1, t: now });
    return false;
  }
  cur.n += 1;
  return cur.n > MAX_HITS;
}

export const onRequestPost = async (ctx: { request: Request }): Promise<Response> => {
  const ip = ctx.request.headers.get("cf-connecting-ip") || ctx.request.headers.get("x-forwarded-for") || "local";
  if (limited(ip.split(",")[0]?.trim() || "local")) {
    return Response.json({ error: "rate" }, { status: 429 });
  }
  let body: { url?: string } = {};
  try {
    body = (await ctx.request.json()) as { url?: string };
  } catch {
    return Response.json({ error: "json" }, { status: 400 });
  }
  const url = (body.url || "").trim();
  if (!allow(url)) return Response.json({ error: "host" }, { status: 400 });
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 4000);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "PokeBot-Field-Guide/4 identify", Accept: "text/html" },
      redirect: "follow",
      signal: ac.signal,
    });
    const html = (await res.text()).slice(0, 120_000);
    return Response.json({ url, html, status: res.status });
  } catch {
    return Response.json({ error: "fetch" }, { status: 504 });
  } finally {
    clearTimeout(timer);
  }
};
