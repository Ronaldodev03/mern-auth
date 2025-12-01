# Guía de Despliegue - MERN-Auth

Este documento explica cómo desplegar la aplicación MERN-Auth en Render, incluyendo la configuración de los scripts y las variables de entorno necesarias.

## Arquitectura de Despliegue

La aplicación se despliega en **Render** utilizando dos servicios:

1. **Web Service**: Sirve tanto el backend (API) como el frontend (cliente) desde un único servicio
2. **MongoDB Atlas**: Base de datos hospedada en la nube

## Scripts del Proyecto

### Package.json (Raíz)

El `package.json` en la raíz del proyecto contiene los siguientes scripts:

```json
{
  "scripts": {
    "dev": "nodemon api/index.js",
    "start": "node api/index.js",
    "build": "npm install && npm install --prefix client && npm run build --prefix client"
  }
}
```

#### Descripción de Scripts

- **`dev`**: Inicia el servidor en modo desarrollo con nodemon
  - Ejecuta: `nodemon api/index.js`
  - Uso: Para desarrollo local
  - Nodemon reinicia automáticamente el servidor cuando detecta cambios

- **`start`**: Inicia el servidor en modo producción
  - Ejecuta: `node api/index.js`
  - Uso: Para producción en Render
  - Este es el comando que Render ejecuta automáticamente

- **`build`**: Construye todo el proyecto para producción
  - Ejecuta tres pasos:
    1. `npm install` - Instala dependencias del backend
    2. `npm install --prefix client` - Instala dependencias del frontend
    3. `npm run build --prefix client` - Construye el cliente con Vite
  - Uso: Render ejecuta este comando antes de iniciar la aplicación

### Package.json (Client)

El `client/package.json` contiene los scripts del frontend:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  }
}
```

#### Descripción de Scripts del Cliente

- **`dev`**: Inicia el servidor de desarrollo de Vite (puerto 5173 por defecto)
- **`build`**: Construye la aplicación React para producción
  - Genera archivos optimizados en `client/dist/`
  - Minifica y optimiza el código
- **`lint`**: Ejecuta ESLint para verificar la calidad del código
- **`preview`**: Previsualiza la build de producción localmente

## Configuración de Render

### Paso 1: Preparar el Repositorio

1. Asegúrate de que tu código esté en GitHub
2. Verifica que `.env` esté en `.gitignore` (no debe subirse al repositorio)
3. Haz commit y push de todos los cambios

### Paso 2: Crear Web Service en Render

1. Ve a [Render Dashboard](https://dashboard.render.com/)
2. Haz clic en "New +" → "Web Service"
3. Conecta tu repositorio de GitHub
4. Configura el servicio:

#### Configuración Básica

- **Name**: `mern-auth` (o el nombre que prefieras)
- **Region**: Selecciona la región más cercana
- **Branch**: `main` (o la rama que uses)
- **Root Directory**: Dejar vacío (raíz del proyecto)
- **Runtime**: `Node`
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Instance Type**: `Free` (o el plan que prefieras)

### Paso 3: Variables de Entorno

En la sección "Environment" de Render, agrega las siguientes variables:

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `MONGO` | `mongodb+srv://usuario:contraseña@cluster.mongodb.net/database` | URI de MongoDB Atlas |
| `JWT_SECRET` | `tu_secreto_jwt` | Clave secreta para JWT (genera una segura) |
| `NODE_ENV` | `production` | Entorno de Node.js |

**Importante**: No uses las credenciales del archivo `.env` local en producción. Genera nuevas credenciales seguras.

### Paso 4: Configurar MongoDB Atlas

1. Ve a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crea un cluster (si no tienes uno)
3. En "Network Access", agrega la IP de Render o permite acceso desde cualquier lugar (`0.0.0.0/0`)
4. En "Database Access", crea un usuario con permisos de lectura/escritura
5. Obtén la URI de conexión y agrégala como variable de entorno `MONGO` en Render

### Paso 5: Configurar Firebase (para Google Auth)

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. En "Authentication", habilita "Google" como proveedor
3. Agrega tu dominio de Render a los dominios autorizados
4. En el código del cliente, asegúrate de que la variable `VITE_FIREBASE_API_KEY` esté configurada

Para agregar variables de entorno en el cliente en Render:

