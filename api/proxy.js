export const config = { runtime: "edge" };

export default async function handler(req) {
  const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Fintual-Cookie",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  const url = new URL(req.url);
  const parts = url.pathname.split("/api/");
  const fintualPath = parts.length > 1 ? "/" + parts[parts.length - 1] : "/";
  const cleanParams = new URLSearchParams(url.search);
  cleanParams.delete("path");
  const qs = cleanParams.toString();
  const fintualUrl = `https://fintual.cl/api${fintualPath}${qs ? "?" + qs : ""}`;

  // Tomar la cookie del header personalizado y reenviarla como Cookie real
  const cookieHeader = req.headers.get("x-fintual-cookie") || "";

  try {
    const body = req.method !== "GET" ? await req.text() : undefined;
    const headers = {
      "Content-Type": "application/json",
      "Accept": "application/json",
    };
    if (cookieHeader) headers["Cookie"] = cookieHeader;

    const res = await fetch(fintualUrl, {
      method: req.method,
      headers,
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
