const FINTUAL_BASE = "https://fintual.cl/api";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Fintual-Cookie",
};

export const config = { runtime: "edge" };

export default async function handler(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  const url = new URL(req.url);

  // Path: /api/user_token → /user_token, /api/goals → /goals, etc.
  let fintualPath = url.pathname.replace(/^\/api\/proxy/, "").replace(/^\/api/, "");
  if (!fintualPath || fintualPath === "/") fintualPath = "/";

  const qs = new URLSearchParams();
  url.searchParams.forEach((v, k) => qs.set(k, v));
  const qsStr = qs.toString();
  const fintualUrl = `${FINTUAL_BASE}${fintualPath}${qsStr ? "?" + qsStr : ""}`;

  // Cookie de sesión enviada en header personalizado
  const sessionCookie = req.headers.get("x-fintual-cookie") || "";

  try {
    const body = req.method !== "GET" ? await req.text() : undefined;
    const fintualRes = await fetch(fintualUrl, {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        ...(sessionCookie ? { "Cookie": sessionCookie } : {}),
      },
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
