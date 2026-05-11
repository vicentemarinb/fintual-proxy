// Fintual API Proxy — Vercel Serverless Function
// Instrucciones: ver README abajo

const FINTUAL_BASE = "https://fintual.cl/api";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default async function handler(req, res) {
  // Preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, CORS);
    res.end();
    return;
  }

  // Construir URL destino: /api/proxy?path=/goals&user_token=...
  // O bien: /api/proxy/goals?user_token=...
  const pathParam = req.query.path || "";
  const queryParams = { ...req.query };
  delete queryParams.path;

  const qs = new URLSearchParams(queryParams).toString();
  const fintualUrl = `${FINTUAL_BASE}${pathParam}${qs ? "?" + qs : ""}`;

  try {
    const fintualRes = await fetch(fintualUrl, {
      method: req.method === "GET" ? "GET" : req.method,
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: req.method !== "GET" && req.method !== "OPTIONS" ? JSON.stringify(req.body) : undefined,
    });

    const data = await fintualRes.text();
    res.writeHead(fintualRes.status, { ...CORS, "Content-Type": "application/json" });
    res.end(data);
  } catch (e) {
    res.writeHead(500, CORS);
    res.end(JSON.stringify({ error: e.message }));
  }
}
