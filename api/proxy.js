const FINTUAL_BASE = "https://fintual.cl/api";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const config = { runtime: "edge" };

export default async function handler(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  const url = new URL(req.url);
  const fintualPath = url.pathname.replace(/^\/api\/proxy/, "").replace(/^\/api/, "") || "/";
  const fintualUrl = `${FINTUAL_BASE}${fintualPath}${url.search}`;

  try {
    const body = req.method !== "GET" ? await req.text() : undefined;
    const fintualRes = await fetch(fintualUrl, {
      method: req.method,
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body,
    });
    const data = await fintualRes.text();
    return new Response(data, {
      status: fintualRes.status,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
}
