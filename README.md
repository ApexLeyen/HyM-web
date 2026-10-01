# 🚀 HyM Multiservices - Migración a Node.js + Express + SQLite

Este proyecto es la migración completa del sitio WordPress (creado en LocalWP) hacia una aplicación moderna, ligera y de alto rendimiento construida con **Node.js**, **Express**, **SQLite** y JavaScript nativo, **sin depender de PHP ni WordPress**.

---

## 📋 ¿Qué se ha realizado?

1. **Extracción de datos desde `local.sql` (`extract_products.js`)**:
   - Analizador robusto de MySQL dump que extrae productos de `wp_posts`, precios y metadatos de `wp_postmeta`, lookup de WooCommerce (`wp_wc_product_meta_lookup`), categorías de taxonomías y enlaces a imágenes/adjuntos.
   - Corrige problemas de codificación (acentos y caracteres especiales en español decodificados en UTF-8).
   - Genera el archivo limpio `products.json` con 49 productos completos.

2. **Base de datos SQLite y capa de datos (`db.js`)**:
   - Base de datos local en `data/database.sqlite` usando `better-sqlite3` con modo WAL activado para máxima velocidad.
   - Migración y siembra automática: Si la tabla `products` está vacía, se auto-rellena inmediatamente desde `products.json`.
   - Soporte para filtros por categoría, búsqueda por texto/SKU, y estados de stock.

3. **API RESTful en Express (`routes/products.js`)**:
   - `GET /api/products`: Listado de productos con soporte para búsqueda (`?search=`), categoría (`?category=`) y estado (`?status=`).
   - `GET /api/products/:id`: Obtener detalles de un producto por ID.
   - `POST /api/products`: Crear un nuevo producto (soporta tanto JSON como formulario con subida de imagen vía `multer`).
   - `PUT /api/products/:id`: Actualizar datos o imagen de un producto existente.
   - `DELETE /api/products/:id`: Eliminar producto permanentemente.
   - `GET /api/products/stats`: Métricas en tiempo real (total productos, en stock, agotados, categorías).
   - `GET /api/products/categories`: Lista de categorías activas.
   - `POST /api/products/upload`: Endpoint para subir imágenes a `/uploads/`.

4. **Panel de Administración (`public/admin/index.html`)**:
   - Interfaz moderna y responsive diseñada con los colores corporativos de HyM.
   - Tarjetas de estadísticas en vivo (Total productos, en stock, agotados, categorías).
   - Tabla interactiva con miniaturas, SKU, categorías, precios y badges de stock.
   - Barra de búsqueda en tiempo real y filtros rápidos por categoría y estado.
   - Modal para **Agregar** y **Editar** productos con vista previa de imagen (archivo local o URL).
   - Modal de confirmación para **Eliminar** productos con alertas Toast de notificación.

5. **Página Principal con diseño Elementor (`public/index.html`)**:
   - Todo el diseño visual original extraído directamente de la instalación LocalWP (cabecera Astra, sliders de fotos, tipografías Montserrat y Noto Sans, sección de servicios técnicos).
   - Integración de la **nueva cuadrícula de productos dinámica**:
     - Carga los productos desde la API (`/api/products`) vía `fetch` asíncrono sin recargar la página.
     - Filtros por pestañas de categoría ("Todos", "Dispositivos Móviles", "Audio").
     - Buscador en vivo con contador de resultados.
     - Tarjetas de producto con efecto hover, precios (con descuento tachado si aplica) y estado de disponibilidad.
     - Modal de detalles técnicos para cada producto.
     - Botón de pedido directo por WhatsApp con mensaje pre-rellenado.

---

## 🛠️ Cómo ejecutar el proyecto

### 1. Iniciar la aplicación
Abre una terminal PowerShell o CMD en esta carpeta (`HyM-web`) y ejecuta:

```bash
npm start
```

O en modo desarrollo (recarga automática ante cambios):
```bash
npm run dev
```

### 2. Acceder a las rutas
- 🌐 **Sitio Web Principal (Diseño Elementor + Catálogo API):** [http://localhost:3000/](http://localhost:3000/)
- ⚙️ **Panel de Administración:** [http://localhost:3000/admin](http://localhost:3000/admin)
- 📦 **API REST de Productos:** [http://localhost:3000/api/products](http://localhost:3000/api/products)

---

## 🔄 Re-extraer datos desde `local.sql`

Si en el futuro actualizas el archivo `app/sql/local.sql` y deseas volver a exportar a JSON:

```bash
npm run extract
```
o
```bash
node extract_products.js
```

---

## 📁 Estructura del Proyecto

```text
HyM-web/
├── app/
│   ├── public/             # Copia de seguridad original de WordPress
│   └── sql/local.sql       # Respaldo de base de datos MySQL original
├── data/
│   └── database.sqlite     # Base de datos SQLite activa de la aplicación
├── public/                 # Archivos servidos por Express
│   ├── admin/
│   │   └── index.html      # Panel de Administración de productos
│   ├── index.html          # Página principal (Diseño Elementor + Catálogo dinámico)
│   ├── uploads/            # Carpeta para imágenes nuevas y existentes
│   ├── wp-content/         # CSS, JS, fuentes e imágenes del tema Astra y Elementor
│   └── wp-includes/        # Dependencias JS del frontend
├── routes/
│   └── products.js         # Rutas de la API de productos y subida de archivos
├── db.js                   # Capa SQLite (better-sqlite3) y auto-seed
├── extract_products.js     # Script de extracción de local.sql a products.json
├── package.json            # Dependencias y scripts de Node.js
├── products.json           # JSON con los 49 productos extraídos
├── server.js               # Servidor Express principal
└── README.md               # Esta documentación
```
