const { pool } = require('../db');

async function guardarMensaje({ name, phone, email, msg }) {
    const [result] = await pool.query(
        `INSERT INTO mensaje_contacto (nombre, telefono, correo, mensaje)
         VALUES (?, ?, ?, ?)`,
        [
            (name || '').slice(0, 100),
            (phone || '').slice(0, 20) || null,
            (email || '').slice(0, 100),
            msg
        ]
    );
    return result.insertId;
}

module.exports = { guardarMensaje };
