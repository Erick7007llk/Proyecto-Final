require('dotenv').config();

const express = require('express');
const path = require('path');
const exphbs = require('express-handlebars');
const session = require('express-session');
const bcrypt = require('bcryptjs');

const app = express();
const port = process.env.PORT || 5500;

// ============ DATOS EN MEMORIA (sin base de datos) ============

const productos = require('./data/productos');

const usuarios = []; // Usuarios registrados en memoria
const pedidos = [];  // Pedidos en memoria
const contactos = []; // Mensajes de contacto en memoria

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@gbc.com').trim().toLowerCase();
const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || 'admin123').trim();

/** El correo configurado en .env siempre es administrador */
function syncAdminRoles() {
    usuarios.forEach(u => {
        if ((u.correo || '').toLowerCase() === ADMIN_EMAIL) {
            u.rol = 'admin';
        }
    });
}

function resolveRol(usuario) {
    if (!usuario) return 'cliente';
    if ((usuario.correo || '').toLowerCase() === ADMIN_EMAIL) {
        usuario.rol = 'admin';
        return 'admin';
    }
    return usuario.rol === 'admin' ? 'admin' : 'cliente';
}

function verifyPassword(plain, hash) {
    const p = (plain || '').trim();
    if (!p || !hash) return false;
    try {
        return bcrypt.compareSync(p, hash);
    } catch {
        return false;
    }
}

function isAdmin(req) {
    return req.session.usuario?.rol === 'admin';
}

/** Solo localhost: permite servir /admin para captura en Figma sin sesión */
function isLocalFigmaCapture(req) {
    const host = req.hostname || '';
    const local = host === 'localhost' || host === '127.0.0.1';
    return local && req.query.figma_capture === '1';
}

function requireAdmin(req, res, next) {
    if (isLocalFigmaCapture(req)) return next();
    if (!isAdmin(req)) {
        return res.redirect('/login?error=Debes iniciar sesión con una cuenta de administrador');
    }
    next();
}

function findUsuarioPorCorreo(correo) {
    return usuarios.find(u => (u.correo || '').toLowerCase() === (correo || '').trim().toLowerCase());
}

function getOrCreateAdmin() {
    syncAdminRoles();
    let admin = findUsuarioPorCorreo(ADMIN_EMAIL);
    if (!admin) {
        admin = {
            id: usuarios.length + 1,
            nombre: 'Administrador',
            correo: ADMIN_EMAIL,
            password: bcrypt.hashSync(ADMIN_PASSWORD, 10),
            rol: 'admin'
        };
        usuarios.push(admin);
    }
    admin.rol = 'admin';
    admin.correo = ADMIN_EMAIL;
    return admin;
}

function seedAdminIfMissing() {
    getOrCreateAdmin();
}

seedAdminIfMissing();

