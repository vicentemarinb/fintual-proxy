export const config = { runtime: "edge" };

export default async function handler(req) {
  const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  const url = new URL(req.url);
  
  // Vercel rewrite nos trae la URL original en x-invoke-path o en la URL misma
  // /api/user_token → extraer "user_token"
  const parts = url.pathname.split("/api/");
  const fintualPath = parts.length > 1 ? "/" + parts[parts.length - 1] : "/";
  const fintualUrl = `https://fintual.cl/api${fintualPath}${url.search}`;

  try {
    const body = req.method !== "GET" ? await req.text() : undefined;
    const res = await fetch(fintualUrl, {
      method: req.method,
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body,
      redirect: "follow",
    });

    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("text/html")) {
      return new Response(
        JSON.stringify({ error: "auth_required", path: fintualPath, url: fintualUrl }),
        { status: 401, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    const data = await res.text();
    return new Response(data, {
      status: res.status,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
}
