const express = require('express');
const adminService = require('../services/adminService');
const documentosService = require('../services/documentosService');

const DB_MODULES = {
    productos: {
        list: adminService.listAdminProductos,
        create: adminService.createProducto,
        update: adminService.updateProducto,
        remove: adminService.deleteProducto
    },
    proveedores: {
        list: adminService.listProveedores,
        create: adminService.createProveedor,
        update: adminService.updateProveedor,
        remove: adminService.deleteProveedor
    },
    empleados: {
        list: adminService.listEmpleados,
        create: adminService.createEmpleado,
        update: adminService.updateEmpleado,
        remove: adminService.deleteEmpleado
    },
    clientes: {
        list: adminService.listClientes,
        create: adminService.createCliente,
        update: adminService.updateCliente,
        remove: adminService.deleteCliente
    },
    facturas: {
        list: documentosService.listFacturas,
        create: documentosService.createFactura
    },
    compras: {
        list: documentosService.listCompras,
        create: documentosService.createCompra
    }
};

function createAdminRouter(requireAdmin) {
    const router = express.Router();
    router.use(requireAdmin);

    router.get('/:module', async (req, res) => {
        const mod = DB_MODULES[req.params.module];
        if (!mod) return res.status(404).json({ error: 'Módulo no encontrado' });
        if (!mod.list) return res.status(405).json({ error: 'Operación no disponible' });
        try {
            const data = await mod.list();
            res.json(data);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Error al cargar datos' });
        }
    });

    router.post('/:module', async (req, res) => {
        const mod = DB_MODULES[req.params.module];
        if (!mod) return res.status(404).json({ error: 'Módulo no encontrado' });
        if (!mod.create) return res.status(405).json({ error: 'Operación no disponible' });
        try {
            const id = await mod.create(req.body);
            res.status(201).json({ id });
        } catch (err) {
            console.error(err);
            res.status(400).json({ error: err.message || 'Error al crear registro' });
        }
    });

    router.put('/:module/:id', async (req, res) => {
        const mod = DB_MODULES[req.params.module];
        if (!mod) return res.status(404).json({ error: 'Módulo no encontrado' });
        if (!mod.update) return res.status(405).json({ error: 'Operación no disponible' });
        try {
            await mod.update(Number(req.params.id), req.body);
            res.json({ ok: true });
        } catch (err) {
            console.error(err);
            res.status(400).json({ error: err.message || 'Error al actualizar' });
        }
    });

    router.delete('/:module/:id', async (req, res) => {
        const mod = DB_MODULES[req.params.module];
        if (!mod) return res.status(404).json({ error: 'Módulo no encontrado' });
        if (!mod.remove) return res.status(405).json({ error: 'Operación no disponible' });
        try {
            await mod.remove(Number(req.params.id));
            res.json({ ok: true });
        } catch (err) {
            console.error(err);
            res.status(400).json({ error: err.message || 'Error al eliminar' });
        }
    });

    return router;
}

module.exports = { createAdminRouter, DB_MODULES };
