const { pool } = require('../db');
const productosService = require('./productosService');

async function getOrCreateClienteInvitado(nombre, correo) {
    const nombreCorto = (nombre || 'Invitado Web').slice(0, 30);
    const [existing] = await pool.query(
        `SELECT id_cliente FROM cliente WHERE nombre = ? LIMIT 1`,
        [nombreCorto]
    );

    if (existing.length) return existing[0].id_cliente;

    const [result] = await pool.query(
        `INSERT INTO cliente (nombre, telefono, direccion, tipo_seguro, provincia)
         VALUES (?, ?, ?, ?, ?)`,
        [nombreCorto, null, (correo || '').slice(0, 100), 'Web', null]
    );
    return result.insertId;
}

async function crearPedidoWeb({ usuario, items, total, metodoPago = 'Web', direccion = 'Retiro en sucursal' }) {
    if (!items?.length) throw new Error('El carrito está vacío');

    const lineas = [];
    let totalCalculado = 0;

    for (const item of items) {
        const id = Number(item.id ?? item.id_producto);
        const cantidad = Number(item.qty ?? item.cantidad);
        if (!id || !cantidad || cantidad < 1) {
            throw new Error('Producto o cantidad inválida en el carrito');
        }

        const producto = await productosService.getProductoById(id);
        if (!producto) {
            throw new Error(`Producto #${id} no disponible o sin stock`);
        }
        if (producto.stock < cantidad) {
            throw new Error(`Stock insuficiente para "${producto.nombre}" (disponible: ${producto.stock})`);
        }

        const subtotal = producto.precio * cantidad;
        totalCalculado += subtotal;
        lineas.push({
            id_producto: id,
            cantidad,
            precio_unitario: producto.precio,
            subtotal
        });
    }

    const totalPedido = Number(total) || totalCalculado;
    const idCliente = usuario?.id_cliente
        || await getOrCreateClienteInvitado(usuario?.nombre, usuario?.correo);

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const [pedidoResult] = await conn.query(
            `INSERT INTO pedido_web
             (id_cliente, fecha_pedido, estado, metodo_pago, direccion_entrega, total)
             VALUES (?, NOW(), 'pendiente', ?, ?, ?)`,
            [idCliente, metodoPago.slice(0, 30), direccion.slice(0, 50), totalPedido]
        );

        const idPedido = pedidoResult.insertId;

        for (const linea of lineas) {
            await conn.query(
                `INSERT INTO detalle_pedido_web
                 (id_pedido_web, id_producto, cantidad, precio_unitario, subtotal)
                 VALUES (?, ?, ?, ?, ?)`,
                [idPedido, linea.id_producto, linea.cantidad, linea.precio_unitario, linea.subtotal]
            );

            const [stockResult] = await conn.query(
                `UPDATE producto SET cantidad = cantidad - ?
                 WHERE id_producto = ? AND cantidad >= ?`,
                [linea.cantidad, linea.id_producto, linea.cantidad]
            );

            if (stockResult.affectedRows === 0) {
                throw new Error(`Stock insuficiente para el producto #${linea.id_producto}`);
            }
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

module.exports = { crearPedidoWeb };
