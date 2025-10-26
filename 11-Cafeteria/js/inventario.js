document.addEventListener("DOMContentLoaded", () => {// ===== Inventario: carga desde Netlify Function + Airtable =====

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

// Formulario
const form = document.getElementById("invForm");
const fId = document.getElementById("f-id");
const fNombre = document.getElementById("f-nombre");
const fMarca = document.getElementById("f-marca");
const fTipo = document.getElementById("f-tipo");
const fCantidad = document.getElementById("f-cantidad");
const fUnidad = document.getElementById("f-unidad");
const fCategoria = document.getElementById("f-categoria");
const btnCrear = document.getElementById("btnCrear");
const btnActualizar = document.getElementById("btnActualizar");
const formMsg = document.getElementById("formMsg");

// Exponer referencias del formulario al objeto global (solo para depurar)
window.formElements = { fId, fNombre, fMarca, fTipo, fCantidad, fUnidad, fCategoria };

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

// Crear nuevo producto con el botón "Crear"
form.addEventListener("submit", (e) => {
  e.preventDefault();
  createRecord();
});

// Actualizar producto seleccionado
btnActualizar.addEventListener("click", (e) => {
  e.preventDefault();
  updateRecord();
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

// 📦 Construir el objeto con los datos del formulario (fuera de loadData)
function buildFieldsFromForm() {
  return {
    Producto: (fNombre.value || "").trim(),
    Marca: (fMarca.value || "").trim(),
    Tipo_Cantidad: (fTipo.value || "").trim(),
    Cantidad: fCantidad.value ? parseFloat(fCantidad.value) : 0,
    Unidad: (fUnidad.value || "").trim(),
    Categoria: (fCategoria.value || "").trim(),
    UltimaActualizacion: new Date().toISOString()
  };
}

// 🪄 Crear nuevo registro en Airtable
async function createRecord() {
  const fields = buildFieldsFromForm();
  if (!fields.Producto || Number.isNaN(fields.Cantidad)) {
    formMsg.textContent = "Completa Producto y Cantidad válidos.";
    return;
  }

  formMsg.textContent = "Creando…";
  const res = await fetch(`/.netlify/functions/airtable?table=${encodeURIComponent(TABLE)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ record: fields })
  });

  const data = await res.json();
  if (!res.ok) {
    console.error(data);
    formMsg.textContent = "❌ Error creando registro";
    return;
  }

  formMsg.textContent = "✅ Registro creado";
  form.reset();
  fId.value = "";
  btnActualizar.disabled = true;
  await loadData();
}

// ✏️ Actualizar registro existente en Airtable
async function updateRecord() {
  const id = fId.value;
  if (!id) {
    formMsg.textContent = "Selecciona una fila para actualizar.";
    return;
  }

  const fields = buildFieldsFromForm();
  formMsg.textContent = "Actualizando…";
  const res = await fetch(`/.netlify/functions/airtable?table=${encodeURIComponent(TABLE)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, fields })
  });

  const data = await res.json();
  if (!res.ok) {
    console.error(data);
    formMsg.textContent = "❌ Error actualizando registro";
    return;
  }

  formMsg.textContent = "✅ Registro actualizado";
  form.reset();
  fId.value = "";
  btnActualizar.disabled = true;
  await loadData();
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

    tbody.innerHTML = filtered.map(row => {
      let rowClass = "";
      if (row.Cantidad === 0) rowClass = "sin-stock";
      else if (row.Cantidad <= 1) rowClass = "bajo-stock";
    
      return `
        <tr class="${rowClass}" data-id="${row.id}">
          <td>${escapeHtml(row.Nombre)}</td>
          <td>${escapeHtml(row.Marca)}</td>
          <td>${escapeHtml(row.TipoCantidad)}</td>
          <td>${row.Cantidad}</td>
          <td>${escapeHtml(row.Unidad)}</td>
          <td>${escapeHtml(row.Categoria)}</td>
          <td>${formatDate(row.Actualizado)}</td>
        </tr>
      `;
    }).join("");
    // 💡 Cargar datos al formulario al hacer clic en una fila
    tbody.querySelectorAll("tr").forEach(tr => {
      tr.addEventListener("click", () => {
        const id = tr.getAttribute("data-id");
        const row = state.rows.find(r => r.id === id);
        if (!row) return;

        fId.value = row.id;
        fNombre.value = row.Nombre || "";
        fMarca.value = row.Marca || "";
        fTipo.value = (row.TipoCantidad || "").toLowerCase();
        fCantidad.value = row.Cantidad ?? 0;
        fUnidad.value = (row.Unidad || "").toLowerCase();
        fCategoria.value = row.Categoria || "";
        btnActualizar.disabled = false;
        formMsg.textContent = "✏️ Editando registro seleccionado…";
        // form.scrollIntoView({ behavior: "smooth", block: "start" }); // opcional
      });
    });
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

});
