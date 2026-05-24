(function (global) {
  const MODULES = {
    proveedores: {
      id: 'proveedores',
      title: 'Gestión de Proveedores',
      subtitle: 'Administra tus proveedores, contratos y estados.',
      storageKey: 'proveedores',
      layout: 'split',
      stats: (items) => {
        const activos = items.filter((i) => i.estado === 'Activo').length;
        const provincias = new Set(items.map((i) => i.provincia).filter(Boolean)).size;
        return [
          { label: 'Total Proveedores', value: items.length, icon: '🚚', cls: 'blue' },
          { label: 'Activos', value: activos, icon: '✓', cls: 'green' },
          { label: 'Inactivos', value: items.length - activos, icon: '✕', cls: 'red' },
          { label: 'Provincias', value: provincias, icon: '📍', cls: 'gray' }
        ];
      },
      formTitle: 'Nuevo proveedor',
      formSubtitle: 'Completa los datos para registrarlo.',
      fields: [
        { name: 'codigo', label: 'Código', placeholder: 'P-001' },
        { name: 'nombre', label: 'Nombre del Proveedor', placeholder: 'Adrian de Jesus' },
        { name: 'direccion', label: 'Dirección', placeholder: 'Villa Jagua, Calle 5G' },
        { name: 'telefono', label: 'Número Telefónico', placeholder: '829-420-6043' },
        { name: 'correo', label: 'Correo Electrónico', placeholder: 'proveedor@gbc.com', type: 'email' },
        { name: 'provincia', label: 'Provincia', placeholder: 'Azua' },
        { name: 'estado', label: 'Estado del Proveedor', type: 'radio', options: ['Activo', 'Inactivo'], default: 'Activo' }
      ],
      columns: [
        { key: 'codigo', label: 'Código' },
        { key: 'nombre', label: 'Nombre' },
        { key: 'direccion', label: 'Dirección' },
        { key: 'telefono', label: 'Teléfono' },
        { key: 'correo', label: 'Correo' },
        { key: 'provincia', label: 'Provincia' },
        { key: 'estado', label: 'Estado', type: 'badge' }
      ],
      searchPlaceholder: 'Buscar proveedor, código o provincia...',
      searchKeys: ['codigo', 'nombre', 'direccion', 'telefono', 'correo', 'provincia', 'estado']
    },
    empleados: {
      id: 'empleados',
      title: 'Gestión de Empleados',
      subtitle: 'Administra el personal, cargos y horarios.',
      storageKey: 'empleados',
      layout: 'split',
      stats: (items) => {
        const activos = items.filter((i) => i.estado === 'Activo').length;
        const cargos = new Set(items.map((i) => i.cargo).filter(Boolean)).size;
        return [
          { label: 'Total Empleados', value: items.length, icon: '👥', cls: 'gray' },
          { label: 'Activos', value: activos, icon: '✓', cls: 'green' },
          { label: 'Inactivos', value: items.length - activos, icon: '✕', cls: 'red' },
          { label: 'Cargos', value: cargos, icon: '💼', cls: 'blue' }
        ];
      },
      formTitle: 'Nuevo empleado',
      formSubtitle: 'Registra un nuevo miembro del equipo.',
      fields: [
        { name: 'codigo', label: 'Código', placeholder: 'E-001' },
        { name: 'nombre', label: 'Nombre', placeholder: 'Adrian' },
        { name: 'apellidos', label: 'Apellidos', placeholder: 'de Jesus Vidal' },
        { name: 'cedula', label: 'Cédula', placeholder: '001-0000000-0' },
        { name: 'direccion', label: 'Dirección', placeholder: 'Villa Juana, Calle 5G' },
        { name: 'telefono', label: 'Teléfono', placeholder: '829-428-6843' },
        { name: 'cargo', label: 'Cargo', placeholder: 'Auxiliar' },
        { name: 'horario', label: 'Horario', placeholder: '7:00am - 12:00pm' },
        { name: 'sueldo', label: 'Sueldo', placeholder: '5980', type: 'number' },
        { name: 'provincia', label: 'Provincia', placeholder: 'Santo Domingo' },
        { name: 'estado', label: 'Estado', type: 'radio', options: ['Activo', 'Inactivo'], default: 'Activo' }
      ],
      columns: [
        { key: 'codigo', label: 'Código' },
        { key: 'nombre', label: 'Nombre', render: (r) => `${r.nombre} ${r.apellidos || ''}`.trim() },
        { key: 'cedula', label: 'Cédula' },
        { key: 'telefono', label: 'Teléfono' },
        { key: 'cargo', label: 'Cargo' },
        { key: 'sueldo', label: 'Sueldo', render: (r) => r.sueldo ? `RD$ ${Number(r.sueldo).toLocaleString()}` : '—' },
        { key: 'horario', label: 'Horario' },
        { key: 'provincia', label: 'Provincia' },
        { key: 'estado', label: 'Estado', type: 'dot' }
      ],
      searchPlaceholder: 'Buscar empleado, cédula o cargo...',
      searchKeys: ['codigo', 'nombre', 'apellidos', 'cedula', 'cargo', 'telefono', 'provincia']
    },
    productos: {
      id: 'productos',
      title: 'Inventario de Productos',
      subtitle: 'Controla tu stock, lotes y vencimientos.',
      storageKey: 'productos',
      layout: 'split',
      stats: (items) => {
        const enStock = items.filter((i) => Number(i.cantidad) > 0).length;
        const now = new Date();
        const porVencer = items.filter((i) => {
          if (!i.vence) return false;
          const d = new Date(i.vence);
          const diff = (d - now) / (1000 * 60 * 60 * 24);
          return diff >= 0 && diff <= 90;
        }).length;
        const cats = new Set(items.map((i) => i.tipo).filter(Boolean)).size;
        return [
          { label: 'Productos', value: items.length, icon: '📦', cls: 'blue' },
          { label: 'En Stock', value: enStock, icon: '🌿', cls: 'green' },
          { label: 'Por Vencer', value: porVencer, icon: '⚠', cls: 'red' },
          { label: 'Categorías', value: cats, icon: '▦', cls: 'gray' }
        ];
      },
      formTitle: 'Nuevo producto',
      formSubtitle: 'Agrega un producto al inventario.',
      fields: [
        { name: 'nombre', label: 'Nombre del producto', placeholder: 'Paracetamol' },
        { name: 'tipo', label: 'Tipo de producto', placeholder: 'Analgésico' },
        { name: 'precio', label: 'Precio (RD$)', placeholder: '50.00', type: 'number', step: '0.01' },
        { name: 'cantidad', label: 'Cantidad', placeholder: '100', type: 'number' },
        { name: 'lote', label: 'Lote', placeholder: 'L20250415' },
        { name: 'vence', label: 'Fecha Vencimiento', type: 'date' },
        { name: 'medicamento', label: 'Tipo Medicamento', placeholder: 'Genérico' },
        { name: 'concentracion', label: 'Concentración', placeholder: '500 mg' },
        { name: 'presentacion', label: 'Presentación', placeholder: 'Tabletas' }
      ],
      columns: [
        { key: 'nombre', label: 'Producto' },
        { key: 'tipo', label: 'Tipo' },
        { key: 'precio', label: 'Precio', render: (r) => `RD$ ${Number(r.precio || 0).toFixed(0)}` },
        { key: 'cantidad', label: 'Cantidad' },
        { key: 'lote', label: 'Lote' },
        { key: 'vence', label: 'Vence', render: (r) => r.vence ? formatDate(r.vence) : '—' },
        { key: 'medicamento', label: 'Medicamento', type: 'med-badge' },
        { key: 'concentracion', label: 'Concentración' },
        { key: 'presentacion', label: 'Presentación' }
      ],
      searchPlaceholder: 'Buscar producto, lote o tipo...',
      searchKeys: ['nombre', 'tipo', 'lote', 'medicamento', 'presentacion']
    },
    clientes: {
      id: 'clientes',
      title: 'Gestión de Clientes',
      subtitle: 'Administra clientes, seguros y estados.',
      storageKey: 'clientes',
      layout: 'split',
      stats: (items) => {
        const activos = items.filter((i) => i.estado === 'Activo').length;
        const seguros = new Set(items.map((i) => i.seguro).filter(Boolean)).size;
        return [
          { label: 'Total Clientes', value: items.length, icon: '👥', cls: 'blue' },
          { label: 'Activos', value: activos, icon: '✓', cls: 'green' },
          { label: 'Inactivos', value: items.length - activos, icon: '✕', cls: 'red' },
          { label: 'Aseguradoras', value: seguros, icon: '❤', cls: 'gray' }
        ];
      },
      formTitle: 'Nuevo cliente',
      formSubtitle: 'Registra un nuevo cliente.',
      fields: [
        { name: 'codigo', label: 'Código', placeholder: 'C-001' },
        { name: 'nombre', label: 'Nombre', placeholder: 'Juan' },
        { name: 'apellidos', label: 'Apellidos', placeholder: 'Pérez' },
        { name: 'seguro', label: 'Seguro Médico', placeholder: 'Senasa' },
        { name: 'sexo', label: 'Sexo', type: 'select', options: ['M', 'F'] },
        { name: 'telefono', label: 'Teléfono', placeholder: '809-555-2001' },
        { name: 'estado', label: 'Estado del Cliente', type: 'radio', options: ['Activo', 'Inactivo'], default: 'Activo' }
      ],
      columns: [
        { key: 'codigo', label: 'Código' },
        { key: 'nombre', label: 'Nombre' },
        { key: 'apellidos', label: 'Apellidos' },
        { key: 'seguro', label: 'Seguro Médico' },
        { key: 'sexo', label: 'Sexo' },
        { key: 'telefono', label: 'Teléfono' },
        { key: 'estado', label: 'Estado', type: 'badge' }
      ],
      searchPlaceholder: 'Buscar cliente...',
      searchKeys: ['codigo', 'nombre', 'apellidos', 'seguro', 'telefono']
    },
    facturacion: {
      id: 'facturacion',
      title: 'Facturación',
      subtitle: 'Genera y gestiona facturas para clientes.',
      storageKey: 'facturas',
      layout: 'document',
      docType: 'factura'
    },
    compras: {
      id: 'compras',
      title: 'Compras a Proveedor',
      subtitle: 'Gestión de órdenes de compra y entradas de inventario.',
      storageKey: 'compras',
      layout: 'document',
      docType: 'compra'
    }
  };

  function formatDate(str) {
    if (!str) return '—';
    const d = new Date(str);
    if (isNaN(d)) return str;
    return d.toLocaleDateString('es-DO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  global.GBCModules = { MODULES, formatDate };
})(window);
