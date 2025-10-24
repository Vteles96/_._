// netlify/functions/airtable.js — compatible con Netlify Functions v1 y v2 (híbrido)

// --- Lógica común ---
async function doFetch(params) {
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const token = process.env.AIRTABLE_TOKEN;

  const table    = params.table    || "Inventario";
  const view     = params.view     || "Grid view";
  const pageSize = params.pageSize || "100";
  const offset   = params.offset   || "";

  if (!token || !AIRTABLE_BASE_ID) {
    return new Response(JSON.stringify({ error: "Faltan variables de entorno" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(table)}`);
  url.searchParams.set("view", view);
  url.searchParams.set("pageSize", pageSize);
  if (offset) url.searchParams.set("offset", offset);

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();

  return new Response(JSON.stringify(data), {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}

// --- Soporte Functions v2 (ESM: export default(request, context)) ---
export default async (request, context) => {
  try {
    // Si request existe (v2), tomar params de la URL
    const { searchParams } = new URL(request.url);
    const params = {
      table:    searchParams.get("table"),
      view:     searchParams.get("view"),
      pageSize: searchParams.get("pageSize"),
      offset:   searchParams.get("offset"),
    };
    return await doFetch(params);
  } catch (err) {
    // Si por alguna razón falla (o Netlify ejecuta v1), retornamos error legible
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// --- Soporte Functions v1 (CJS: exports.handler = async (event, context)) ---
export async function handler(event, context) {
  try {
    const q = event && event.queryStringParameters ? event.queryStringParameters : {};
    const params = {
      table:    q.table,
      view:     q.view,
      pageSize: q.pageSize,
      offset:   q.offset,
    };
    const resp = await doFetch(params);
    // Adaptar el objeto Response (v2) al formato que espera v1
    const body = await resp.text();
    return {
      statusCode: resp.status,
      headers: Object.fromEntries(resp.headers.entries()),
      body,
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: String(err) }),
    };
  }
}
