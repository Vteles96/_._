// ===== Inventario: carga desde Netlify Function + Airtable =====

// Ajusta si tu tabla/vista en Airtable tienen otros nombres:
const TABLE = "tblKLu27fgxF3QCBo";   // <-- pon aquí el nombre exacto de tu tabla
const VIEW  = "Grid view Normalizada";    // <-- o la vista que uses

const state = {
  rows: [],
  sortBy: "Nombre",
  sortDir: "asc",
  q: "",
  tipo: ""
};

window.inventoryState = state;

// DOM
const tbody = document.querySelector("#tbody");
const total = document.querySelector("#total");
const qInput = document.querySelector("#q");
const tipoSelect = document.querySelector("#tipo");
const btnReload = document.querySelector("#btnReload");
const ths = document.querySelectorAll("th[data-sort]");

// Eventos
btnReload.addEventListener("click", loadData);
qInput.addEventListener("input", (e) => { state.q = e.target.value.trim().toLowerCase(); render(); });
tipoSelect.addEventListener("change", (e) => { state.tipo = e.target.value; render(); });
ths.forEach(th => {
  th.addEventListener("click", () => {
    const key = th.getAttribute("data-sort");
    if (state.sortBy === key) state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
    else { state.sortBy = key; state.sortDir = "asc"; }
    render();
  });
});

// -------- Carga desde la Function --------
async function loadData() {
  // 1) Trae todas las páginas de Airtable a través de la Function
  let url = `/.netlify/functions/airtable?table=${encodeURIComponent(TABLE)}&view=${encodeURIComponent(VIEW)}&pageSize=100`;
  let all = [];

  try {
    while (url) {
      const res = await fetch(url);
      if (!res.ok) {
        const txt = await res.text();
        console.error("Function error:", txt);
        alert("No se pudo cargar el inventario. Revisa la consola.");
        break;
      }
      const data = await res.json();
      all = all.concat(data.records || []);
      url = data.offset
        ? `/.netlify/functions/airtable?table=${encodeURIComponent(TABLE)}&view=${encodeURIComponent(VIEW)}&offset=${data.offset}`
        : null;
    }

    // 2) Mapea tus campos de Airtable -> columnas de la tabla
    state.rows = all.map(r => {
      const f = r.fields || {};
      return {
        id: r.id,
        Nombre: f.Producto || f.Nombre || "", // Producto = Nombre
        Marca: f.Marca || "",
        TipoCantidad: f.Tipo_Cantidad || f.TipoCantidad || f.Tipo || "",
        Cantidad: typeof f.Cantidad === "number" ? f.Cantidad : Number(f.Cantidad ?? f.Quantidade) || 0,
        Unidad: f.Unidad || "",
        Categoria: f.Categoria || "",
        Actualizado: f.UltimaActualizacion || f.Actualizado || r.createdTime || ""
      };
    });

    render();
  } catch (err) {
    console.error(err);
    alert("Error cargando datos. Mira la consola para más detalle.");
  }
}

// -------- Render de tabla/orden/filtros --------
function render() {
  let filtered = state.rows.slice();

  if (state.q) {
    filtered = filtered.filter(r => (r.Nombre || "").toLowerCase().includes(state.q));
  }
  if (state.tipo) {
    filtered = filtered.filter(r => (r.TipoCantidad || "").toLowerCase() === state.tipo.toLowerCase());
  }

  filtered.sort((a, b) => {
    const k = state.sortBy;
    const A = a[k] ?? "";
    const B = b[k] ?? "";
    if (typeof A === "number" && typeof B === "number") {
      return state.sortDir === "asc" ? A - B : B - A;
    }
    return state.sortDir === "asc"
      ? String(A).localeCompare(String(B))
      : String(B).localeCompare(String(A));
  });

  tbody.innerHTML = filtered.map(row => `
    <tr>
      <td>${escapeHtml(row.Nombre)}</td>
      <td>${escapeHtml(row.Marca)}</td>
      <td>${escapeHtml(row.TipoCantidad)}</td>
      <td>${row.Cantidad}</td>
      <td>${escapeHtml(row.Unidad)}</td>
      <td>${escapeHtml(row.Categoria)}</td>
      <td>${formatDate(row.Actualizado)}</td>
    </tr>
  `).join("");

  total.textContent = `${filtered.length} ítems`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m]));
}
function formatDate(d) {
  const t = new Date(d);
  return isNaN(t) ? String(d) : t.toLocaleString();
}

// Carga inicial desde Airtable
loadData();

console.log("[inventario] Conectado a Netlify Function / Airtable");
