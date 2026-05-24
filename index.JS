require('dotenv').config();

const express = require('express');
const path = require('path');
const exphbs = require('express-handlebars');
const session = require('express-session');
const bcrypt = require('bcryptjs');

const app = express();
const port = process.env.PORT || 5500;

// ============ DATOS EN MEMORIA (sin base de datos) ============

const productos = [
    // Con oferta
    { id: 1, nombre: 'Paracetamol 500mg', descripcion: 'Caja con 20 tabletas', precio: 45, precio_anterior: 65, descuento: '-30%', categoria: 'Medicamentos', activo: 1 },
    { id: 2, nombre: 'Ibuprofeno 400mg', descripcion: 'Caja con 24 tabletas', precio: 68, precio_anterior: 89, descuento: '-24%', categoria: 'Medicamentos', activo: 1 },
    { id: 7, nombre: 'Vitamina C 1000mg', descripcion: 'Frasco con 60 tabletas', precio: 189, precio_anterior: 249, descuento: '-25%', categoria: 'Vitaminas', activo: 1 },
    { id: 13, nombre: 'Aspirina Protect 100mg', descripcion: 'Caja con 28 tabletas', precio: 95, precio_anterior: 130, descuento: '-27%', categoria: 'Cardiovascular', activo: 1 },
    { id: 16, nombre: 'Crema hidratante', descripcion: 'Cuidado facial 200ml', precio: 320, precio_anterior: 450, descuento: '-29%', categoria: 'Dermocosmética', activo: 1 },
    { id: 20, nombre: 'Pañales RN Pack', descripcion: 'Paquete con 40 piezas', precio: 180, precio_anterior: 240, descuento: '-25%', categoria: 'Bebés', activo: 1 },
    { id: 23, nombre: 'Alcohol gel 1L', descripcion: 'Antibacterial 70°', precio: 89, precio_anterior: 125, descuento: '-29%', categoria: 'Higiene', activo: 1 },
    { id: 25, nombre: 'Termómetro digital', descripcion: 'Medición rápida', precio: 199, precio_anterior: 299, descuento: '-33%', categoria: 'Equipos', activo: 1 },
    // Precio regular (sin descuento)
    { id: 3, nombre: 'Amoxicilina 500mg', descripcion: 'Caja con 12 cápsulas', precio: 160, categoria: 'Medicamentos', activo: 1 },
    { id: 4, nombre: 'Omeprazol 20mg', descripcion: 'Caja con 14 cápsulas', precio: 110, categoria: 'Medicamentos', activo: 1 },
    { id: 5, nombre: 'Loratadina 10mg', descripcion: 'Caja con 10 tabletas', precio: 75, categoria: 'Medicamentos', activo: 1 },
    { id: 6, nombre: 'Naproxeno 250mg', descripcion: 'Caja con 30 tabletas', precio: 125, categoria: 'Medicamentos', activo: 1 },
    { id: 8, nombre: 'Multivitamínico', descripcion: 'Energía diaria 30 cápsulas', precio: 380, categoria: 'Vitaminas', activo: 1 },
    { id: 9, nombre: 'Vitamina D3 1000UI', descripcion: 'Frasco con 90 cápsulas', precio: 290, categoria: 'Vitaminas', activo: 1 },
    { id: 10, nombre: 'Complejo B', descripcion: 'Frasco con 30 tabletas', precio: 195, categoria: 'Vitaminas', activo: 1 },
    { id: 11, nombre: 'Omega 3', descripcion: 'Frasco con 60 cápsulas', precio: 420, categoria: 'Vitaminas', activo: 1 },
    { id: 12, nombre: 'Zinc 25mg', descripcion: 'Frasco con 60 tabletas', precio: 220, categoria: 'Vitaminas', activo: 1 },
    { id: 14, nombre: 'Losartán 50mg', descripcion: 'Caja con 30 tabletas', precio: 150, categoria: 'Cardiovascular', activo: 1 },
    { id: 15, nombre: 'Metformina 850mg', descripcion: 'Caja con 30 tabletas', precio: 100, categoria: 'Cardiovascular', activo: 1 },
    { id: 17, nombre: 'Protector solar SPF50', descripcion: 'Tubo 60ml', precio: 370, categoria: 'Dermocosmética', activo: 1 },
    { id: 18, nombre: 'Sérum vitamina C', descripcion: 'Frasco 30ml', precio: 560, categoria: 'Dermocosmética', activo: 1 },
    { id: 19, nombre: 'Crema antiarrugas', descripcion: 'Tarro 50ml', precio: 510, categoria: 'Dermocosmética', activo: 1 },
    { id: 21, nombre: 'Jarabe antigripal infantil', descripcion: 'Frasco 120ml', precio: 130, categoria: 'Bebés', activo: 1 },
    { id: 22, nombre: 'Crema para rozaduras', descripcion: 'Tubo 120g', precio: 180, categoria: 'Bebés', activo: 1 },
    { id: 24, nombre: 'Cubrebocas N95', descripcion: 'Paquete con 10 piezas', precio: 165, categoria: 'Higiene', activo: 1 },
    { id: 26, nombre: 'Oxímetro de pulso', descripcion: 'Lectura instantánea', precio: 480, categoria: 'Equipos', activo: 1 },
    { id: 27, nombre: 'Baumanómetro digital', descripcion: 'Brazo, memoria 60', precio: 890, categoria: 'Equipos', activo: 1 },
    { id: 28, nombre: 'Glucómetro kit', descripcion: 'Con 25 tiras reactivas', precio: 560, categoria: 'Equipos', activo: 1 },
];

