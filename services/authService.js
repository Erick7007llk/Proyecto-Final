const bcrypt = require('bcryptjs');
const { pool } = require('../db');

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@gbc.com').trim().toLowerCase();
const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || 'admin123').trim();

async function findCuentaPorCorreo(correo) {
    const [rows] = await pool.query(
        'SELECT * FROM cuenta_web WHERE LOWER(correo) = ? LIMIT 1',
        [(correo || '').trim().toLowerCase()]
    );
    return rows[0] || null;
}

async function ensureAdminAccount() {
    const existing = await findCuentaPorCorreo(ADMIN_EMAIL);
    const hash = bcrypt.hashSync(ADMIN_PASSWORD, 10);

    if (!existing) {
        await pool.query(
            `INSERT INTO cuenta_web (id_cliente, nombre, correo, contrasena, rol)
             VALUES (NULL, ?, ?, ?, 'admin')`,
            ['Administrador', ADMIN_EMAIL, hash]
        );
        return;
    }

    if (existing.rol !== 'admin') {
        await pool.query(
            `UPDATE cuenta_web SET rol = 'admin', contrasena = ? WHERE id_cuenta = ?`,
            [hash, existing.id_cuenta]
        );
    }
}

async function registerUser({ nombre, correo, password }) {
    const correoNorm = (correo || '').trim().toLowerCase();
    const esAdmin = correoNorm === ADMIN_EMAIL;

    if (await findCuentaPorCorreo(correoNorm)) {
        throw new Error('Este correo ya está registrado');
    }

    const hash = bcrypt.hashSync((password || '').trim(), 10);
    const rol = esAdmin ? 'admin' : 'cliente';

    const [cuentaResult] = await pool.query(
        `INSERT INTO cuenta_web (id_cliente, nombre, correo, contrasena, rol)
         VALUES (NULL, ?, ?, ?, ?)`,
        [(nombre || '').slice(0, 60), correoNorm, hash, rol]
    );

    return {
        id: cuentaResult.insertId,
        id_cliente: null,
        nombre,
        correo: correoNorm,
        rol
    };
}

async function loginUser(correo, password) {
    const correoNorm = (correo || '').trim().toLowerCase();
    const passwordTrim = (password || '').trim();

    if (correoNorm === ADMIN_EMAIL) {
        await ensureAdminAccount();
        const admin = await findCuentaPorCorreo(ADMIN_EMAIL);
        const ok = passwordTrim === ADMIN_PASSWORD || bcrypt.compareSync(passwordTrim, admin.contrasena);
        if (!ok) return null;

        if (passwordTrim === ADMIN_PASSWORD) {
            await pool.query(
                'UPDATE cuenta_web SET contrasena = ?, rol = ? WHERE id_cuenta = ?',
                [bcrypt.hashSync(ADMIN_PASSWORD, 10), 'admin', admin.id_cuenta]
            );
        }

        return {
            id: admin.id_cuenta,
            id_cliente: admin.id_cliente,
            nombre: admin.nombre,
            correo: ADMIN_EMAIL,
            rol: 'admin'
        };
    }

    const cuenta = await findCuentaPorCorreo(correoNorm);
    if (!cuenta || !bcrypt.compareSync(passwordTrim, cuenta.contrasena)) {
        return null;
    }

    const rol = cuenta.correo.toLowerCase() === ADMIN_EMAIL ? 'admin' : (cuenta.rol || 'cliente');

    return {
        id: cuenta.id_cuenta,
        id_cliente: cuenta.id_cliente,
        nombre: cuenta.nombre,
        correo: cuenta.correo,
        rol
    };
}

module.exports = {
    ADMIN_EMAIL,
    findCuentaPorCorreo,
    ensureAdminAccount,
    registerUser,
    loginUser
};
