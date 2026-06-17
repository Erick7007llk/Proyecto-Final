require('dotenv').config();
const mysql = require('mysql2/promise');

// ============ POOL DE CONEXIONES ============

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || 'Eusebio070120',
    database: process.env.DB_NAME || 'farmacia_gbc',
    waitForConnections: true,
    connectionLimit: 10,
    charset: 'utf8mb4'
});

// ============ ESQUEMA COMPLETO (basado en proyecto_rafa4.sql) ============

const SCHEMA_TABLES = [

    // --- proveedor (sin dependencias) ---
    `CREATE TABLE IF NOT EXISTS proveedor (
        id_proveedor INT NOT NULL AUTO_INCREMENT,
        nombre VARCHAR(30) NOT NULL,
        telefono VARCHAR(15) DEFAULT NULL,
        correo VARCHAR(50) DEFAULT NULL,
        direccion VARCHAR(100) DEFAULT NULL,
        RNC VARCHAR(20) NOT NULL,
        provincia VARCHAR(50) DEFAULT NULL,
        PRIMARY KEY (id_proveedor),
        UNIQUE KEY RNC (RNC),
        UNIQUE KEY correo (correo)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    // --- cliente (sin dependencias) ---
    `CREATE TABLE IF NOT EXISTS cliente (
        id_cliente INT NOT NULL AUTO_INCREMENT,
        nombre VARCHAR(30) NOT NULL,
        telefono VARCHAR(15) DEFAULT NULL,
        direccion VARCHAR(100) DEFAULT NULL,
        tipo_seguro VARCHAR(50) DEFAULT NULL,
        provincia VARCHAR(50) DEFAULT NULL,
        PRIMARY KEY (id_cliente)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    // --- empleado (sin dependencias) ---
    `CREATE TABLE IF NOT EXISTS empleado (
        id_empleado INT NOT NULL AUTO_INCREMENT,
        nombre VARCHAR(30) NOT NULL,
        cedula VARCHAR(13) NOT NULL,
        telefono VARCHAR(15) DEFAULT NULL,
        direccion VARCHAR(100) DEFAULT NULL,
        cargo VARCHAR(50) NOT NULL,
        nomina DECIMAL(10,2) NOT NULL,
        provincia VARCHAR(50) DEFAULT NULL,
        fecha_ingreso DATE NOT NULL,
        salario DECIMAL(10,2) NOT NULL,
        licencia_profesional VARCHAR(50) DEFAULT NULL,
        numero_registro VARCHAR(50) DEFAULT NULL,
        permisos_especiales VARCHAR(100) DEFAULT NULL,
        PRIMARY KEY (id_empleado),
        UNIQUE KEY cedula (cedula)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    // --- rol (sin dependencias) ---
    `CREATE TABLE IF NOT EXISTS rol (
        id_rol INT NOT NULL AUTO_INCREMENT,
        rol VARCHAR(50) NOT NULL,
        descripcion VARCHAR(150) DEFAULT NULL,
        PRIMARY KEY (id_rol),
        UNIQUE KEY rol (rol)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    // --- producto (depende de proveedor) ---
    `CREATE TABLE IF NOT EXISTS producto (
        id_producto INT NOT NULL AUTO_INCREMENT,
        nombre VARCHAR(30) NOT NULL,
        tipo_producto VARCHAR(50) NOT NULL,
        precio DECIMAL(10,2) NOT NULL,
        cantidad INT NOT NULL DEFAULT 0,
        lote VARCHAR(50) DEFAULT NULL,
        fecha_vencimiento DATE DEFAULT NULL,
        tipo_medicamento VARCHAR(50) DEFAULT NULL,
        id_proveedor INT NOT NULL,
        PRIMARY KEY (id_producto),
        KEY id_proveedor (id_proveedor),
        CONSTRAINT producto_ibfk_1 FOREIGN KEY (id_proveedor) REFERENCES proveedor (id_proveedor)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    // --- factura (depende de cliente, empleado) ---
    `CREATE TABLE IF NOT EXISTS factura (
        id_factura INT NOT NULL AUTO_INCREMENT,
        id_cliente INT NOT NULL,
        id_empleado INT NOT NULL,
        fecha DATE NOT NULL,
        NCF VARCHAR(20) DEFAULT NULL,
        PRIMARY KEY (id_factura),
        UNIQUE KEY NCF (NCF),
        KEY id_cliente (id_cliente),
        KEY id_empleado (id_empleado),
        CONSTRAINT factura_ibfk_1 FOREIGN KEY (id_cliente) REFERENCES cliente (id_cliente),
        CONSTRAINT factura_ibfk_2 FOREIGN KEY (id_empleado) REFERENCES empleado (id_empleado)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    // --- detallefactura (depende de factura, producto) ---
    `CREATE TABLE IF NOT EXISTS detallefactura (
        id_factura INT NOT NULL,
        id_producto INT NOT NULL,
        cantidad INT NOT NULL,
        precio_unitario DECIMAL(10,2) NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        KEY id_factura (id_factura),
        KEY id_producto (id_producto),
        CONSTRAINT detallefactura_ibfk_1 FOREIGN KEY (id_factura) REFERENCES factura (id_factura),
        CONSTRAINT detallefactura_ibfk_2 FOREIGN KEY (id_producto) REFERENCES producto (id_producto)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    // --- pedido_proveedor (depende de proveedor) ---
    `CREATE TABLE IF NOT EXISTS pedido_proveedor (
        id_pedido_proveedor INT NOT NULL AUTO_INCREMENT,
        id_proveedor INT NOT NULL,
        fecha_pedido DATETIME NOT NULL,
        estado VARCHAR(30) NOT NULL,
        total DECIMAL(10,2) DEFAULT NULL,
        PRIMARY KEY (id_pedido_proveedor),
        KEY id_proveedor (id_proveedor),
        CONSTRAINT pedido_proveedor_ibfk_1 FOREIGN KEY (id_proveedor) REFERENCES proveedor (id_proveedor)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    // --- detalle_pedido_proveedor (depende de pedido_proveedor, producto) ---
    `CREATE TABLE IF NOT EXISTS detalle_pedido_proveedor (
        id_pedido_proveedor INT NOT NULL,
        id_producto INT NOT NULL,
        cantidad INT NOT NULL,
        precio_compra DECIMAL(10,2) NOT NULL,
        itbis DECIMAL(10,2) DEFAULT NULL,
        descuento DECIMAL(10,2) DEFAULT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        KEY id_pedido_proveedor (id_pedido_proveedor),
        KEY id_producto (id_producto),
        CONSTRAINT detalle_pedido_proveedor_ibfk_1 FOREIGN KEY (id_pedido_proveedor) REFERENCES pedido_proveedor (id_pedido_proveedor),
        CONSTRAINT detalle_pedido_proveedor_ibfk_2 FOREIGN KEY (id_producto) REFERENCES producto (id_producto)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    // --- presentacion (depende de producto) ---
    `CREATE TABLE IF NOT EXISTS presentacion (
        id_presentacion INT NOT NULL AUTO_INCREMENT,
        id_producto INT NOT NULL,
        tipo_presentacion VARCHAR(50) NOT NULL,
        concentracion VARCHAR(50) DEFAULT NULL,
        PRIMARY KEY (id_presentacion),
        KEY id_producto (id_producto),
        CONSTRAINT presentacion_ibfk_1 FOREIGN KEY (id_producto) REFERENCES producto (id_producto)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    // --- componente (depende de producto) ---
    `CREATE TABLE IF NOT EXISTS componente (
        id_componente INT NOT NULL AUTO_INCREMENT,
        id_producto INT NOT NULL,
        nombre VARCHAR(30) NOT NULL,
        cantidad VARCHAR(50) DEFAULT NULL,
        PRIMARY KEY (id_componente),
        KEY id_producto (id_producto),
        CONSTRAINT componente_ibfk_1 FOREIGN KEY (id_producto) REFERENCES producto (id_producto)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    // --- usuario (depende de empleado, rol) ---
    `CREATE TABLE IF NOT EXISTS usuario (
        id_usuario INT NOT NULL AUTO_INCREMENT,
        nombre_usuario VARCHAR(30) NOT NULL,
        contrasena VARCHAR(100) NOT NULL,
        estado_cuenta VARCHAR(20) NOT NULL,
        fecha_creacion DATE NOT NULL,
        ultimo_acceso DATETIME DEFAULT NULL,
        id_empleado INT NOT NULL,
        id_rol INT NOT NULL,
        PRIMARY KEY (id_usuario),
        UNIQUE KEY nombre_usuario (nombre_usuario),
        KEY id_empleado (id_empleado),
        KEY id_rol (id_rol),
        CONSTRAINT usuario_ibfk_1 FOREIGN KEY (id_empleado) REFERENCES empleado (id_empleado),
        CONSTRAINT usuario_ibfk_2 FOREIGN KEY (id_rol) REFERENCES rol (id_rol)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    // --- pedido_web (depende de cliente) ---
    `CREATE TABLE IF NOT EXISTS pedido_web (
        id_pedido_web INT NOT NULL AUTO_INCREMENT,
        id_cliente INT NOT NULL,
        fecha_pedido DATETIME NOT NULL,
        estado VARCHAR(30) NOT NULL,
        metodo_pago VARCHAR(30) NOT NULL,
        direccion_entrega VARCHAR(50) NOT NULL,
        total DECIMAL(10,2) NOT NULL,
        PRIMARY KEY (id_pedido_web),
        KEY id_cliente (id_cliente),
        CONSTRAINT pedido_web_ibfk_1 FOREIGN KEY (id_cliente) REFERENCES cliente (id_cliente)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    // --- detalle_pedido_web (depende de pedido_web, producto) ---
    `CREATE TABLE IF NOT EXISTS detalle_pedido_web (
        id_pedido_web INT NOT NULL,
        id_producto INT NOT NULL,
        cantidad INT NOT NULL,
        precio_unitario DECIMAL(10,2) NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        KEY id_pedido_web (id_pedido_web),
        KEY id_producto (id_producto),
        CONSTRAINT detalle_pedido_web_ibfk_1 FOREIGN KEY (id_pedido_web) REFERENCES pedido_web (id_pedido_web),
        CONSTRAINT detalle_pedido_web_ibfk_2 FOREIGN KEY (id_producto) REFERENCES producto (id_producto)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    // --- cuenta_web (depende de cliente) — tabla para autenticación web ---
    `CREATE TABLE IF NOT EXISTS cuenta_web (
        id_cuenta INT NOT NULL AUTO_INCREMENT,
        id_cliente INT DEFAULT NULL,
        nombre VARCHAR(60) NOT NULL,
        correo VARCHAR(100) NOT NULL,
        contrasena VARCHAR(255) NOT NULL,
        rol VARCHAR(20) NOT NULL DEFAULT 'cliente',
        fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id_cuenta),
        UNIQUE KEY uk_correo (correo),
        KEY id_cliente (id_cliente),
        CONSTRAINT cuenta_web_ibfk_1 FOREIGN KEY (id_cliente) REFERENCES cliente (id_cliente)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    // --- mensaje_contacto (sin dependencias) ---
    `CREATE TABLE IF NOT EXISTS mensaje_contacto (
        id_mensaje INT NOT NULL AUTO_INCREMENT,
        nombre VARCHAR(100) NOT NULL,
        telefono VARCHAR(20) DEFAULT NULL,
        correo VARCHAR(100) NOT NULL,
        mensaje TEXT NOT NULL,
        fecha_envio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id_mensaje)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
];

// ============ TRIGGERS (del backup proyecto_rafa4.sql) ============

const TRIGGERS = [
    // Verificar stock antes de insertar en detallefactura
    {
        name: 'trg_verificar_stock',
        table: 'detallefactura',
        sql: `CREATE TRIGGER trg_verificar_stock BEFORE INSERT ON detallefactura
              FOR EACH ROW
              BEGIN
                  DECLARE stock_actual INT;
                  SELECT cantidad INTO stock_actual FROM producto WHERE id_producto = NEW.id_producto;
                  IF stock_actual < NEW.cantidad THEN
                      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Stock insuficiente';
                  END IF;
              END`
    },
    // Calcular subtotal automáticamente
    {
        name: 'trg_calcular_subtotal',
        table: 'detallefactura',
        sql: `CREATE TRIGGER trg_calcular_subtotal BEFORE INSERT ON detallefactura
              FOR EACH ROW
              SET NEW.subtotal = NEW.cantidad * NEW.precio_unitario`
    },
    // Verificar producto vencido
    {
        name: 'trg_producto_vencido',
        table: 'detallefactura',
        sql: `CREATE TRIGGER trg_producto_vencido BEFORE INSERT ON detallefactura
              FOR EACH ROW
              BEGIN
                  DECLARE fecha_v DATE;
                  SELECT fecha_vencimiento INTO fecha_v FROM producto WHERE id_producto = NEW.id_producto;
                  IF fecha_v IS NOT NULL AND fecha_v < CURDATE() THEN
                      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Producto vencido';
                  END IF;
              END`
    },
    // Descontar stock después de insertar
    {
        name: 'trg_actualizar_stock',
        table: 'detallefactura',
        sql: `CREATE TRIGGER trg_actualizar_stock AFTER INSERT ON detallefactura
              FOR EACH ROW
              UPDATE producto SET cantidad = cantidad - NEW.cantidad WHERE id_producto = NEW.id_producto`
    },
    // Fecha automática al crear usuario
    {
        name: 'trg_fecha_usuario',
        table: 'usuario',
        sql: `CREATE TRIGGER trg_fecha_usuario BEFORE INSERT ON usuario
              FOR EACH ROW
              SET NEW.fecha_creacion = CURDATE()`
    }
];

// ============ FUNCIONES DE INICIALIZACIÓN ============

async function initSchema() {
    // Crear todas las tablas en orden de dependencias
    for (const sql of SCHEMA_TABLES) {
        await pool.query(sql);
    }

    // Crear triggers (ignorar si ya existen)
    for (const trigger of TRIGGERS) {
        try {
            await pool.query(trigger.sql);
        } catch (err) {
            // Error 1359 = Trigger already exists → ignorar
            if (err.errno !== 1359) {
                console.warn(`⚠️  Trigger ${trigger.name}: ${err.message}`);
            }
        }
    }
}

async function testConnection() {
    await pool.query('SELECT 1');
}

async function ensureDbSeed() {
    // Asegura al menos 1 empleado para poder insertar facturas (FK id_empleado).
    const [emp] = await pool.query('SELECT id_empleado FROM empleado ORDER BY id_empleado LIMIT 1');
    if (!emp.length) {
        await pool.query(
            `INSERT INTO empleado
             (nombre, cedula, telefono, direccion, cargo, nomina, provincia, fecha_ingreso, salario,
              licencia_profesional, numero_registro, permisos_especiales)
             VALUES (?, ?, NULL, NULL, ?, ?, NULL, CURDATE(), ?, NULL, NULL, NULL)`,
            ['Admin Sistema', '000-0000000-0', 'Administrador', 0, 0]
        );
    }
}

module.exports = { pool, initSchema, testConnection, ensureDbSeed };
