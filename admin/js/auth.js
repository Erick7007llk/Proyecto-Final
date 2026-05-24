(function (global) {
  function iniciales(nombre) {
    if (!nombre) return 'AD';
    const parts = nombre.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return nombre.slice(0, 2).toUpperCase();
  }

  async function fetchSession() {
    const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.loggedIn || data.usuario?.rol !== 'admin') return null;
    return {
      ...data.usuario,
      iniciales: iniciales(data.usuario.nombre)
    };
  }

  function isLocalFigmaCapture() {
    const host = global.location.hostname;
    return (host === 'localhost' || host === '127.0.0.1') &&
      new URLSearchParams(global.location.search).get('figma_capture') === '1';
  }

  async function requireAuth() {
    if (isLocalFigmaCapture()) {
      return {
        nombre: 'Administrador',
        correo: 'admin@gbc.com',
        rol: 'admin',
        iniciales: 'AD'
      };
    }
    try {
      const user = await fetchSession();
      if (!user) {
        global.location.replace('/login?error=Debes iniciar sesión con una cuenta de administrador');
        return null;
      }
      return user;
    } catch {
      global.location.replace('/login');
      return null;
    }
  }

  global.GBCAuth = {
    fetchSession,
    requireAuth,
    iniciales
  };
})(window);
