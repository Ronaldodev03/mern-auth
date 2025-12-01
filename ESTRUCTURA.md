# Estructura del Proyecto MERN-Auth

Este documento describe la estructura y organización del proyecto de autenticación MERN (MongoDB, Express, React, Node.js).

## Estructura General

```
MERN-Auth/
├── api/                    # Backend (servidor Node.js + Express)
├── client/                 # Frontend (aplicación React)
├── .env                    # Variables de entorno
├── .gitignore             # Archivos ignorados por Git
├── package.json           # Dependencias del proyecto raíz
└── README.md              # Documentación principal
```

## Backend (API)

La carpeta `api/` contiene todo el código del servidor:

```
api/
├── controllers/           # Lógica de negocio
│   ├── auth.controller.js    # Controlador de autenticación
│   └── user.controller.js    # Controlador de usuarios
├── models/               # Modelos de base de datos (Mongoose)
│   └── user.model.js        # Modelo de usuario
├── routes/               # Definición de rutas
│   ├── auth.route.js        # Rutas de autenticación
│   └── user.route.js        # Rutas de usuario
├── utils/                # Utilidades y helpers
│   ├── error.js            # Manejador de errores
│   └── verifyUser.js       # Middleware de verificación JWT
└── index.js              # Punto de entrada del servidor
```

### Descripción de Componentes Backend

**Controllers**
- `auth.controller.js`: Maneja signup, signin, autenticación con Google y signout
- `user.controller.js`: Maneja operaciones CRUD de usuarios (actualizar, eliminar)

**Models**
- `user.model.js`: Schema de Mongoose para usuarios (username, email, password, profilePicture)

**Routes**
- `auth.route.js`: Define endpoints `/api/auth/*`
- `user.route.js`: Define endpoints `/api/user/*`

**Utils**
- `error.js`: Función helper para crear errores personalizados
- `verifyUser.js`: Middleware que verifica tokens JWT en las cookies

**index.js**
- Configura Express
- Conecta a MongoDB
- Define middleware (express.json, cookie-parser)
- Configura rutas
- Sirve archivos estáticos del cliente en producción
- Maneja errores globales

## Frontend (Client)

La carpeta `client/` contiene la aplicación React con Vite:

```
client/
├── public/               # Archivos públicos estáticos
├── src/                  # Código fuente
│   ├── components/       # Componentes reutilizables
│   │   ├── Layout.jsx       # Layout principal
│   │   ├── OAth.jsx        # Botón de autenticación con Google
│   │   └── PrivateRoute.jsx # Componente de ruta protegida
│   ├── pages/            # Páginas de la aplicación
│   │   ├── About.jsx        # Página About
│   │   ├── Home.jsx         # Página de inicio
│   │   ├── Profile.jsx      # Perfil de usuario
│   │   ├── SignIn.jsx       # Página de inicio de sesión
│   │   └── SignUp.jsx       # Página de registro
│   ├── redux/            # Estado global con Redux Toolkit
│   │   ├── store.js         # Configuración del store con redux-persist
│   │   └── user/
│   │       └── userSlice.js # Slice de usuario (actions y reducers)
│   ├── firebase.js       # Configuración de Firebase
│   ├── index.css         # Estilos globales (Tailwind)
│   └── main.jsx          # Punto de entrada de React
├── .eslintrc.cjs         # Configuración de ESLint
├── index.html            # HTML principal
├── package.json          # Dependencias del cliente
├── postcss.config.js     # Configuración de PostCSS
├── tailwind.config.js    # Configuración de Tailwind CSS
└── vite.config.js        # Configuración de Vite
```

### Descripción de Componentes Frontend

**Components**
- `Layout.jsx`: Estructura general de la aplicación (header, outlet, etc.)
- `OAth.jsx`: Implementa autenticación con Google usando Firebase
- `PrivateRoute.jsx`: Protege rutas que requieren autenticación

**Pages**
- `SignUp.jsx`: Formulario de registro con validación
- `SignIn.jsx`: Formulario de inicio de sesión
- `Profile.jsx`: Página de perfil con opciones de edición y eliminación
- `Home.jsx`: Página principal
- `About.jsx`: Página informativa

**Redux**
- `store.js`: Configura el store con redux-persist para mantener el estado en localStorage
- `userSlice.js`: Maneja el estado del usuario (signIn, update, delete, signOut)

**Firebase**
- `firebase.js`: Inicializa Firebase para autenticación con Google

## Tecnologías Utilizadas

### Backend
- **Node.js** - Runtime de JavaScript
- **Express** - Framework web
- **MongoDB** - Base de datos NoSQL
- **Mongoose** - ODM para MongoDB
- **bcryptjs** - Encriptación de contraseñas
- **jsonwebtoken** - Generación y verificación de JWT
- **cookie-parser** - Manejo de cookies
- **dotenv** - Variables de entorno
- **nodemon** - Recarga automática en desarrollo

### Frontend
- **React** - Librería de UI
- **Vite** - Build tool y dev server
- **React Router DOM** - Enrutamiento
- **Redux Toolkit** - Gestión de estado global
- **Redux Persist** - Persistencia del estado
- **Firebase** - Autenticación con Google
- **Tailwind CSS** - Framework de CSS
- **ESLint** - Linting de código

## Flujo de Datos

1. El cliente (React) hace peticiones HTTP a `/api/*`
2. En desarrollo, Vite proxy las peticiones al servidor Express (puerto 3000)
3. Express recibe la petición y la enruta al controlador apropiado
4. El controlador interactúa con MongoDB a través de Mongoose
5. La respuesta se envía de vuelta al cliente
6. Redux actualiza el estado global
7. Redux Persist guarda el estado en localStorage
8. Los componentes de React se re-renderizan con los nuevos datos

## Variables de Entorno

El archivo `.env` contiene:
- `MONGO`: URI de conexión a MongoDB Atlas
- `JWT_SECRET`: Clave secreta para firmar tokens JWT
- `VITE_FIREBASE_API_KEY`: API key de Firebase (en el cliente)
