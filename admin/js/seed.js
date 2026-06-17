(function (global) {
  function init() {
    // Ya no se “siembran” módulos en localStorage.
    // Productos/Clientes/Proveedores/Empleados/Facturas/Compras vienen de MySQL via API.
  }

  global.GBCSeed = { init };
})(window);
