(function (global) {
  function seedIfEmpty(module, data) {
    const existing = global.GBCStorage.load(module, null);
    if (!existing || !existing.length) {
      global.GBCStorage.save(module, data);
    }
  }

  const proveedores = [
    { id: 1, codigo: 'P-001', nombre: 'Adrian de Jesus', direccion: 'Villa Jagua, Calle 5G', telefono: '829-420-6043', correo: 'adrian@gbc.com', provincia: 'Azua', estado: 'Activo' },
    { id: 2, codigo: 'P-002', nombre: 'Distribuidora Médica RD', direccion: 'Av. Winston Churchill', telefono: '809-555-0100', correo: 'ventas@dmedrd.com', provincia: 'Santo Domingo', estado: 'Activo' },
    { id: 3, codigo: 'P-003', nombre: 'Farmacéutica del Cibao', direccion: 'Zona Industrial', telefono: '809-555-0200', correo: 'info@cibao.com', provincia: 'Santiago', estado: 'Inactivo' },
    { id: 4, codigo: 'P-004', nombre: 'Laboratorios Caribe', direccion: 'Autopista Duarte km 12', telefono: '809-555-0300', correo: 'caribe@lab.com', provincia: 'Santo Domingo', estado: 'Activo' },
    { id: 5, codigo: 'P-005', nombre: 'MedSupply SRL', direccion: 'Zona Franca', telefono: '809-555-0400', correo: 'info@medsupply.com', provincia: 'La Vega', estado: 'Activo' }
  ];

  const empleados = [
    { id: 1, codigo: 'E-001', nombre: 'Adrian', apellidos: 'de Jesus Vidal', cedula: '001-0000000-0', direccion: 'Villa Juana, Calle 5G', telefono: '829-428-6843', cargo: 'Auxiliar', horario: '7:00am - 12:00pm', sueldo: 5980, provincia: 'Santo Domingo', estado: 'Activo' },
    { id: 2, codigo: 'E-002', nombre: 'María', apellidos: 'González Pérez', cedula: '001-1234567-8', direccion: 'Los Prados', telefono: '809-555-1001', cargo: 'Farmacéutico Titular', horario: '8:00am - 5:00pm', sueldo: 45000, provincia: 'Santo Domingo', estado: 'Activo' }
  ];

  const clientes = [
    { id: 1, codigo: 'C-001', nombre: 'Juan', apellidos: 'Pérez', seguro: 'Senasa', sexo: 'M', telefono: '809-555-2001', estado: 'Activo' },
    { id: 2, codigo: 'C-002', nombre: 'Ana', apellidos: 'Martínez', seguro: 'Humano', sexo: 'F', telefono: '809-555-2002', estado: 'Activo' },
    { id: 3, codigo: 'C-003', nombre: 'Carlos', apellidos: 'Ruiz', seguro: 'Universal', sexo: 'M', telefono: '809-555-2003', estado: 'Inactivo' }
  ];

  const productosInventario = [
    { id: 1, nombre: 'Paracetamol 500 mg', tipo: 'Analgésico', precio: 45, cantidad: 120, lote: 'L20260401', vence: '2027-06-01', medicamento: 'Genérico', concentracion: '500 mg', presentacion: 'Tabletas' },
    { id: 2, nombre: 'Ibuprofeno 400 mg', tipo: 'Antiinflamatorio', precio: 68, cantidad: 85, lote: 'L20260402', vence: '2027-08-15', medicamento: 'Comercial', concentracion: '400 mg', presentacion: 'Tabletas' },
    { id: 3, nombre: 'Vitamina C 1000 mg', tipo: 'Vitamina', precio: 189, cantidad: 200, lote: 'L20260403', vence: '2028-01-20', medicamento: 'Genérico', concentracion: '1000 mg', presentacion: 'Efervescentes' },
    { id: 4, nombre: 'Losartán 50 mg', tipo: 'Cardiovascular', precio: 150, cantidad: 60, lote: 'L20260404', vence: '2027-03-10', medicamento: 'Genérico', concentracion: '50 mg', presentacion: 'Tabletas' },
    { id: 5, nombre: 'Pañales etapa 3', tipo: 'Bebés', precio: 210, cantidad: 45, lote: 'L20260405', vence: '2029-12-31', medicamento: 'Comercial', concentracion: '—', presentacion: 'Pack 32 u.' },
    { id: 6, nombre: 'Alcohol gel 500 ml', tipo: 'Higiene', precio: 89, cantidad: 150, lote: 'L20260406', vence: '2028-06-30', medicamento: 'Comercial', concentracion: '70%', presentacion: 'Frasco' }
  ];

  function init() {
    seedIfEmpty('proveedores', proveedores);
    seedIfEmpty('empleados', empleados);
    seedIfEmpty('productos', productosInventario);
    seedIfEmpty('clientes', clientes);
    seedIfEmpty('facturas', []);
    seedIfEmpty('compras', []);
  }

  global.GBCSeed = { init };
})(window);
