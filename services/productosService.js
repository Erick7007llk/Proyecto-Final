const { pool } = require('../db');

const CAT_IMAGES = {
    Medicamentos: '/img/categorias/medicamentos.svg',
    Vitaminas: '/img/categorias/vitaminas.svg',
    Cardiovascular: '/img/categorias/cardiovascular.svg',
    Dermocosmética: '/img/categorias/dermocosmetica.svg',
    Bebés: '/img/categorias/bebes.svg',
    Higiene: '/img/categorias/higiene.svg',
    Equipos: '/img/categorias/equipos.svg'
};

const STOCK_WHERE = `
  cantidad > 0
  AND (fecha_vencimiento IS NULL OR fecha_vencimiento >= CURDATE())
`;

function mapProductoWeb(row) {
    const cantidad = Number(row.cantidad);
    return {
        id: row.id_producto,
        nombre: row.nombre,
        descripcion: row.tipo_medicamento || row.tipo_producto,
        precio: Number(row.precio),
        categoria: row.tipo_producto,
        imagen: CAT_IMAGES[row.tipo_producto] || '/img/categorias/default.svg',
        activo: 1,
        stock: cantidad,
        lote: row.lote,
        fecha_vencimiento: row.fecha_vencimiento
    };
}

function mapProductoAdmin(row) {
    return {
        id: row.id_producto,
        nombre: row.nombre,
        tipo: row.tipo_producto,
        precio: Number(row.precio),
        cantidad: Number(row.cantidad),
        lote: row.lote || '',
        vence: row.fecha_vencimiento
            ? new Date(row.fecha_vencimiento).toISOString().slice(0, 10)
            : '',
        medicamento: row.tipo_medicamento || '',
        concentracion: '',
        presentacion: '',
        id_proveedor: row.id_proveedor
    };
}

async function getProductosWeb(categoria = null) {
    let sql = `
        SELECT id_producto, nombre, tipo_producto, precio, cantidad, lote,
               fecha_vencimiento, tipo_medicamento, id_proveedor
        FROM producto
        WHERE ${STOCK_WHERE}
    `;
    const params = [];

    if (categoria && categoria !== 'todos') {
        sql += ' AND tipo_producto = ?';
        params.push(categoria);
    }

    sql += ' ORDER BY tipo_producto, nombre';
    const [rows] = await pool.query(sql, params);
    return rows.map(mapProductoWeb);
}

async function getProductoById(id) {
    const [rows] = await pool.query(
        `SELECT * FROM producto WHERE id_producto = ? AND ${STOCK_WHERE}`,
        [id]
    );
    return rows[0] ? mapProductoWeb(rows[0]) : null;
}

async function listAdminProductos() {
    const [rows] = await pool.query(`
        SELECT id_producto, nombre, tipo_producto, precio, cantidad, lote,
               fecha_vencimiento, tipo_medicamento, id_proveedor
        FROM producto
        ORDER BY nombre
    `);
    return rows.map(mapProductoAdmin);
}

async function createProducto(data) {
    const idProveedor = Number(data.id_proveedor) || 1;
    const [result] = await pool.query(
        `INSERT INTO producto
         (nombre, tipo_producto, precio, cantidad, lote, fecha_vencimiento, tipo_medicamento, id_proveedor)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            (data.nombre || '').slice(0, 30),
            (data.tipo || 'Medicamentos').slice(0, 50),
            Number(data.precio) || 0,
            Number(data.cantidad) || 0,
            data.lote || null,
            data.vence || null,
            data.medicamento || null,
            idProveedor
        ]
    );
    return result.insertId;
}

async function updateProducto(id, data) {
    await pool.query(
        `UPDATE producto SET
            nombre = ?, tipo_producto = ?, precio = ?, cantidad = ?,
            lote = ?, fecha_vencimiento = ?, tipo_medicamento = ?
         WHERE id_producto = ?`,
        [
            (data.nombre || '').slice(0, 30),
            (data.tipo || 'Medicamentos').slice(0, 50),
            Number(data.precio) || 0,
            Number(data.cantidad) || 0,
            data.lote || null,
            data.vence || null,
            data.medicamento || null,
            id
        ]
    );
}

async function deleteProducto(id) {
    await pool.query('DELETE FROM producto WHERE id_producto = ?', [id]);
}

module.exports = {
    CAT_IMAGES,
    getProductosWeb,
    getProductoById,
    listAdminProductos,
    createProducto,
    updateProducto,
    deleteProducto
};
