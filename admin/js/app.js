(async function () {
  const session = await GBCAuth.requireAuth();
  if (!session) return;

  GBCSeed.init();

  const avatar = document.getElementById('user-avatar');
  if (avatar) avatar.textContent = session.iniciales || 'AD';

  let currentModule = 'proveedores';
  let editingId = null;
  let page = 1;
  const PAGE_SIZE = 10;
  let tableFilter = '';
  let docLines = [];
  let docEditingId = null;

  const main = document.getElementById('main-content');
  const pageTitle = document.getElementById('page-title');
  const pageSubtitle = document.getElementById('page-subtitle');

  document.querySelectorAll('.nav-link[data-module]').forEach((btn) => {
    btn.addEventListener('click', () => switchModule(btn.dataset.module));
  });

  document.getElementById('btn-logout').addEventListener('click', () => {
    window.location.href = '/logout';
  });

  document.getElementById('btn-config').addEventListener('click', () => {
    alert('Módulo de configuración — próximamente.');
  });

  document.getElementById('quick-search').addEventListener('input', (e) => {
    tableFilter = e.target.value.trim().toLowerCase();
    page = 1;
    renderCurrentModule();
  });

  function switchModule(id) {
    currentModule = id;
    editingId = null;
    docEditingId = null;
    docLines = [];
    page = 1;
    tableFilter = '';
    document.getElementById('quick-search').value = '';
    document.querySelectorAll('.nav-link[data-module]').forEach((l) => {
      l.classList.toggle('active', l.dataset.module === id);
    });
    const mod = GBCModules.MODULES[id];
    pageTitle.textContent = mod.title;
    pageSubtitle.textContent = mod.subtitle;
    renderCurrentModule();
  }

  function getItems(key) {
    return GBCStorage.load(key, []);
  }

  function saveItems(key, items) {
    GBCStorage.save(key, items);
  }

  function filterItems(items, mod) {
    if (!tableFilter) return items;
    const keys = mod.searchKeys || [];
    return items.filter((row) =>
      keys.some((k) => String(row[k] ?? '').toLowerCase().includes(tableFilter))
    );
  }

  function renderCurrentModule() {
    const mod = GBCModules.MODULES[currentModule];
    if (mod.layout === 'document') {
      renderDocumentModule(mod);
    } else {
      renderSplitModule(mod);
    }
  }

  function renderStats(stats) {
    return `<div class="stats-row">${stats.map((s) => `
      <div class="stat-card">
        <div>
          <div class="label">${s.label}</div>
          <div class="value">${s.value}</div>
        </div>
        <div class="stat-icon ${s.cls}">${s.icon}</div>
      </div>`).join('')}</div>`;
  }

  function renderFormFields(mod) {
    return mod.fields.map((f) => {
      if (f.type === 'radio') {
        const opts = (f.options || []).map((o) => `
          <label><input type="radio" name="${f.name}" value="${o}" ${o === (f.default || f.options[0]) ? 'checked' : ''}> ${o}</label>`).join('');
        return `<div class="form-group"><label>${f.label}</label><div class="radio-group">${opts}</div></div>`;
      }
      if (f.type === 'select') {
        const opts = (f.options || []).map((o) => `<option value="${o}">${o}</option>`).join('');
        return `<div class="form-group"><label>${f.label}</label><select name="${f.name}">${opts}</select></div>`;
      }
      const type = f.type || 'text';
      const extra = f.step ? ` step="${f.step}"` : '';
      return `<div class="form-group"><label>${f.label}</label>
        <input type="${type}" name="${f.name}" placeholder="${f.placeholder || ''}"${extra}></div>`;
    }).join('');
  }

  function cellValue(col, row) {
    if (col.render) return col.render(row);
    const v = row[col.key];
    if (col.type === 'badge') {
      const active = v === 'Activo';
      return `<span class="badge ${active ? 'badge-active' : 'badge-inactive'}">${v}</span>`;
    }
    if (col.type === 'dot') {
      const active = v === 'Activo';
      return `<span class="status-dot ${active ? '' : 'inactive'}">${v}</span>`;
    }
    if (col.type === 'med-badge') {
      const gen = (v || '').toLowerCase().includes('gen');
      return `<span class="badge ${gen ? 'badge-generic' : 'badge-commercial'}">${v || '—'}</span>`;
    }
    return v ?? '—';
  }

  function renderSplitModule(mod) {
    const all = getItems(mod.storageKey);
    const filtered = filterItems(all, mod);
    const total = filtered.length;
    const start = (page - 1) * PAGE_SIZE;
    const pageItems = filtered.slice(start, start + PAGE_SIZE);
    const stats = mod.stats(all);

    main.innerHTML = `
      ${renderStats(stats)}
      <div class="module-grid">
        <div class="panel-card form-panel">
          <div class="panel-header">
            <h3 id="form-title">${editingId ? 'Editar registro' : mod.formTitle}</h3>
            <p>${mod.formSubtitle}</p>
          </div>
          <div class="panel-body">
            <form id="entity-form">${renderFormFields(mod)}</form>
            <div class="form-actions">
              <button type="button" class="btn btn-outline" id="btn-cancel">Cancelar</button>
              <button type="button" class="btn btn-primary" id="btn-save">Guardar</button>
            </div>
          </div>
        </div>
        <div class="panel-card">
          <div class="table-toolbar">
            <div class="table-search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input type="search" id="table-search" placeholder="${mod.searchPlaceholder}" value="${tableFilter}">
            </div>
            <div class="toolbar-btns">
              <button type="button" class="btn btn-outline btn-sm" id="btn-export">Exportar</button>
              <button type="button" class="btn btn-accent btn-sm" id="btn-new">+ Nuevo</button>
            </div>
          </div>
          <div class="table-wrap">
            <table class="data-table">
              <thead><tr>
                ${mod.columns.map((c) => `<th>${c.label}</th>`).join('')}
                <th>Acciones</th>
              </tr></thead>
              <tbody id="table-body">${pageItems.length ? pageItems.map((row) => `
                <tr data-id="${row.id}">
                  ${mod.columns.map((c) => `<td>${cellValue(c, row)}</td>`).join('')}
                  <td><div class="action-btns">
                    <button type="button" class="btn-edit" data-id="${row.id}" title="Editar">✏️</button>
                    <button type="button" class="btn-delete" data-id="${row.id}" title="Eliminar">🗑️</button>
                  </div></td>
                </tr>`).join('') : `<tr><td colspan="${mod.columns.length + 1}" style="text-align:center;padding:2rem;color:#64748b">Sin registros</td></tr>`}
              </tbody>
            </table>
          </div>
          <div class="table-footer">
            <span>Mostrando ${pageItems.length} de ${total} registros</span>
            <div class="pagination">
              <button type="button" id="btn-prev" ${page <= 1 ? 'disabled' : ''}>Anterior</button>
              <button type="button" id="btn-next" ${start + PAGE_SIZE >= total ? 'disabled' : ''}>Siguiente</button>
            </div>
          </div>
        </div>
      </div>`;

    bindSplitEvents(mod, all);
    if (editingId) fillForm(mod, all.find((i) => i.id === editingId));
  }

  function bindSplitEvents(mod, all) {
    const form = document.getElementById('entity-form');
    document.getElementById('btn-save').onclick = () => saveEntity(mod, all);
    document.getElementById('btn-cancel').onclick = () => { editingId = null; renderCurrentModule(); };
    document.getElementById('btn-new').onclick = () => { editingId = null; form.reset(); document.getElementById('form-title').textContent = mod.formTitle; };
    document.getElementById('table-search').oninput = (e) => {
      tableFilter = e.target.value.trim().toLowerCase();
      page = 1;
      renderCurrentModule();
    };
    document.getElementById('btn-export').onclick = () => exportCsv(mod, all);
    document.getElementById('btn-prev').onclick = () => { if (page > 1) { page--; renderCurrentModule(); } };
    document.getElementById('btn-next').onclick = () => {
      const filtered = filterItems(all, mod);
      if (page * PAGE_SIZE < filtered.length) { page++; renderCurrentModule(); }
    };
    document.querySelectorAll('.btn-edit').forEach((b) => {
      b.onclick = () => { editingId = Number(b.dataset.id); renderCurrentModule(); };
    });
    document.querySelectorAll('.btn-delete').forEach((b) => {
      b.onclick = () => {
        if (!confirm('¿Eliminar este registro?')) return;
        const id = Number(b.dataset.id);
        saveItems(mod.storageKey, all.filter((i) => i.id !== id));
        if (editingId === id) editingId = null;
        renderCurrentModule();
      };
    });
  }

  function fillForm(mod, row) {
    if (!row) return;
    const form = document.getElementById('entity-form');
    mod.fields.forEach((f) => {
      const el = form.elements[f.name];
      if (!el) return;
      if (f.type === 'radio') {
        const r = form.querySelector(`input[name="${f.name}"][value="${row[f.name]}"]`);
        if (r) r.checked = true;
      } else if (el) {
        el.value = row[f.name] ?? '';
      }
    });
    document.getElementById('form-title').textContent = 'Editar registro';
  }

  function readForm(mod) {
    const form = document.getElementById('entity-form');
    const data = {};
    mod.fields.forEach((f) => {
      if (f.type === 'radio') {
        const checked = form.querySelector(`input[name="${f.name}"]:checked`);
        data[f.name] = checked ? checked.value : f.default;
      } else {
        data[f.name] = form.elements[f.name]?.value?.trim() ?? '';
      }
    });
    return data;
  }

  function saveEntity(mod, all) {
    const data = readForm(mod);
    const required = mod.fields.filter((f) => f.type !== 'radio' && !f.type).slice(0, 2);
    for (const f of required) {
      if (!data[f.name]) {
        alert(`El campo "${f.label}" es obligatorio.`);
        return;
      }
    }
    if (editingId) {
      const idx = all.findIndex((i) => i.id === editingId);
      if (idx >= 0) all[idx] = { ...all[idx], ...data };
    } else {
      all.push({ id: GBCStorage.nextId(all), ...data });
    }
    saveItems(mod.storageKey, all);
    editingId = null;
    renderCurrentModule();
  }

  function exportCsv(mod, all) {
    const cols = mod.columns;
    const header = cols.map((c) => c.label).join(',');
    const rows = all.map((r) => cols.map((c) => {
      const v = c.render ? c.render(r).replace(/<[^>]+>/g, '') : (r[c.key] ?? '');
      return `"${String(v).replace(/"/g, '""')}"`;
    }).join(','));
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${mod.id}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  /* ========== DOCUMENT MODULES ========== */

  const SAMPLE_ARTICLES = [
    { codigo: '1', articulo: 'Acetaminofén', tipo: 'Analgésico', precio: 100, descuento: 25 },
    { codigo: '2', articulo: 'Ibuprofeno', tipo: 'Antiinflamatorio', precio: 100, descuento: 30 },
    { codigo: '3', articulo: 'Advil', tipo: 'Antiinflamatorio', precio: 100, descuento: 40 },
    { codigo: '4', articulo: 'Amoxicilina', tipo: 'Antibiótico', precio: 100, descuento: 50 },
    { codigo: '5', articulo: 'Omeprazol', tipo: 'Gastro', precio: 100, descuento: 60 },
    { codigo: '6', articulo: 'Loratadina', tipo: 'Antialérgico', precio: 100, descuento: 70 },
    { codigo: '7', articulo: 'Paracetamol', tipo: 'Analgésico', precio: 100, descuento: 80 },
    { codigo: '8', articulo: 'Vitamina C', tipo: 'Vitamina', precio: 100, descuento: 90 },
    { codigo: '9', articulo: 'Aspirina', tipo: 'Analgésico', precio: 100, descuento: 95 },
    { codigo: '10', articulo: 'Metformina', tipo: 'Diabetes', precio: 100, descuento: 100 }
  ];

  function calcLineTotal(precio, cantidad, descuento, itbis = 0.18) {
    const sub = precio * cantidad;
    const desc = sub * (descuento / 100);
    const base = sub - desc;
    const tax = base * itbis;
    return { sub, desc, base, tax, total: base + tax };
  }

  function renderDocumentModule(mod) {
    const isCompra = mod.docType === 'compra';
    const num = isCompra
      ? `OC-${String(Date.now()).slice(-5)}-${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`
      : `FAC-2024-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;

    const clientes = getItems('clientes');
    const proveedores = getItems('proveedores');
    const productos = getItems('productos');

    const selectOpts = isCompra
      ? proveedores.map((p) => `<option value="${p.id}">${p.nombre}</option>`).join('')
      : clientes.map((c) => `<option value="${c.id}">${c.nombre} ${c.apellidos || ''}</option>`).join('');

    const lines = docLines.length ? docLines : SAMPLE_ARTICLES.map((a, i) => ({
      ...a,
      cantidad: isCompra ? 100 : 1,
      lote: 'L20260415',
      vence: '2027-04-15',
      presentacion: isCompra ? 'Tabletas efervescentes' : undefined,
      itbis: 18
    }));

    if (!docLines.length) docLines = lines;

    const totals = docLines.reduce((acc, l) => {
      const c = calcLineTotal(Number(l.precio), Number(l.cantidad || 1), Number(l.descuento || 0));
      acc.sub += c.base;
      acc.tax += c.tax;
      return acc;
    }, { sub: 0, tax: 0 });

    const grand = totals.sub + totals.tax;

    const cols = isCompra
      ? ['ID', 'Medicamento', 'Categoría', 'Presentación', 'Precio', 'ITBIS', 'Desc', 'Total', 'Lote', 'F. Vence', 'Cantidad']
      : ['Código', 'Artículo', 'Tipo', 'Precio', 'ITBIS', 'Descuento', 'Total'];

    main.innerHTML = `
      <div class="module-grid full-width doc-module">
        <div class="panel-card">
          <div class="doc-banner">
            <div class="doc-banner-left">
              <div class="doc-banner-icon">${isCompra ? '🛒' : '📄'}</div>
              <div>
                <h3>${isCompra ? 'Nueva orden de compra' : 'Nueva factura'}</h3>
                <p>${isCompra ? 'Registra la compra a tu proveedor.' : 'Completa los datos y agrega los artículos.'}</p>
              </div>
            </div>
            <div class="doc-number">
              <span>${isCompra ? 'N° ORDEN' : 'N° FACTURA'}</span>
              <strong>${num}</strong>
            </div>
          </div>
          <div class="doc-form-grid ${isCompra ? '' : ''}">
            <div class="form-group">
              <label>${isCompra ? 'Proveedor' : 'Cliente'}</label>
              <select id="doc-entity"><option value="">Selecciona ${isCompra ? 'proveedor' : 'cliente'}</option>${selectOpts}</select>
            </div>
            <div class="form-group"><label>Fecha</label><input type="date" id="doc-fecha"></div>
            ${isCompra ? `
            <div class="form-group"><label>RNC</label><input type="text" id="doc-rnc" value="00100000001"></div>
            <div class="form-group"><label>Tipo de Compra</label><select id="doc-tipo"><option value="">Selecciona tipo</option><option>Inventario</option><option>Urgente</option></select></div>
            <div class="form-group"><label>Condición de Pago</label><select id="doc-pago"><option>Contado</option><option>Crédito</option></select></div>
            ` : `
            <div class="form-group"><label>Tipo</label><select id="doc-tipo"><option>Contado</option><option>Crédito</option></select></div>
            <div class="form-group"><label>NCF</label><input type="text" id="doc-ncf" value="B0100000001"></div>
            `}
          </div>
          <div class="add-row">
            <div class="form-group">
              <label>Código artículo</label>
              <input type="text" id="line-codigo" placeholder="Buscar artículo..." list="productos-list">
              <datalist id="productos-list">${productos.map((p) => `<option value="${p.nombre}">`).join('')}</datalist>
            </div>
            <div class="form-group"><label>Cantidad</label><input type="number" id="line-cantidad" value="1" min="1"></div>
            <button type="button" class="btn btn-accent" id="btn-add-line">+ Agregar</button>
          </div>
          <div class="table-wrap">
            <table class="data-table">
              <thead><tr>${cols.map((c) => `<th>${c}</th>`).join('')}${isCompra ? '' : ''}</tr></thead>
              <tbody id="doc-lines-body">${docLines.map((l, i) => renderDocRow(l, i, isCompra)).join('')}</tbody>
            </table>
          </div>
          <div class="doc-footer">
            <div class="form-group">
              <label>Descripción / Notas</label>
              <textarea id="doc-notas" rows="4" placeholder="Información adicional..."></textarea>
            </div>
            <div class="totals-box">
              <div class="row"><span>Subtotal</span><span>RD$ ${totals.sub.toLocaleString('es-DO', { minimumFractionDigits: 0 })}</span></div>
              <div class="row"><span>ITBIS 18%</span><span>RD$ ${totals.tax.toLocaleString('es-DO', { minimumFractionDigits: 0 })}</span></div>
              <div class="row total"><span>${isCompra ? 'TOTAL COMPRA' : 'TOTAL'}</span><span>RD$ ${grand.toLocaleString('es-DO', { minimumFractionDigits: 0 })}</span></div>
            </div>
          </div>
          <div class="doc-actions">
            <button type="button" class="btn btn-outline" id="doc-cancel">✕ Cancelar</button>
            <button type="button" class="btn btn-outline" id="doc-print">🖨 Imprimir</button>
            <button type="button" class="btn btn-primary" id="doc-save">${isCompra ? '💾 Guardar orden' : '💾 Guardar factura'}</button>
          </div>
        </div>
      </div>`;

    const fecha = document.getElementById('doc-fecha');
    if (fecha) fecha.valueAsDate = new Date();

    document.getElementById('btn-add-line').onclick = () => {
      const nombre = document.getElementById('line-codigo').value.trim();
      const cantidad = Number(document.getElementById('line-cantidad').value) || 1;
      const prod = productos.find((p) => p.nombre.toLowerCase() === nombre.toLowerCase()) || {
        nombre: nombre || 'Artículo',
        tipo: 'General',
        precio: 100,
        presentacion: 'Unidades',
        lote: 'L' + Date.now(),
        vence: '2027-12-31'
      };
      docLines.push({
        codigo: String(docLines.length + 1),
        articulo: prod.nombre,
        tipo: prod.tipo || 'General',
        precio: Number(prod.precio) || 100,
        descuento: 15,
        cantidad,
        lote: prod.lote,
        vence: prod.vence,
        presentacion: prod.presentacion,
        itbis: 18
      });
      document.getElementById('line-codigo').value = '';
      renderCurrentModule();
    };

    document.getElementById('doc-cancel').onclick = () => { docLines = []; renderCurrentModule(); };
    document.getElementById('doc-print').onclick = () => window.print();
    document.getElementById('doc-save').onclick = () => saveDocument(mod, num, grand);
    document.querySelectorAll('.btn-remove-line').forEach((b) => {
      b.onclick = () => {
        docLines.splice(Number(b.dataset.idx), 1);
        renderCurrentModule();
      };
    });
  }

  function renderDocRow(l, i, isCompra) {
    const c = calcLineTotal(Number(l.precio), Number(l.cantidad || 1), Number(l.descuento || 0));
    if (isCompra) {
      return `<tr>
        <td>${i + 1}</td>
        <td>${l.articulo}</td>
        <td>${l.tipo}</td>
        <td>${l.presentacion || '—'}</td>
        <td>RD$ ${Number(l.precio).toLocaleString()}</td>
        <td>18%</td>
        <td class="discount-text">${l.descuento}%</td>
        <td>RD$ ${c.total.toLocaleString()}</td>
        <td>${l.lote || '—'}</td>
        <td>${GBCModules.formatDate(l.vence)}</td>
        <td>${l.cantidad} unidades <button type="button" class="btn-remove-line" data-idx="${i}" style="margin-left:4px;border:none;background:none;cursor:pointer">🗑</button></td>
      </tr>`;
    }
    return `<tr>
      <td>${l.codigo || i + 1}</td>
      <td>${l.articulo}</td>
      <td>${l.tipo}</td>
      <td>RD$ ${Number(l.precio).toFixed(0)}</td>
      <td>18%</td>
      <td class="discount-text">${l.descuento}%</td>
      <td>RD$ ${c.total.toLocaleString()} <button type="button" class="btn-remove-line" data-idx="${i}" style="border:none;background:none;cursor:pointer">🗑</button></td>
    </tr>`;
  }

  function saveDocument(mod, numero, total) {
    if (!docLines.length) {
      alert('Agrega al menos un artículo.');
      return;
    }
    const items = getItems(mod.storageKey);
    items.push({
      id: GBCStorage.nextId(items),
      numero,
      fecha: document.getElementById('doc-fecha')?.value || new Date().toISOString().slice(0, 10),
      lineas: [...docLines],
      total,
      notas: document.getElementById('doc-notas')?.value || '',
      creado: new Date().toISOString()
    });
    saveItems(mod.storageKey, items);
    alert(`${mod.docType === 'compra' ? 'Orden' : 'Factura'} guardada correctamente.`);
    docLines = [];
    renderCurrentModule();
  }

  switchModule('proveedores');
})();
