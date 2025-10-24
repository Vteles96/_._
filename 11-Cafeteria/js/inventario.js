// --- Esqueleto para probar UI, sin Airtable aún ---
const state = {
    rows: [
      { id: "tmp1", Nombre: "Harina",   TipoCantidad: "sacos",   Cantidad: 12, Categoria: "Secos",     Actualizado: new Date().toISOString() },
      { id: "tmp2", Nombre: "Azúcar",   TipoCantidad: "bultos",  Cantidad: 4,  Categoria: "Secos",     Actualizado: new Date().toISOString() },
      { id: "tmp3", Nombre: "Huevos",   TipoCantidad: "unidades",Cantidad: 90, Categoria: "Frescos",   Actualizado: new Date().toISOString() },
      { id: "tmp4", Nombre: "Manteca",  TipoCantidad: "sacos",   Cantidad: 2,  Categoria: "Refriger.", Actualizado: new Date().toISOString() },
    ],
    sortBy: "Nombre",
    sortDir: "asc", // 'asc' | 'desc'
    q: "",
    tipo: ""
  };
  
  // Referencias al DOM (de tu inventario.html)
  const tbody = document.querySelector("#tbody");
  const total = document.querySelector("#total");
  const qInput = document.querySelector("#q");
  const tipoSelect = document.querySelector("#tipo");
  const btnReload = document.querySelector("#btnReload");
  const ths = document.querySelectorAll("th[data-sort]");
  
  // Eventos
  btnReload.addEventListener("click", () => {
    // En este paso solo recargamos los datos de prueba
    render();
  });
  qInput.addEventListener("input", (e) => {
    state.q = e.target.value.trim().toLowerCase();
    render();
  });
  tipoSelect.addEventListener("change", (e) => {
    state.tipo = e.target.value;
    render();
  });
  ths.forEach(th => {
    th.addEventListener("click", () => {
      const key = th.getAttribute("data-sort");
      if (state.sortBy === key) {
        state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
      } else {
        state.sortBy = key;
        state.sortDir = "asc";
      }
      render();
    });
  });
  
  // Render
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
        <td>${escapeHtml(row.TipoCantidad)}</td>
        <td>${row.Cantidad}</td>
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
  
  // Carga inicial
  render();
  
  console.log("[inventario] Esqueleto cargado correctamente");
  