(function (global) {
  const PREFIX = 'gbc_admin_';

  function key(module) {
    return PREFIX + module;
  }

  function load(module, fallback) {
    try {
      const raw = localStorage.getItem(key(module));
      if (!raw) return typeof fallback === 'function' ? fallback() : (fallback ?? []);
      return JSON.parse(raw);
    } catch {
      return typeof fallback === 'function' ? fallback() : (fallback ?? []);
    }
  }

  function save(module, data) {
    localStorage.setItem(key(module), JSON.stringify(data));
  }

  function nextId(items) {
    if (!items.length) return 1;
    return Math.max(...items.map((i) => Number(i.id) || 0)) + 1;
  }

  global.GBCStorage = { load, save, nextId, key };
})(window);
