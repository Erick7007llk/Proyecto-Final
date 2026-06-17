const { pool } = require('../db');

async function ensureEmpleadoDefault() {
  const [rows] = await pool.query('SELECT id_empleado FROM empleado ORDER BY id_empleado LIMIT 1');
  if (rows.length) return rows[0].id_empleado;

  // Campos requeridos por el schema:
  // (nombre, cedula, cargo, nomina, fecha_ingreso, salario) + opcionales.
  const [result] = await pool.query(
    `INSERT INTO empleado
     (nombre, cedula, telefono, direccion, cargo, nomina, provincia, fecha_ingreso, salario,
      licencia_profesional, numero_registro, permisos_especiales)
     VALUES (?, ?, ?, ?, ?, ?, ?, CURDATE(), ?, NULL, NULL, NULL)`,
    [
      'Admin Sistema',
      '000-0000000-0',
      null,
      null,
      'Administrador',
      0,
      null,
      0
    ]
  );
  return result.insertId;
}

function normalizeLines(lines) {
  if (!Array.isArray(lines)) return [];
  return lines
    .map((l) => ({
      id_producto: Number(l.id_producto),
      cantidad: Number(l.cantidad || 1),
      precio: Number(l.precio || l.precio_unitario || l.precio_compra || 0),
      descuento: Number(l.descuento || 0),
      itbis: Number(l.itbis || 0)
    }))
    .filter((l) => l.id_producto && l.cantidad > 0 && l.precio >= 0);
}

async function createFactura({ id_cliente, fecha, ncf, lines }) {
  const idCliente = Number(id_cliente);
  if (!idCliente) throw new Error('Selecciona un cliente');
  const lineas = normalizeLines(lines);
  if (!lineas.length) throw new Error('Agrega al menos un artículo');

  const idEmpleado = await ensureEmpleadoDefault();

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [facturaRes] = await conn.query(
      `INSERT INTO factura (id_cliente, id_empleado, fecha, NCF)
       VALUES (?, ?, ?, ?)`,
      [idCliente, idEmpleado, fecha || new Date().toISOString().slice(0, 10), ncf || null]
    );
    const idFactura = facturaRes.insertId;

    for (const l of lineas) {
      // Triggers en detallefactura:
      // - verifica stock
      // - verifica vencimiento
      // - calcula subtotal
      // - descuenta stock
      await conn.query(
        `INSERT INTO detallefactura (id_factura, id_producto, cantidad, precio_unitario, subtotal)
         VALUES (?, ?, ?, ?, 0)`,
        [idFactura, l.id_producto, l.cantidad, l.precio]
      );
    }

    await conn.commit();
    return idFactura;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function createCompra({ id_proveedor, fecha_pedido, estado, total, lines }) {
  const idProveedor = Number(id_proveedor);
  if (!idProveedor) throw new Error('Selecciona un proveedor');
  const lineas = normalizeLines(lines);
  if (!lineas.length) throw new Error('Agrega al menos un artículo');

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [pedidoRes] = await conn.query(
      `INSERT INTO pedido_proveedor (id_proveedor, fecha_pedido, estado, total)
       VALUES (?, ?, ?, ?)`,
      [
        idProveedor,
        fecha_pedido || new Date(),
        (estado || 'pendiente').slice(0, 30),
        Number(total) || null
      ]
    );

    const idPedido = pedidoRes.insertId;

    for (const l of lineas) {
      const sub = l.precio * l.cantidad;
      const descuentoMonto = sub * (l.descuento / 100);
      const itbisMonto = (sub - descuentoMonto) * (l.itbis / 100);
      const subtotal = (sub - descuentoMonto) + itbisMonto;

      await conn.query(
        `INSERT INTO detalle_pedido_proveedor
         (id_pedido_proveedor, id_producto, cantidad, precio_compra, itbis, descuento, subtotal)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          idPedido,
          l.id_producto,
          l.cantidad,
          l.precio,
          l.itbis || 0,
          l.descuento || 0,
          subtotal
        ]
      );
    }

    await conn.commit();
    return idPedido;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function listFacturas(limit = 50) {
  const [rows] = await pool.query(
    `SELECT f.id_factura, f.fecha, f.NCF, c.nombre AS cliente, e.nombre AS empleado
     FROM factura f
     JOIN cliente c ON c.id_cliente = f.id_cliente
     JOIN empleado e ON e.id_empleado = f.id_empleado
     ORDER BY f.id_factura DESC
     LIMIT ?`,
    [Number(limit) || 50]
  );
  return rows;
}

async function listCompras(limit = 50) {
  const [rows] = await pool.query(
    `SELECT p.id_pedido_proveedor, p.fecha_pedido, p.estado, p.total, pr.nombre AS proveedor
     FROM pedido_proveedor p
     JOIN proveedor pr ON pr.id_proveedor = p.id_proveedor
     ORDER BY p.id_pedido_proveedor DESC
     LIMIT ?`,
    [Number(limit) || 50]
  );
  return rows;
}

module.exports = {
  createFactura,
  createCompra,
  listFacturas,
  listCompras
};

