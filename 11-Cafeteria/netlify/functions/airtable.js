// netlify/functions/airtable.js
export default async (req, context) => {
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const AIRTABLE_TABLE = req.query.table || "Inventario"; // cambia si tu tabla se llama distinto
    const AIRTABLE_VIEW  = req.query.view || "Grid view";   // cambia si usas otra vista
  
    const token = process.env.AIRTABLE_TOKEN;
  
    if (!token || !AIRTABLE_BASE_ID) {
      return new Response(JSON.stringify({ error: "Faltan variables de entorno" }), { status: 500 });
    }
  
    const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE)}`);
    url.searchParams.set("view", AIRTABLE_VIEW);
    url.searchParams.set("pageSize", "100");
    if (req.query.offset) url.searchParams.set("offset", req.query.offset);
  
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
  
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { "Content-Type":"application/json" }
    });
  };