const usuarios = []; // Usuarios registrados en memoria
const pedidos = [];  // Pedidos en memoria
const contactos = []; // Mensajes de contacto en memoria

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
app.use(express.static(path.join(__dirname, 'public')));
app.use('/JS', express.static(path.join(__dirname, 'JS')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET || 'farmacia_gbc_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

// Variables globales para vistas
app.use((req, res, next) => {
    res.locals.usuario = req.session.usuario || null;
    res.locals.loggedIn = !!req.session.usuario;
    next();
});

// ============ RUTAS — PÁGINAS ============

// Inicio (página única: hero, ofertas, categorías, nosotros, contacto)
app.get('/', (req, res) => {
    const ofertas = productos
        .filter(p => p.activo && p.descuento)
        .sort((a, b) => a.nombre.localeCompare(b.nombre));

    res.render('Inicio', {
        title: 'Farmacia GBC — Tu salud, nuestra prioridad',
        ofertas
    });
});

// Login
app.get('/login', (req, res) => {
    if (req.session.usuario) return res.redirect('/');
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

    const existe = usuarios.find(u => u.correo === correo);
    if (existe) {
        return res.redirect('/login?error=Este correo ya está registrado&register=1');
    }

    const hash = bcrypt.hashSync(password, 10);
    const nuevoUsuario = { id: usuarios.length + 1, nombre, correo, password: hash };
    usuarios.push(nuevoUsuario);

    console.log(`✅ Nuevo usuario: ${nombre} (${correo})`);
    res.redirect('/login?success=Registro exitoso. Inicia sesión con tus credenciales');
});

// Login
app.post('/login', (req, res) => {
    const { correo, password } = req.body;

    if (!correo || !password) {
        return res.redirect('/login?error=Correo y contraseña son obligatorios');
    }

    const usuario = usuarios.find(u => u.correo === correo);

    if (!usuario || !bcrypt.compareSync(password, usuario.password)) {
        return res.redirect('/login?error=Correo o contraseña incorrectos');
    }

    req.session.usuario = { id: usuario.id, nombre: usuario.nombre, correo: usuario.correo };
    console.log(`✅ Login: ${usuario.nombre}`);
    res.redirect('/');
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/'));
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
