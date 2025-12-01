# Sistema de Autenticación - MERN-Auth

Este documento explica en detalle cómo funciona el sistema de autenticación en la aplicación MERN-Auth, incluyendo registro, inicio de sesión, autenticación con Google, protección de rutas y gestión de sesiones.

## Tabla de Contenidos

1. [Arquitectura General](#arquitectura-general)
2. [Tecnologías Utilizadas](#tecnologías-utilizadas)
3. [Modelo de Usuario](#modelo-de-usuario)
4. [Flujos de Autenticación](#flujos-de-autenticación)
5. [Middleware de Verificación](#middleware-de-verificación)
6. [Estado Global con Redux](#estado-global-con-redux)
7. [Rutas Protegidas](#rutas-protegidas)
8. [Seguridad](#seguridad)

## Arquitectura General

El sistema de autenticación utiliza **JSON Web Tokens (JWT)** almacenados en cookies HTTP-only para mantener la sesión del usuario.

### Componentes Principales

**Backend**:
- Modelo de Usuario (Mongoose)
- Controladores de autenticación
- Middleware de verificación JWT
- Rutas de autenticación

**Frontend**:
- Redux Toolkit para gestión de estado
- Redux Persist para persistencia
- Firebase para autenticación con Google
- Componentes de autenticación

## Tecnologías Utilizadas

### Backend
- **bcryptjs**: Encriptación de contraseñas (hashing)
- **jsonwebtoken**: Generación y verificación de JWT
- **cookie-parser**: Lectura de cookies en Express
- **Mongoose**: ODM para MongoDB

### Frontend
- **Redux Toolkit**: Gestión de estado global
- **Redux Persist**: Persistencia del estado en localStorage
- **Firebase Auth**: Autenticación con Google OAuth 2.0

## Modelo de Usuario

El modelo de usuario se define en [api/models/user.model.js](api/models/user.model.js):

```javascript
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  profilePicture: {
    type: String,
    default: "https://img.freepik.com/premium-vector/man-avatar-profile-picture-vector-illustration_268834-538.jpg",
  },
}, { timestamps: true });
```

### Campos del Usuario

- **username**: Nombre único del usuario
- **email**: Correo electrónico único
- **password**: Contraseña hasheada con bcrypt (nunca se almacena en texto plano)
- **profilePicture**: URL de la foto de perfil
- **timestamps**: Mongoose agrega automáticamente `createdAt` y `updatedAt`

## Flujos de Autenticación

### 1. Registro de Usuario (Sign Up)

**Archivo Frontend**: [client/src/pages/SignUp.jsx](client/src/pages/SignUp.jsx)
**Archivo Backend**: [api/controllers/auth.controller.js](api/controllers/auth.controller.js) (función `signup`)

#### Flujo:

```
Cliente → POST /api/auth/signup
   ↓
1. Usuario completa el formulario (username, email, password)
2. Frontend valida que los campos no estén vacíos
3. Se envía petición POST con los datos
   ↓
Servidor:
4. Recibe los datos en el controlador `signup`
5. Hashea la contraseña con bcrypt (10 rondas de salt)
6. Crea un nuevo documento de usuario en MongoDB
7. Guarda el usuario
8. Responde con mensaje de éxito (201)
   ↓
Cliente:
9. Redirige al usuario a la página de Sign In
```

#### Código Backend (Registro):

```javascript
export const signup = async (req, res, next) => {
  const { username, email, password } = req.body;

  // Hashear contraseña
  const hashedPassword = bcryptjs.hashSync(password, 10);

  const newUser = new User({
    username,
    email,
    password: hashedPassword
  });

  try {
    await newUser.save();
    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    next(error); // Manejo de errores (ej: email duplicado)
  }
};
```

### 2. Inicio de Sesión (Sign In)

**Archivo Frontend**: [client/src/pages/SignIn.jsx](client/src/pages/SignIn.jsx)
**Archivo Backend**: [api/controllers/auth.controller.js](api/controllers/auth.controller.js) (función `signin`)

#### Flujo:

```
Cliente → POST /api/auth/signin
   ↓
1. Usuario ingresa email y password
2. Redux: dispatch(signInStart()) - Loading = true
3. Se envía petición POST
   ↓
Servidor:
4. Busca usuario por email en MongoDB
5. Si no existe → Error 404 "User not found"
6. Compara contraseña con bcrypt.compareSync()
7. Si no coincide → Error 401 "Wrong credentials"
8. Genera JWT con el ID del usuario
   jwt.sign({ id: user._id }, JWT_SECRET)
9. Crea cookie HTTP-only con el token (expira en 1 hora)
10. Responde con datos del usuario (sin password)
   ↓
Cliente:
11. Redux: dispatch(signInSuccess(data))
12. Guarda usuario en estado global
13. Redux Persist guarda en localStorage
14. Redirige a la página principal
```

#### Código Backend (Inicio de Sesión):

```javascript
export const signin = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    // 1. Buscar usuario
    const validUser = await User.findOne({ email });
    if (!validUser) return next(errorHandler(404, "User not found"));

    // 2. Verificar contraseña
    const validPassword = bcryptjs.compareSync(password, validUser.password);
    if (!validPassword) return next(errorHandler(401, "Wrong credentials"));

    // 3. Generar JWT
    const token = jwt.sign({ id: validUser._id }, process.env.JWT_SECRET);

    // 4. Excluir password de la respuesta
    const { password: hashedPassword, ...rest } = validUser._doc;

    // 5. Enviar cookie y datos del usuario
    const expiryDate = new Date(Date.now() + 3600000); // 1 hora
    res
      .cookie("access_token", token, {
        httpOnly: true,
        expires: expiryDate
      })
      .status(200)
      .json(rest);
  } catch (error) {
    next(error);
  }
};
```

### 3. Autenticación con Google

**Archivo Frontend**: [client/src/components/OAth.jsx](client/src/components/OAth.jsx)
**Archivo Backend**: [api/controllers/auth.controller.js](api/controllers/auth.controller.js) (función `google`)

#### Flujo:

```
Cliente → Firebase → POST /api/auth/google
   ↓
1. Usuario hace clic en "Continue with Google"
2. Firebase abre popup de Google OAuth
3. Usuario selecciona su cuenta de Google
4. Firebase devuelve: displayName, email, photoURL
5. Se envía esta información al backend
   ↓
Servidor:
6. Busca si el email ya existe en la base de datos

   Caso A - Usuario Existente:
   7a. Genera JWT
   8a. Envía cookie y datos del usuario

   Caso B - Usuario Nuevo:
   7b. Genera username único (nombre + números random)
   8b. Genera contraseña aleatoria hasheada
   9b. Crea nuevo usuario con la foto de Google
   10b. Genera JWT
   11b. Envía cookie y datos del usuario
   ↓
Cliente:
12. Redux: dispatch(signInSuccess(data))
13. Redirige a la página principal
```

#### Código Frontend (Google OAuth):

```javascript
const handleGoogleClick = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const auth = getAuth(app);
    const result = await signInWithPopup(auth, provider);

    // Enviar datos de Google al backend
    const res = await fetch("/api/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: result.user.displayName,
        email: result.user.email,
        photo: result.user.photoURL,
      }),
    });

    const data = await res.json();
    dispatch(signInSuccess(data));
    navigate("/");
  } catch (error) {
    console.log("could not login with google", error);
  }
};
```

### 4. Cerrar Sesión (Sign Out)

**Archivo Backend**: [api/controllers/auth.controller.js](api/controllers/auth.controller.js) (función `signout`)

#### Flujo:

```
Cliente → GET /api/auth/signout
   ↓
1. Usuario hace clic en "Sign Out"
   ↓
Servidor:
2. Elimina la cookie "access_token"
3. Responde con mensaje de éxito
   ↓
Cliente:
4. Redux: dispatch(signOut())
5. Limpia el estado global (currentUser = null)
6. Redux Persist actualiza localStorage
7. Redirige a la página de Sign In
```

## Middleware de Verificación

El middleware [api/utils/verifyUser.js](api/utils/verifyUser.js) protege rutas que requieren autenticación.

### Funcionamiento:

```javascript
export const verifyToken = (req, res, next) => {
  // 1. Leer token de la cookie
  const token = req.cookies.access_token;

  // 2. Verificar si existe
  if (!token) return next(errorHandler(401, "You are not authenticated!"));

  // 3. Verificar validez del token
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return next(errorHandler(403, "Token is not valid!"));

    // 4. Agregar usuario al objeto request
    req.user = user; // { id: "user_id" }
    next();
  });
};
```

### Uso en Rutas:

```javascript
// api/routes/user.route.js
router.post("/update/:id", verifyToken, updateUser);
router.delete("/delete/:id", verifyToken, deleteUser);
```

El middleware:
1. Extrae el token de la cookie
2. Verifica que sea válido
3. Decodifica el payload (ID del usuario)
4. Agrega `req.user` para que el controlador pueda usarlo
5. Continúa al siguiente middleware/controlador

### Verificación de Autorización:

En los controladores, se verifica que el usuario solo pueda modificar su propia cuenta:

```javascript
export const updateUser = async (req, res, next) => {
  // Verificar que el usuario del token sea el mismo que el ID del parámetro
  if (req.user.id !== req.params.id) {
    return next(errorHandler(401, "You can update only your account!"));
  }
  // ... resto del código
};
```

## Estado Global con Redux

### User Slice

El archivo [client/src/redux/user/userSlice.js](client/src/redux/user/userSlice.js) maneja el estado del usuario.

#### Estado Inicial:

```javascript
const initialState = {
  currentUser: null,    // Datos del usuario autenticado
  loading: false,       // Indicador de carga
  error: false,         // Mensaje de error
};
```

#### Acciones Principales:

**Sign In**:
- `signInStart()`: Inicia el proceso (loading = true)
- `signInSuccess(userData)`: Guarda datos del usuario
- `signInFailure(error)`: Guarda mensaje de error

**Update User**:
- `updateUserStart()`
- `updateUserSuccess(userData)`
- `updateUserFailure(error)`

**Delete User**:
- `deleteUserStart()`
- `deleteUserSuccess()`: Limpia el estado (currentUser = null)
- `deleteUserFailure(error)`

**Sign Out**:
- `signOut()`: Resetea el estado a inicial

### Persistencia con Redux Persist

El archivo [client/src/redux/store.js](client/src/redux/store.js) configura la persistencia:

```javascript
const persistConfig = {
  key: "root",
  version: 1,
  storage, // localStorage
};

const persistedReducer = persistReducer(persistConfig, rootReducer);
```

Esto permite que el estado del usuario persista incluso después de recargar la página.

## Rutas Protegidas

El componente [client/src/components/PrivateRoute.jsx](client/src/components/PrivateRoute.jsx) protege rutas en el frontend:

```javascript
import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";

export default function PrivateRoute() {
  const { currentUser } = useSelector((state) => state.user);

  // Si hay usuario autenticado, renderiza el componente hijo
  // Si no, redirige a Sign In
  return currentUser ? <Outlet /> : <Navigate to="/signin" />;
}
```

### Uso en React Router:

```javascript
<Route element={<PrivateRoute />}>
  <Route path="/profile" element={<Profile />} />
</Route>
```

Solo usuarios autenticados pueden acceder a `/profile`.

## Seguridad

### Medidas Implementadas

**1. Hashing de Contraseñas**
- Uso de bcryptjs con 10 rondas de salt
- Las contraseñas nunca se almacenan en texto plano
- Comparación segura con `bcrypt.compareSync()`

**2. Cookies HTTP-Only**
```javascript
res.cookie("access_token", token, {
  httpOnly: true,        // No accesible desde JavaScript
  expires: expiryDate    // Expiración de 1 hora
})
```
- Protege contra ataques XSS (Cross-Site Scripting)
- El token no puede ser accedido por JavaScript malicioso

**3. JWT con Secreto**
- El token se firma con `JWT_SECRET`
- Solo el servidor puede verificar la autenticidad
- El token contiene solo el ID del usuario (no datos sensibles)

**4. Validación de Autorización**
- Cada operación verifica que el usuario solo modifique sus propios datos
- Ejemplo: Un usuario no puede actualizar/eliminar la cuenta de otro

**5. Exclusión de Contraseña en Respuestas**
```javascript
const { password, ...rest } = user._doc;
res.json(rest); // Nunca envía el hash de contraseña al cliente
```

**6. Variables de Entorno**
- Secretos (MONGO, JWT_SECRET) en variables de entorno
- Archivo `.env` en `.gitignore`

### Vulnerabilidades a Considerar

**Mejoras Recomendadas**:

1. **HTTPS en Producción**: Asegurar que todas las comunicaciones usen HTTPS
2. **Agregar `secure: true` a las cookies** en producción:
   ```javascript
   res.cookie("access_token", token, {
     httpOnly: true,
     secure: process.env.NODE_ENV === "production", // Solo HTTPS
     sameSite: "strict" // Protección CSRF
   })
   ```
3. **Refresh Tokens**: Implementar tokens de actualización para sesiones más largas
4. **Rate Limiting**: Limitar intentos de login para prevenir fuerza bruta
5. **Validación de Entrada**: Validar y sanitizar todos los inputs del usuario
6. **2FA (Autenticación de Dos Factores)**: Agregar capa adicional de seguridad

## Diagrama de Flujo Completo

```
┌─────────────────┐
│   Usuario       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────┐
│  Formulario     │────▶│  Redux Action    │
│  Sign In/Up     │     │  (Start)         │
└────────┬────────┘     └──────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Fetch POST /api/auth/signin            │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Backend: Verificar Credenciales        │
│  - Buscar usuario en MongoDB            │
│  - Comparar contraseña con bcrypt       │
│  - Generar JWT                          │
│  - Crear cookie HTTP-only               │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Respuesta con datos del usuario        │
│  (sin password)                         │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Redux: signInSuccess(userData)         │
│  - Guarda en estado global              │
│  - Redux Persist → localStorage         │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Redirigir a página principal           │
│  Usuario autenticado                    │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Peticiones Subsiguientes               │
│  - Cookie se envía automáticamente      │
│  - Middleware verifyToken valida        │
│  - Acceso a rutas protegidas            │
└─────────────────────────────────────────┘
```

## Resumen

El sistema de autenticación MERN-Auth implementa:

- **Registro** con contraseñas hasheadas
- **Inicio de sesión** con JWT en cookies HTTP-only
- **OAuth con Google** usando Firebase
- **Protección de rutas** en frontend y backend
- **Gestión de estado** con Redux + Redux Persist
- **Seguridad** con bcrypt, JWT y cookies seguras

Este sistema proporciona una base sólida para aplicaciones MERN con autenticación, y puede ser extendido con características adicionales como recuperación de contraseña, verificación de email, y autenticación de dos factores.
