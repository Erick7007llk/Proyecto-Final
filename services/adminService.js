const { pool } = require('../db');
const productosService = require('./productosService');

async function listProveedores() {
    const [rows] = await pool.query(`
        SELECT id_proveedor, nombre, telefono, correo, direccion, RNC, provincia
        FROM proveedor ORDER BY nombre
    `);
    return rows.map(r => ({
        id: r.id_proveedor,
        codigo: r.id_proveedor,
        nombre: r.nombre,
        direccion: r.direccion || '',
        telefono: r.telefono || '',
        correo: r.correo || '',
        provincia: r.provincia || '',
        estado: 'Activo'
    }));
}

async function createProveedor(data) {
    const rnc = (data.rnc || `WEB${Date.now()}`).replace(/\D/g, '').slice(0, 20) || String(Date.now()).slice(-11);
    const [result] = await pool.query(
        `INSERT INTO proveedor (nombre, telefono, correo, direccion, RNC, provincia)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
            (data.nombre || '').slice(0, 30),
            data.telefono || null,
            data.correo || null,
            data.direccion || null,
            rnc,
            data.provincia || null
        ]
    );
    return result.insertId;
}

async function updateProveedor(id, data) {
    await pool.query(
        `UPDATE proveedor SET nombre = ?, telefono = ?, correo = ?, direccion = ?, provincia = ?
         WHERE id_proveedor = ?`,
        [
            (data.nombre || '').slice(0, 30),
            data.telefono || null,
            data.correo || null,
            data.direccion || null,
            data.provincia || null,
            id
        ]
    );
}

async function deleteProveedor(id) {
    await pool.query('DELETE FROM proveedor WHERE id_proveedor = ?', [id]);
}

async function listEmpleados() {
    const [rows] = await pool.query(`
        SELECT id_empleado, nombre, cedula, telefono, direccion, cargo, salario, provincia, fecha_ingreso
        FROM empleado ORDER BY nombre
    `);
    return rows.map(r => {
        const parts = (r.nombre || '').split(' ');
        return {
            id: r.id_empleado,
            codigo: r.id_empleado,
            nombre: parts[0] || r.nombre,
            apellidos: parts.slice(1).join(' '),
            cedula: r.cedula,
            direccion: r.direccion || '',
            telefono: r.telefono || '',
            cargo: r.cargo,
            horario: '—',
            sueldo: Number(r.salario),
            provincia: r.provincia || '',
            estado: 'Activo'
        };
    });
}

async function createEmpleado(data) {
    const nombreCompleto = `${data.nombre || ''} ${data.apellidos || ''}`.trim().slice(0, 30);
    const cedula = (data.cedula || `TMP-${Date.now()}`).slice(0, 13);
    const [result] = await pool.query(
        `INSERT INTO empleado
         (nombre, cedula, telefono, direccion, cargo, nomina, provincia, fecha_ingreso, salario)
         VALUES (?, ?, ?, ?, ?, ?, ?, CURDATE(), ?)`,
        [
            nombreCompleto || 'Empleado',
            cedula,
            data.telefono || null,
            data.direccion || null,
            (data.cargo || 'Auxiliar').slice(0, 50),
            Number(data.sueldo) || 0,
            data.provincia || null,
            Number(data.sueldo) || 0
        ]
    );
    return result.insertId;
}

async function updateEmpleado(id, data) {
    const nombreCompleto = `${data.nombre || ''} ${data.apellidos || ''}`.trim().slice(0, 30);
    await pool.query(
        `UPDATE empleado SET nombre = ?, cedula = ?, telefono = ?, direccion = ?,
         cargo = ?, salario = ?, nomina = ?, provincia = ?
         WHERE id_empleado = ?`,
        [
            nombreCompleto,
            (data.cedula || '').slice(0, 13),
            data.telefono || null,
            data.direccion || null,
            (data.cargo || 'Auxiliar').slice(0, 50),
            Number(data.sueldo) || 0,
            Number(data.sueldo) || 0,
            data.provincia || null,
            id
        ]
    );
}

async function deleteEmpleado(id) {
    await pool.query('DELETE FROM empleado WHERE id_empleado = ?', [id]);
}

async function listClientes() {
    const [rows] = await pool.query(`
        SELECT id_cliente, nombre, telefono, direccion, tipo_seguro, provincia
        FROM cliente ORDER BY nombre
    `);
    return rows.map(r => {
        const parts = (r.nombre || '').split(' ');
        return {
            id: r.id_cliente,
            codigo: r.id_cliente,
            nombre: parts[0] || r.nombre,
            apellidos: parts.slice(1).join(' '),
            seguro: r.tipo_seguro || '',
            sexo: 'M',
            telefono: r.telefono || '',
            provincia: r.provincia || '',
            estado: 'Activo'
        };
    });
}

async function createCliente(data) {
    const nombreCompleto = `${data.nombre || ''} ${data.apellidos || ''}`.trim().slice(0, 30);
    const [result] = await pool.query(
        `INSERT INTO cliente (nombre, telefono, direccion, tipo_seguro, provincia)
         VALUES (?, ?, ?, ?, ?)`,
        [
            nombreCompleto || 'Cliente',
            data.telefono || null,
            null,
            data.seguro || null,
            data.provincia || null
        ]
    );
    return result.insertId;
}

async function updateCliente(id, data) {
    const nombreCompleto = `${data.nombre || ''} ${data.apellidos || ''}`.trim().slice(0, 30);
    await pool.query(
        `UPDATE cliente SET nombre = ?, telefono = ?, tipo_seguro = ?, provincia = ? WHERE id_cliente = ?`,
        [nombreCompleto, data.telefono || null, data.seguro || null, data.provincia || null, id]
    );
}

async function deleteCliente(id) {
    await pool.query('DELETE FROM cliente WHERE id_cliente = ?', [id]);
}

module.exports = {
    listProveedores,
    createProveedor,
    updateProveedor,
    deleteProveedor,
    listEmpleados,
    createEmpleado,
    updateEmpleado,
    deleteEmpleado,
    listClientes,
    createCliente,
    updateCliente,
    deleteCliente,
    listAdminProductos: productosService.listAdminProductos,
    createProducto: productosService.createProducto,
    updateProducto: productosService.updateProducto,
    deleteProducto: productosService.deleteProducto
};
