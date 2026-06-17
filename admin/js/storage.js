(function (global) {
  const PREFIX = 'gbc_admin_';
  const API_MODULES = ['productos', 'proveedores', 'empleados', 'clientes', 'facturas', 'compras'];
  const cache = {};

  function key(module) {
    return PREFIX + module;
  }

  function isApiModule(module) {
    return API_MODULES.includes(module);
  }

  async function refresh(module) {
    if (!isApiModule(module)) return null;
    const res = await fetch(`/api/admin/${module}`, { credentials: 'same-origin' });
    if (!res.ok) {
      if (res.status === 401) {
        window.location.replace('/login?error=Sesión expirada. Por favor inicia sesión de nuevo.');
        return [];
      }
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Error al cargar ${module} (${res.status})`);
    }
    const data = await res.json();
    cache[module] = Array.isArray(data) ? data : [];
    return cache[module];
  }

  /** Quita copias viejas en localStorage (semillas del admin antes de MySQL). */
  function clearLegacyLocalStorage() {
    API_MODULES.forEach((m) => {
      try {
        localStorage.removeItem(key(m));
      } catch (_) { /* ignore */ }
    });
  }

  async function initApi() {
    clearLegacyLocalStorage();
    await Promise.all(API_MODULES.map((m) =>
      refresh(m).catch((err) => {
        console.error(`[Admin] No se pudo cargar "${m}" desde la BD:`, err);
        cache[m] = [];
      })
    ));
  }

  function load(module, fallback) {
    if (isApiModule(module)) {
      return cache[module] ?? (typeof fallback === 'function' ? fallback() : (fallback ?? []));
    }
    try {
      const raw = localStorage.getItem(key(module));
      if (!raw) return typeof fallback === 'function' ? fallback() : (fallback ?? []);
      return JSON.parse(raw);
    } catch {
      return typeof fallback === 'function' ? fallback() : (fallback ?? []);
    }
  }

  function save(module, data) {
    if (isApiModule(module)) {
      cache[module] = data;
      return;
    }
    localStorage.setItem(key(module), JSON.stringify(data));
  }

  async function createRecord(module, data) {
    const res = await fetch(`/api/admin/${module}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(data)
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401) return window.location.replace('/login?error=Sesión expirada');
      throw new Error(body.error || 'Error al guardar');
    }
    await refresh(module);
    return body.id;
  }

  async function updateRecord(module, id, data) {
    const res = await fetch(`/api/admin/${module}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(data)
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401) return window.location.replace('/login?error=Sesión expirada');
      throw new Error(body.error || 'Error al actualizar');
    }
    await refresh(module);
  }

  async function deleteRecord(module, id) {
    const res = await fetch(`/api/admin/${module}/${id}`, {
      method: 'DELETE',
      credentials: 'same-origin'
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401) return window.location.replace('/login?error=Sesión expirada');
      throw new Error(body.error || 'Error al eliminar');
    }
    await refresh(module);
  }

  function nextId(items) {
    if (!items.length) return 1;
    return Math.max(...items.map((i) => Number(i.id) || 0)) + 1;
  }

  global.GBCStorage = {
    load,
    save,
    nextId,
    key,
    initApi,
    clearLegacyLocalStorage,
    refresh,
    createRecord,
    updateRecord,
    deleteRecord,
    isApiModule
  };
})(window);
