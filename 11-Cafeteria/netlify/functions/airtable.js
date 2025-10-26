// netlify/functions/airtable.js — híbrido (v1+v2) con GET/POST/PATCH

// ---- helpers comunes ----
const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });

function getEnv() {
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const token = process.env.AIRTABLE_TOKEN;
  if (!AIRTABLE_BASE_ID || !token) {
    throw new Error("Faltan variables de entorno (AIRTABLE_BASE_ID / AIRTABLE_TOKEN)");
  }
  return { AIRTABLE_BASE_ID, token };
}

async function airtableFetch(path, options = {}) {
  const { AIRTABLE_BASE_ID, token } = getEnv();
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(path)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json();
  return { res, data };
}

// ---- router común para v1 y v2 ----
async function handleRequest(method, urlString, bodyRaw) {
  try {
    const { searchParams } = new URL(urlString);
    // Puede ser nombre de tabla o ID tblXXXXXXXX
    const table = searchParams.get("table") || "Inventario de Cocina - Miminho";

    if (method === "GET") {
      const view = searchParams.get("view") || "Grid view";
      const pageSize = searchParams.get("pageSize") || "100";
      const offset = searchParams.get("offset") || "";

      const u = new URL(urlString);
      // construimos la query para Airtable
      const apiUrl = new URL(`https://api.airtable.com/v0/${getEnv().AIRTABLE_BASE_ID}/${encodeURIComponent(table)}`);
      apiUrl.searchParams.set("view", view);
      apiUrl.searchParams.set("pageSize", pageSize);
      if (offset) apiUrl.searchParams.set("offset", offset);

      const { token } = getEnv();
      const res = await fetch(apiUrl, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      return json(data, res.status);
    }

    if (method === "POST") {
      // bodyRaw puede venir string (v1) o ya ser texto (v2)
      const parsed = typeof bodyRaw === "string" ? JSON.parse(bodyRaw || "{}") : bodyRaw || {};
      const record = parsed.record;
      if (!record) return json({ error: "No se recibió el registro a crear" }, 400);

      const { res, data } = await airtableFetch(table, {
        method: "POST",
        body: JSON.stringify({ records: [{ fields: record }] }),
      });
      return json(data, res.status);
    }

    if (method === "PATCH") {
      const parsed = typeof bodyRaw === "string" ? JSON.parse(bodyRaw || "{}") : bodyRaw || {};
      const id = parsed.id;
      const fields = parsed.fields;
      if (!id || !fields) return json({ error: "Faltan id o fields para actualizar" }, 400);

      const { res, data } = await airtableFetch(table, {
        method: "PATCH",
        body: JSON.stringify({ records: [{ id, fields }] }),
      });
      return json(data, res.status);
    }

    return json({ error: "Método no soportado" }, 405);
  } catch (err) {
    return json({ error: String(err.message || err) }, 500);
  }
}

// ---- Soporte Functions v2 (ESM) ----
export default async (request, context) => {
  const method = request.method || "GET";
  const bodyRaw = method === "GET" ? undefined : await request.text();
  return handleRequest(method, request.url, bodyRaw);
};

// ---- Soporte Functions v1 (CJS-style) ----
export async function handler(event, context) {
  const method = event.httpMethod || "GET";
  const bodyRaw = event.body;
  const resp = await handleRequest(method, `https://example.com${event.path}?${event.rawQuery || event.queryStringParameters || ""}`, bodyRaw);

  // Adaptar Response (v2) al objeto que espera v1
  return {
    statusCode: resp.status,
    headers: Object.fromEntries(resp.headers.entries()),
    body: await resp.text(),
  };
}
