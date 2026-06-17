require('dotenv').config();

const express = require('express');
const path = require('path');
const exphbs = require('express-handlebars');
const session = require('express-session');

const { initSchema, testConnection, ensureDbSeed } = require('./db');
const authService = require('./services/authService');
const productosService = require('./services/productosService');
const pedidosService = require('./services/pedidosService');
const contactoService = require('./services/contactoService');
const { createAdminRouter } = require('./routes/adminApi');

const app = express();
const port = process.env.PORT || 5500;

const ADMIN_EMAIL = authService.ADMIN_EMAIL;

function isAdmin(req) {
    return req.session.usuario?.rol === 'admin';
}

function requireAdmin(req, res, next) {
    if (!isAdmin(req)) {
        if (req.originalUrl.startsWith('/api/')) {
            return res.status(401).json({ error: 'Sesión expirada o no autorizado' });
        }
        return res.redirect('/login?error=Debes iniciar sesión con una cuenta de administrador');
    }
    next();
}

const CAT_ICONS = {
    Medicamentos: '💊',
    Vitaminas: '🧬',
    Cardiovascular: '❤️',
    Dermocosmética: '✨',
    Bebés: '👶',
    Higiene: '🧴',
    Equipos: '🩺'
};

function buildGrupos(productos) {
    const gruposMap = {};
    productos.forEach(p => {
        if (!gruposMap[p.categoria]) {
            gruposMap[p.categoria] = {
                categoria: p.categoria,
                icono: CAT_ICONS[p.categoria] || '🏷️',
                productos: []
            };
        }
        gruposMap[p.categoria].productos.push(p);
    });
    return Object.values(gruposMap);
}

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
// app.use('/JS', express.static(path.join(__dirname, 'JS'))); // Mantenido por public/

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

app.use('/api/admin', createAdminRouter(requireAdmin));

app.get('/admin/login.html', (req, res) => res.redirect('/login'));
app.get('/admin/login', (req, res) => res.redirect('/login'));

function renderAdmin(req, res) {
    res.render('admin', {
        layout: false,
        title: 'Panel Admin — Farmacia GBC'
    });
}

app.get('/admin', requireAdmin, renderAdmin);
app.get('/admin/index.html', requireAdmin, renderAdmin);
app.use('/admin', express.static(path.join(__dirname, 'admin'), { index: false }));

// ============ RUTAS — PÁGINAS ============

