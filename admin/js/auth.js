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


  async function requireAuth() {

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
