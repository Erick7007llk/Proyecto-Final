# Farmacia GBC

## Descripción del Proyecto
Farmacia GBC es una aplicación web diseñada para resolver la gestión integral de una farmacia. El proyecto permite tanto a los clientes interactuar con la tienda en línea (catálogos de productos, carrito de compras) como a los administradores gestionar el negocio a través de un panel de administración completo (gestión de inventario, usuarios, etc.).

## Tecnologías
El proyecto está desarrollado utilizando el stack de Node.js, empleando las siguientes tecnologías y versiones principales:

* **Node.js**: Entorno de ejecución (se recomienda v16 o superior)
* **Express**: `^5.2.1` (Framework web)
* **Express-Handlebars**: `^8.0.2` (Motor de plantillas para las vistas)
* **MySQL2**: `^3.22.3` (Driver de base de datos)
* **Bcryptjs**: `^3.0.3` (Encriptación de contraseñas)
* **Express-Session**: `^1.19.0` (Manejo de sesiones)
* **Dotenv**: `^17.4.2` (Manejo de variables de entorno)

## Instalación
Para configurar y ejecutar este proyecto en tu entorno local, sigue estos pasos:

1. **Clonar el repositorio**:
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd <NOMBRE_DE_LA_CARPETA>
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Configurar la Base de Datos**:
   * Asegúrate de tener MySQL ejecutándose.
   * Importa el archivo `proyecto_rafa6.sql` en tu servidor de base de datos para crear la base de datos `farmacia_gbc` con sus tablas y datos iniciales.

4. **Configurar Variables de Entorno**:
   * Crea un archivo llamado `.env` en la raíz del proyecto.
   * Copia el contenido de `.env.example` (o de la sección de abajo) en tu archivo `.env` y ajusta las credenciales de la base de datos según sea necesario.

5. **Ejecutar el proyecto**:
   ```bash
   npm start
   ```
   *El servidor se iniciará, por defecto, en `http://localhost:5500`.*

## Variables de Entorno
A continuación, se muestra un ejemplo del archivo `.env` (basado en `.env.example`):

```env
PORT=5500
SESSION_SECRET=your_secret_key_here

# Cuenta administrador (login → panel /admin)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123

# MySQL — farmacia_gbc
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=
DB_NAME=farmacia_gbc
```

## Capturas de Pantalla

> **Nota al estudiante:** Reemplaza los enlaces de abajo con las imágenes o rutas reales de las capturas de tu proyecto.

### Interfaz del Sistema
![Evidencia de la Interfaz](./public/img/captura_interfaz.png)


### Base de Datos MySQL
![Evidencia de MySQL](./public/img/captura_bd.png)
*(Captura mostrando las tablas creadas en la base de datos farmacia_gbc)*