app.get('/', async (req, res) => {
    if (isAdmin(req)) return res.redirect('/admin/');

    try {
        const productos = await productosService.getProductosWeb();
        const conDescuento = productos.filter(p => p.descuento);
        const porCategoria = new Map();
        for (const p of conDescuento) {
            if (!porCategoria.has(p.categoria)) porCategoria.set(p.categoria, p);
        }
        const destacadas = [...porCategoria.values()];
        const idsDestacadas = new Set(destacadas.map(p => p.id));
        const ofertas = [...destacadas, ...conDescuento.filter(p => !idsDestacadas.has(p.id))].slice(0, 9);

        if (!ofertas.length) {
            ofertas.push(...productos.slice(0, 9));
        }

        res.render('inicio', {
            title: 'Farmacia GBC — Tu salud, nuestra prioridad',
            ofertas
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al cargar productos desde la base de datos');
    }
});

app.get('/login', (req, res) => {
    if (req.session.usuario) {
        if (isAdmin(req)) return res.redirect('/admin/');
        return res.redirect('/');
    }
    res.render('login', {
        layout: false,
        error: req.query.error || null,
        success: req.query.success || null,
        showRegister: req.query.register === '1'
    });
});

app.get('/productos', async (req, res) => {
    const categoria = req.query.categoria || 'todos';

    try {
        const todos = await productosService.getProductosWeb();
        let filtrados = categoria === 'todos'
            ? todos
            : todos.filter(p => p.categoria === categoria);

        filtrados = filtrados.sort((a, b) =>
            a.categoria.localeCompare(b.categoria) || a.nombre.localeCompare(b.nombre)
        );

        const categoriasSet = [...new Set(todos.map(p => p.categoria))].sort();
        const categorias = categoriasSet.map(c => ({ categoria: c }));
        const grupos = buildGrupos(filtrados);

        res.render('productos', {
            title: 'Productos — Farmacia GBC',
            productos: filtrados,
            grupos,
            categorias,
            categoriaActual: categoria
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al cargar el catálogo');
    }
});

app.get('/ofertas', (req, res) => res.redirect('/#ofertas'));
app.get('/nosotros', (req, res) => res.redirect('/#nosotros'));
app.get('/contacto', (req, res) => res.redirect('/#contacto'));

app.get('/sucursales', (req, res) => {
    res.render('sucursales', {
        title: 'Sucursales — Farmacia GBC'
    });
});

// ============ RUTAS — AUTENTICACIÓN ============

app.post('/register', async (req, res) => {
    const { nombre, correo, password } = req.body;

    if (!nombre || !correo || !password) {
        return res.redirect('/login?error=Todos los campos son obligatorios&register=1');
    }
    if (password.length < 6) {
        return res.redirect('/login?error=La contraseña debe tener al menos 6 caracteres&register=1');
    }

    try {
        const nuevoUsuario = await authService.registerUser({ nombre, correo, password });
        console.log(`✅ Nuevo ${nuevoUsuario.rol === 'admin' ? 'ADMIN' : 'usuario'}: ${nombre} (${nuevoUsuario.correo})`);

        if (nuevoUsuario.rol === 'admin') {
            req.session.usuario = {
                id: nuevoUsuario.id,
                id_cliente: nuevoUsuario.id_cliente,
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
    } catch (err) {
        console.error('❌ Error en registro:', err.message, err.sql || '');
        const msg = encodeURIComponent(err.message || 'No se pudo registrar');
        res.redirect(`/login?error=${msg}&register=1`);
    }
});

app.post('/login', async (req, res) => {
    const { correo, password } = req.body;

    if (!correo || !password) {
        return res.redirect('/login?error=Correo y contraseña son obligatorios');
    }

    try {
        const usuario = await authService.loginUser(correo, password);
        if (!usuario) {
            return res.redirect('/login?error=Correo o contraseña incorrectos');
        }

        req.session.usuario = {
            id: usuario.id,
            id_cliente: usuario.id_cliente,
            nombre: usuario.nombre,
            correo: usuario.correo,
            rol: usuario.rol
        };

        const destino = usuario.rol === 'admin' ? '/admin/' : '/';
        console.log(`✅ Login: ${usuario.nombre} (${usuario.rol}) → ${destino}`);

        req.session.save((err) => {
            if (err) {
                console.error('Error al guardar sesión:', err);
                return res.redirect('/login?error=No se pudo iniciar sesión. Intenta de nuevo');
            }
            res.redirect(destino);
        });
    } catch (err) {
        console.error(err);
        res.redirect('/login?error=Error al iniciar sesión');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/login'));
});

// ============ RUTAS — CONTACTO ============

app.post('/contacto', async (req, res) => {
    const { name, phone, email, msg } = req.body;
    if (!name || !email || !msg) return res.redirect('/#contacto');

    try {
        await contactoService.guardarMensaje({ name, phone, email, msg });
        console.log(`📩 Mensaje guardado de: ${name} (${email})`);
        res.redirect('/?contacto=enviado#contacto');
    } catch (err) {
        console.error(err);
        res.redirect('/?contacto=error#contacto');
    }
});

// ============ RUTAS — API ============

app.post('/api/pedido', async (req, res) => {
    const { items, total, direccion } = req.body;
    if (!items || !total || !direccion) return res.status(400).json({ error: 'Datos incompletos o falta dirección' });

    try {
        const pedidoId = await pedidosService.crearPedidoWeb({
            usuario: req.session.usuario,
            items,
            total,
            direccion
        });
        const nombre = req.session.usuario?.nombre || 'Invitado';
        console.log(`🛒 Pedido #${pedidoId} de ${nombre} — $${total}`);
        res.json({ success: true, pedidoId });
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: err.message || 'No se pudo procesar el pedido' });
    }
});

// ============ INICIAR SERVIDOR ============

async function start() {
    try {
        await testConnection();
        await initSchema();
        await ensureDbSeed();
        await authService.ensureAdminAccount();

        const productos = await productosService.getProductosWeb();

        app.listen(port, () => {
            console.log(`\n🏥 Farmacia GBC — http://localhost:${port}`);
            console.log(`🗄️  Base de datos: ${process.env.DB_NAME || 'farmacia_gbc'}`);
            console.log(`📦 ${productos.length} productos disponibles (con stock)\n`);
        });
    } catch (err) {
        console.error('\n❌ No se pudo conectar a MySQL:', err.message);
        console.error('   Verifica DB_HOST, DB_USER, DB_PASS y DB_NAME en .env\n');
        process.exit(1);
    }
}

start();