1. En Render, ve a "Environment"
2. Agrega: `VITE_FIREBASE_API_KEY` con tu API key de Firebase

## Flujo de Despliegue

### Despliegue Automático

Render detecta automáticamente los cambios en tu rama principal y redespliega:

1. **Push a GitHub**: Haces `git push` a la rama `main`
2. **Render detecta cambios**: Webhook activa el build
3. **Build Phase**: Ejecuta `npm run build`
   - Instala dependencias del backend
   - Instala dependencias del frontend
   - Construye el cliente con Vite → genera `client/dist/`
4. **Deploy Phase**: Ejecuta `npm start`
   - Inicia el servidor Express
   - Express sirve los archivos estáticos de `client/dist/`
5. **Live**: La aplicación está disponible en `https://tu-app.onrender.com`

### Despliegue Manual

También puedes desplegar manualmente desde el Dashboard de Render:

1. Ve a tu servicio en Render
2. Haz clic en "Manual Deploy" → "Deploy latest commit"

## Cómo Funciona en Producción

### Servidor Único

El archivo [api/index.js](api/index.js) está configurado para servir tanto la API como el cliente:

```javascript
// Sirve archivos estáticos del cliente
app.use(express.static(path.join(__dirname, "/client/dist")));

// Redirige todas las rutas no-API al index.html del cliente
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "dist", "index.html"));
});
```

#### ¿Qué significa "servir archivos estáticos"?

**Archivos estáticos** son archivos que no cambian y se envían tal cual al navegador:
- HTML (`.html`)
- CSS (`.css`)
- JavaScript compilado (`.js`)
- Imágenes (`.png`, `.jpg`, `.svg`)
- Fuentes, etc.

**"Servir"** significa que el servidor **entrega/envía** estos archivos al navegador cuando los solicita.

#### ¿Qué contiene `client/dist/`?

Cuando ejecutas `npm run build`, Vite genera archivos optimizados:

```
client/dist/
├── index.html          ← Página principal
├── assets/
│   ├── index-abc123.js  ← JavaScript compilado y minificado
│   └── index-xyz456.css ← CSS compilado y minificado
└── vite.svg            ← Imágenes y assets
```

#### Flujo completo cuando un usuario visita tu app:

```
1. Usuario escribe: https://tu-app.onrender.com
   ↓
2. Servidor Express recibe la petición GET /
   ↓
3. app.get("*") captura la petición
   ↓
4. Express envía client/dist/index.html al navegador
   ↓
5. El navegador lee index.html que contiene:
   <script src="/assets/index-abc123.js"></script>
   <link href="/assets/index-xyz456.css">
   ↓
6. Navegador solicita: GET /assets/index-abc123.js
   ↓
7. express.static() encuentra el archivo en client/dist/assets/
   ↓
8. Express ENVÍA el archivo JavaScript
   ↓
9. Se repite para CSS, imágenes, etc.
   ↓
10. React se carga y toma el control de la aplicación
```

#### Analogía Simple

Imagina que Express es un **bibliotecario**:
- `express.static(path.join(__dirname, "/client/dist"))` = "Estos libros están disponibles para préstamo en este estante"
- Cuando alguien pide un libro (archivo), el bibliotecario lo encuentra y se lo entrega
- Si alguien pide un libro que no existe en ese estante, pasa al siguiente middleware

#### Sobre `path.join()` - Mejores Prácticas

`path.join()` es una función que **une partes de rutas** de forma segura y compatible con cualquier sistema operativo.

**¿Por qué usar `path.join()`?**

Diferentes sistemas operativos usan diferentes separadores:
- **Windows**: `\` (backslash) → `C:\Users\ronal\Desktop`
- **Linux/Mac**: `/` (forward slash) → `/home/user/desktop`

`path.join()` usa el separador correcto automáticamente.

**Forma CORRECTA vs INCORRECTA**:

```javascript
// ❌ INCORRECTO - Mezcla "/" manual con path.join()
path.join(__dirname, "/client/dist")

// ✅ CORRECTO - Separa cada parte con comas
path.join(__dirname, "client", "dist")

// ❌ INCORRECTO - Concatenación manual
__dirname + "/client/dist/index.html"