// ============ MOTOR DE VISTAS ============
app.engine('hbs', exphbs.engine({
    extname: 'hbs',
    defaultLayout: false,
    partialsDir: path.join(__dirname, 'views/partials'),
    helpers: { eq: (a, b) => a === b }
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// ============ MIDDLEWARE ============
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET || 'farmacia_gbc_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

// Variables globales para vistas + mantener rol admin en sesión
app.use((req, res, next) => {
    if (req.session.usuario) {
        const correo = (req.session.usuario.correo || '').toLowerCase();
        if (correo === ADMIN_EMAIL || req.session.usuario.rol === 'admin') {
            req.session.usuario.rol = 'admin';
        }
    }
    res.locals.usuario = req.session.usuario || null;
    res.locals.loggedIn = !!req.session.usuario;
    res.locals.isAdmin = isAdmin(req);
    next();
});

app.use(express.static(path.join(__dirname, 'public')));
app.use('/JS', express.static(path.join(__dirname, 'JS')));

app.get('/api/auth/me', (req, res) => {
    if (!req.session.usuario) {
        return res.json({ loggedIn: false });
    }
    res.json({
        loggedIn: true,
        usuario: {
            id: req.session.usuario.id,
            nombre: req.session.usuario.nombre,
            correo: req.session.usuario.correo,
            rol: req.session.usuario.rol || 'cliente'
        }
    });
});

app.get('/admin/login.html', (req, res) => res.redirect('/login'));
app.get('/admin/login', (req, res) => res.redirect('/login'));
app.get('/admin', requireAdmin, (req, res) => {
    const q = isLocalFigmaCapture(req) ? '?figma_capture=1' : '';
    res.redirect(`/admin/index.html${q}`);
});
app.get('/admin/index.html', requireAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});
app.use('/admin', express.static(path.join(__dirname, 'admin'), { index: false }));

// ============ RUTAS — PÁGINAS ============

// Inicio (página única: hero, ofertas, categorías, nosotros, contacto)
app.get('/', (req, res) => {
    if (isAdmin(req)) return res.redirect('/admin/');

    const conDescuento = productos.filter(p => p.activo && p.descuento);
    const porCategoria = new Map();
    for (const p of conDescuento) {
        if (!porCategoria.has(p.categoria)) porCategoria.set(p.categoria, p);
    }
    const destacadas = [...porCategoria.values()];
    const idsDestacadas = new Set(destacadas.map(p => p.id));
    const ofertas = [...destacadas, ...conDescuento.filter(p => !idsDestacadas.has(p.id))].slice(0, 9);

    res.render('Inicio', {
        title: 'Farmacia GBC — Tu salud, nuestra prioridad',
        ofertas
    });
});

// Login
app.get('/login', (req, res) => {
    if (req.session.usuario) {
        if (isAdmin(req)) return res.redirect('/admin/');
        return res.redirect('/');
    }
    res.render('Login', {
        layout: false,
        error: req.query.error || null,
        success: req.query.success || null,
        showRegister: req.query.register === '1'
    });
});

// Productos
app.get('/productos', (req, res) => {
    const categoria = req.query.categoria || 'todos';

    // Filtrar productos activos
    let filtrados;
    if (categoria === 'todos') {
        filtrados = productos.filter(p => p.activo).sort((a, b) => a.categoria.localeCompare(b.categoria) || a.nombre.localeCompare(b.nombre));
    } else {
        filtrados = productos.filter(p => p.activo && p.categoria === categoria).sort((a, b) => a.nombre.localeCompare(b.nombre));
    }

    // Obtener categorías únicas
    const categoriasSet = [...new Set(productos.filter(p => p.activo).map(p => p.categoria))].sort();
    const categorias = categoriasSet.map(c => ({ categoria: c }));

    // Emojis para cada categoría
    const catIcons = {
        'Medicamentos': '💊',
        'Vitaminas': '🧬',
        'Cardiovascular': '❤️',
        'Dermocosmética': '✨',
        'Bebés': '👶',
        'Higiene': '🧴',
        'Equipos': '🩺'
    };

    // Agrupar productos por categoría
    const gruposMap = {};
    filtrados.forEach(p => {
        if (!gruposMap[p.categoria]) {
            gruposMap[p.categoria] = {
                categoria: p.categoria,
                icono: catIcons[p.categoria] || '🏷️',
                productos: []
            };
        }
        gruposMap[p.categoria].productos.push(p);
    });
    const grupos = Object.values(gruposMap);

    res.render('Productos', {
        title: 'Productos — Farmacia GBC',
        productos: filtrados,
        grupos,
        categorias,
        categoriaActual: categoria
    });
});

// Redirecciones a secciones del inicio
app.get('/ofertas', (req, res) => res.redirect('/#ofertas'));
app.get('/nosotros', (req, res) => res.redirect('/#nosotros'));
app.get('/contacto', (req, res) => res.redirect('/#contacto'));

// Sucursales
app.get('/sucursales', (req, res) => {
    res.render('Sucursales', {
        title: 'Sucursales — Farmacia GBC'
    });
});

// ============ RUTAS — AUTENTICACIÓN ============

// Registrar
app.post('/register', (req, res) => {
    const { nombre, correo, password } = req.body;

    if (!nombre || !correo || !password) {
        return res.redirect('/login?error=Todos los campos son obligatorios&register=1');
    }
    if (password.length < 6) {
        return res.redirect('/login?error=La contraseña debe tener al menos 6 caracteres&register=1');
    }

    const correoNorm = correo.trim().toLowerCase();
    const existe = usuarios.find(u => (u.correo || '').toLowerCase() === correoNorm);
    if (existe) {
        return res.redirect('/login?error=Este correo ya está registrado&register=1');
    }

    const hash = bcrypt.hashSync(password.trim(), 10);
    const esAdmin = correoNorm === ADMIN_EMAIL;

    const nuevoUsuario = {
        id: usuarios.length + 1,
        nombre,
        correo: correoNorm,
        password: hash,
        rol: esAdmin ? 'admin' : 'cliente'
    };
    usuarios.push(nuevoUsuario);

    console.log(`✅ Nuevo ${esAdmin ? 'ADMIN' : 'usuario'}: ${nombre} (${correoNorm})`);

    if (esAdmin) {
        req.session.usuario = {
            id: nuevoUsuario.id,
            nombre: nuevoUsuario.nombre,
            correo: nuevoUsuario.correo,
            rol: 'admin'
        };
        return req.session.save((err) => {
            if (err) console.error(err);
            res.redirect('/admin/');
        });
    }
    res.redirect('/login?success=Registro exitoso. Inicia sesión con tus credenciales');
});

// Login
app.post('/login', (req, res) => {
    const { correo, password } = req.body;

    if (!correo || !password) {
        return res.redirect('/login?error=Correo y contraseña son obligatorios');
    }

    const correoNorm = (correo || '').trim().toLowerCase();
    const passwordTrim = (password || '').trim();

    let usuario;
    let rol;

    if (correoNorm === ADMIN_EMAIL) {
        usuario = getOrCreateAdmin();
        const ok = passwordTrim === ADMIN_PASSWORD || verifyPassword(passwordTrim, usuario.password);
        if (!ok) {
            return res.redirect('/login?error=Correo o contraseña incorrectos');
        }
        if (passwordTrim === ADMIN_PASSWORD) {
            usuario.password = bcrypt.hashSync(ADMIN_PASSWORD, 10);
        }
        rol = 'admin';
    } else {
        syncAdminRoles();
        usuario = findUsuarioPorCorreo(correoNorm);
        if (!usuario || !verifyPassword(passwordTrim, usuario.password)) {
            return res.redirect('/login?error=Correo o contraseña incorrectos');
        }
        rol = resolveRol(usuario);
    }

    req.session.usuario = {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: ADMIN_EMAIL === correoNorm ? ADMIN_EMAIL : (usuario.correo || '').toLowerCase(),
        rol
    };

    const destino = rol === 'admin' ? '/admin/' : '/';
    console.log(`✅ Login: ${usuario.nombre} (${rol}) → ${destino}`);

    req.session.save((err) => {
        if (err) {
            console.error('Error al guardar sesión:', err);
            return res.redirect('/login?error=No se pudo iniciar sesión. Intenta de nuevo');
        }
        res.redirect(destino);
    });
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/login'));
});

// ============ RUTAS — CONTACTO ============

app.post('/contacto', (req, res) => {
    const { name, phone, email, msg } = req.body;
    if (!name || !email || !msg) return res.redirect('/#contacto');

    contactos.push({ id: contactos.length + 1, nombre: name, telefono: phone || '', correo: email, mensaje: msg });
    console.log(`📩 Mensaje de: ${name} (${email})`);
    res.redirect('/?contacto=enviado#contacto');
});

// ============ RUTAS — API ============

app.post('/api/pedido', (req, res) => {
    const { items, total } = req.body;
    if (!items || !total) return res.status(400).json({ error: 'Datos incompletos' });

    const usuario = req.session.usuario;
    const nombre = usuario ? usuario.nombre : 'Invitado';
    const correo = usuario ? usuario.correo : 'sin-correo@invitado.com';
    const usuarioId = usuario ? usuario.id : null;

    const pedidoId = pedidos.length + 1;
    pedidos.push({ id: pedidoId, usuario_id: usuarioId, nombre_cliente: nombre, correo_cliente: correo, items, total, estado: 'pendiente' });

    console.log(`🛒 Pedido #${pedidoId} de ${nombre} — $${total}`);
    res.json({ success: true, pedidoId });
});

// ============ INICIAR SERVIDOR ============

app.listen(port, () => {
    console.log(`\n🏥 Farmacia GBC — http://localhost:${port}`);
    console.log(`📦 ${productos.length} productos cargados en memoria`);
    console.log(`⚠️  Modo sin base de datos — los datos no se persisten\n`);
});