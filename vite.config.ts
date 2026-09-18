import { defineConfig, type Plugin } from "vitest/config";
import react from "@vitejs/plugin-react";

const ALLOW = new Set(["x.ai", "www.x.ai", "grok.com", "www.grok.com"]);

function identifyPlugin(): Plugin {
  async function handle(req: { method?: string; on: Function }, res: { statusCode: number; setHeader: Function; end: Function }, next: () => void) {
    if (req.method !== "POST") return next();
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => chunks.push(c));
    req.on("end", async () => {
      try {
        const body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}") as { url?: string };
        const url = (body.url || "").trim();
        const host = new URL(url).hostname;
        if (!ALLOW.has(host) || !new URL(url).pathname.startsWith("/bot/")) {
          res.statusCode = 400;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ error: "host" }));
          return;
        }
        const r = await fetch(url, {
          headers: { "User-Agent": "PokeBot-Field-Guide/4 identify", Accept: "text/html" },
          signal: AbortSignal.timeout(4000),
        });
        const html = (await r.text()).slice(0, 120_000);
        res.statusCode = 200;
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify({ url, html, status: r.status }));
      } catch {
        res.statusCode = 400;
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify({ error: "bad" }));
      }
    });
  }
  return {
    name: "identify-api",
    configureServer(server) {
      server.middlewares.use("/api/identify", handle);
    },
    configurePreviewServer(server) {
      server.middlewares.use("/api/identify", handle);
    },
  };
}

export default defineConfig({
  plugins: [react(), identifyPlugin()],
  server: { host: "127.0.0.1", port: 5173, strictPort: true },
  preview: { host: "127.0.0.1", port: 4173, strictPort: true },
  test: {
    environment: "jsdom",
    include: ["src/test/**/*.test.ts", "src/test/**/*.test.tsx"],
  },
});