// ✅ CORRECTO - path.join() maneja todo
path.join(__dirname, "client", "dist", "index.html")
```

**¿Por qué separar con comas?**

1. **Es el propósito de `path.join()`**: La función fue diseñada para que NO tengas que poner `/`
2. **Más legible**: Se ve la jerarquía claramente
3. **Evita errores**: No hay barras duplicadas o problemas de separadores

```javascript
// Se lee como: __dirname → client → dist → assets → images
path.join(__dirname, "client", "dist", "assets", "images")
```

**Ejemplos correctos**:

```javascript
// ✅ Ruta a archivo
path.join(__dirname, "client", "dist", "index.html")

// ✅ Ruta a carpeta
path.join(__dirname, "api", "controllers")

// ✅ Subir un nivel con ".."
path.join(__dirname, "..", "otherFolder", "file.txt")

// ✅ Con variables
const folder = "uploads";
const filename = "photo.jpg";
path.join(__dirname, folder, filename)
```

**En tu código**:

```javascript
// Así está en el código actual (funciona, pero no es la mejor práctica)
app.use(express.static(path.join(__dirname, "/client/dist")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "dist", "index.html"));
});

// Así debería estar (mejor práctica consistente)
app.use(express.static(path.join(__dirname, "client", "dist")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "dist", "index.html"));
});
```

**Regla general**: Cuando uses `path.join()`, separa cada carpeta/archivo con comas y deja que `path.join()` maneje los separadores.

#### ¿Por qué es necesario en producción?

En producción **NO tienes Vite corriendo** (Vite solo se usa en desarrollo). Por lo tanto:

**Sin `express.static()`**:
- ❌ Los archivos CSS y JS no se cargarían
- ❌ Verías solo texto plano sin estilos
- ❌ JavaScript no funcionaría, sin interactividad

**Con `express.static()`**:
- ✅ Tu aplicación React funciona perfectamente
- ✅ Con estilos, imágenes e interactividad
- ✅ Un solo servidor maneja todo

**Flujo de peticiones**:
- `/api/*` → Rutas de la API (Express)
- `/assets/*` → Archivos estáticos de `client/dist/assets/` (CSS, JS, imágenes)
- Cualquier otra ruta → `client/dist/index.html` (React Router toma el control)

### Proxy en Desarrollo vs Producción

#### ¿Qué es un Proxy y por qué lo necesitamos?

Un **proxy** es un **intermediario** que redirige peticiones de un lugar a otro.

**El problema en desarrollo**:

En desarrollo tienes **2 servidores corriendo simultáneamente**:
- Frontend (Vite) en `http://localhost:5173`
- Backend (Express) en `http://localhost:3000`

Cuando tu código React hace:
```javascript
fetch("/api/auth/signin")
```

El navegador busca en `http://localhost:5173/api/auth/signin` ❌ (No existe)
Pero tu API está en `http://localhost:3000/api/auth/signin` ✅ (Aquí está)

**La solución**: Configurar un proxy en Vite que diga: "Cuando veas `/api`, redirige al puerto 3000"

```javascript
// client/vite.config.js
server: {
  proxy: {
    "/api": {
      target: "http://localhost:3000",  // Redirige aquí
      secure: false,
    },
  },
}
```

**Flujo con proxy**:
```
Tu código:           fetch("/api/auth/signin")
                            ↓
Vite (5173):        "Veo /api, lo redirijo..."
                            ↓
Express (3000):     Recibe y procesa /api/auth/signin ✅
```

**En producción NO necesitas proxy** porque todo está en el mismo servidor (un solo puerto).

#### En Desarrollo (2 servidores separados)

**Terminal 1** - Backend:
```bash
npm run dev  # nodemon api/index.js
→ Express corriendo en http://localhost:3000
```

**Terminal 2** - Frontend:
```bash
cd client
npm run dev  # vite
→ Vite corriendo en http://localhost:5173
```

**Configuración de Vite** ([client/vite.config.js](client/vite.config.js)):
```javascript
server: {
  proxy: {
    "/api": {
      target: "http://localhost:3000",
      secure: false,
    },
  },
}
```

**Flujo en desarrollo**:
```
Usuario → http://localhost:5173
            ↓
┌───────────────────────────────────┐
│  Vite Dev Server (puerto 5173)   │
│  - Sirve archivos de React       │
│  - Hot Module Replacement (HMR)  │
└───────────┬───────────────────────┘
            │
            │ Petición a /api/auth/signin
            │ (Proxy redirige →)
            ↓
┌───────────────────────────────────┐
│  Express Server (puerto 3000)    │
│  - Maneja rutas /api/*           │
│  - Conecta a MongoDB             │
└───────────────────────────────────┘
```

**Ventajas en desarrollo**:
- ✅ Hot Reload instantáneo (cambios en React se ven inmediatamente)
- ✅ Mejor experiencia de desarrollo
- ✅ Separación clara entre frontend y backend

#### En Producción (1 servidor único)

```bash
npm start  # node api/index.js
→ Express corriendo en puerto 3000 (o el que asigne Render)
```

**Flujo en producción**:
```
Usuario → https://tu-app.onrender.com
            ↓
┌─────────────────────────────────────────────┐
│     Express Server (puerto 3000)            │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  Middleware: express.static()       │   │
│  │  Sirve: client/dist/*               │   │
│  │  (HTML, CSS, JS, imágenes)          │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  Rutas API: /api/*                  │   │
│  │  - /api/auth/signin                 │   │
│  │  - /api/auth/signup                 │   │
│  │  - /api/user/update/:id             │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  Fallback: app.get("*")             │   │
│  │  Sirve: index.html                  │   │
│  │  (Para React Router)                │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

**Peticiones en producción**:

| Petición | Manejado por | Resultado |
|----------|--------------|-----------|
| `GET /` | `app.get("*")` | Devuelve `client/dist/index.html` |
| `GET /assets/index-abc.js` | `express.static()` | Devuelve el archivo JavaScript |
| `GET /assets/index-xyz.css` | `express.static()` | Devuelve el archivo CSS |
| `POST /api/auth/signin` | `authRoutes` | Procesa login y devuelve JSON |
| `GET /profile` | `app.get("*")` | Devuelve `index.html`, React Router muestra Profile |

**Ventajas en producción**:
- ✅ Un solo servidor = Más simple de desplegar
- ✅ Menos costos (solo un servicio en Render)
- ✅ Sin necesidad de configurar CORS
- ✅ Menos latencia (todo en el mismo servidor)

## Logs y Monitoreo

### Ver Logs en Render

1. Ve a tu servicio en Render
2. Haz clic en "Logs"
3. Puedes ver logs en tiempo real del servidor

### Errores Comunes

**Error: "Cannot find module"**
- Solución: Verifica que todas las dependencias estén en `package.json`

**Error: "MONGO connection failed"**
- Solución: Verifica la variable `MONGO` y que la IP de Render esté permitida en MongoDB Atlas

**Error: "Build failed"**
- Solución: Ejecuta `npm run build` localmente para replicar el error

## Comandos Útiles Localmente

```bash
# Desarrollo - Backend (terminal 1)
npm run dev

# Desarrollo - Frontend (terminal 2)
cd client
npm run dev

# Probar build de producción localmente
npm run build
npm start

# Linting del código
cd client
npm run lint
```

## Actualizar la Aplicación

1. Haz cambios en tu código
2. Prueba localmente
3. Commit y push:
```bash
git add .
git commit -m "Descripción de cambios"
git push origin main
```
4. Render automáticamente detectará los cambios y redespliegará

## Rollback (Revertir Despliegue)

Si un despliegue falla:

1. Ve al Dashboard de Render
2. En "Events", encuentra un despliegue anterior exitoso
3. Haz clic en "Redeploy" en ese commit específico

## Costos

- **Render Free Tier**:
  - 750 horas/mes gratis
  - El servicio se duerme después de 15 minutos de inactividad
  - Primera petición puede tardar ~30 segundos (cold start)
- **MongoDB Atlas Free Tier**:
  - 512 MB de almacenamiento gratis
  - Suficiente para proyectos pequeños

## Mejores Prácticas

1. **Nunca** commitear el archivo `.env` al repositorio
2. Usar secretos seguros y únicos para producción
3. Monitorear logs regularmente
4. Configurar alertas en Render para errores
5. Hacer backups regulares de MongoDB Atlas
6. Usar ramas de desarrollo antes de desplegar a producción
