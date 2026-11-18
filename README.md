# PeliculasYa — TP2 Full Stack

Catálogo de películas desarrollado para Programación Web Full Stack. Los visitantes consultan el listado y el detalle; los administradores crean, editan y eliminan películas. Incluye registro, login por email y GitHub, sesión persistente y roles user/admin. Opcionales implementados: búsqueda por título y paginación.

## Entrega

| Recurso | Enlace |
| --- | --- |
| Repositorio | [TeoFassardi/peliculasya](https://github.com/TeoFassardi/peliculasya) |
| Frontend | [peliculasya.onrender.com](https://peliculasya.onrender.com) |
| Backend | [peliculasya-backend.onrender.com](https://peliculasya-backend.onrender.com) |
| Estado del backend | [/health](https://peliculasya-backend.onrender.com/health) |

El backend gratuito puede tardar en responder después de un período sin uso.

## Entidad y arquitectura

La entidad es **película**: título, sinopsis y género (texto), duración en minutos (número), fecha de estreno (fecha), disponibilidad (booleano) y URL opcional del afiche. MongoDB agrega identificador y fechas de creación y modificación.

- **Backend:** Express 5 + TypeScript, MongoDB/Mongoose, Better Auth y Zod. Rutas, controladores, servicios, modelos y schemas separados.
- **Frontend:** React + Vite + TypeScript, React Router, RTK Query, React Hook Form y Zod.
- **Autenticación:** Better Auth guarda usuarios, cuentas y sesiones en Atlas. El registro asigna user; las escrituras exigen `authMiddleware` y `requireRole("admin")`.
- **Despliegue:** backend Web Service y frontend Static Site en Render. El navegador llama a `/api` del frontend.

```text
backend/              API, autenticación, seed y pruebas de integración
frontend/             Catálogo, autenticación, panel admin y pruebas de navegador
referencia-materia/   Ejemplo original de la materia
clase N/              Apuntes originales
```

Basado en el [repositorio de la materia](https://github.com/T-Arias/mdw-2026). Los apuntes y el ejemplo original se conservan en `clase N/` y `referencia-materia/`. La guía ampliada está en [PELICULASYA.md](PELICULASYA.md).

## Usuarios de prueba

Cuentas de demostración creadas en Atlas y disponibles en la aplicación publicada:

| Rol | Email | Contraseña |
| --- | --- | --- |
| admin | `admin@peliculasya.test` | `Aula-Cine-Admin-2026!` |
| user | `user@peliculasya.test` | `Aula-Cine-User-2026!` |

Para recrearlas en otra base, copiar estos datos a las cuatro variables `SEED_` y ejecutar `npm run seed`. Estas credenciales son públicas y pertenecen exclusivamente a cuentas de demostración.

El seed se puede repetir: no duplica las películas de muestra, no sobreescribe sus cambios ni cambia las contraseñas existentes. Si un email ya existe con un rol diferente, se detiene sin promoverlo; usar un email nuevo. El seed nunca se ejecuta automáticamente al iniciar o desplegar.

## Correr en local

Requisitos: Node.js 22.12 o superior compatible con Vite, npm, una base MongoDB Atlas o replica set local y una OAuth App de GitHub para desarrollo.

1. En `backend/`, ejecutar `npm ci`.
2. Copiar `backend/.env.example` a `backend/.env` y completar todas las variables. No subir ese archivo a Git.
3. Usar `PORT=3000`, `NODE_ENV=development` y `BETTER_AUTH_URL=http://localhost:5173`.
4. En `MONGODB_URI`, incluir el nombre de la base, por ejemplo `peliculasya`, además de los datos de conexión de Atlas. Better Auth y Mongoose deben usar la misma base.
5. Generar `BETTER_AUTH_SECRET` con `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`.
6. En la OAuth App local de GitHub, configurar Homepage `http://localhost:5173` y callback `http://localhost:5173/api/auth/callback/github`; copiar Client ID y Client Secret al `.env`.
7. Ejecutar `npm run seed` dentro de `backend/` para crear los usuarios de prueba y seis películas.
8. Ejecutar `npm run dev` dentro de `backend/`.
9. En otra terminal, dentro de `frontend/`, ejecutar `npm ci` y `npm run dev`.
10. Abrir `http://localhost:5173`. El proxy de Vite reenvía `/api` al backend en el puerto 3000.

El frontend no requiere `.env` ni una URL absoluta de la API. Las contraseñas se guardan hasheadas por Better Auth, y sus usuarios, cuentas y sesiones se almacenan en MongoDB.

## Variables del backend

| Variable | Uso |
| --- | --- |
| `PORT` | Puerto del servidor; por defecto 3000 |
| `NODE_ENV` | `development`, `test` o `production` |
| `MONGODB_URI` | URI de la base MongoDB, con nombre de base |
| `BETTER_AUTH_URL` | Origen público del frontend, sin `/api` |
| `BETTER_AUTH_SECRET` | Secreto aleatorio; diferente en local y producción |
| `GITHUB_CLIENT_ID` | Client ID de la OAuth App del entorno |
| `GITHUB_CLIENT_SECRET` | Client Secret de esa OAuth App |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | Cuenta admin de corrección; solo las usa el seed |
| `SEED_USER_EMAIL`, `SEED_USER_PASSWORD` | Cuenta común de corrección; solo las usa el seed |

## API

| Método | Ruta | Rol requerido | Respuesta |
| --- | --- | --- | --- |
| GET | `/health` | Público | 200 |
| GET | `/api/movies` | Público | 200, `{ data, meta }` |
| GET | `/api/movies/:id` | Público | 200, película |
| POST | `/api/movies` | admin | 201, película creada |
| PATCH | `/api/movies/:id` | admin | 200, película actualizada |
| DELETE | `/api/movies/:id` | admin | 204, sin cuerpo |
| POST | `/api/auth/sign-up/email` | Público | Registro con rol user |
| POST | `/api/auth/sign-in/email` | Público | Inicio de sesión |
| POST | `/api/auth/sign-in/social` | Público | Inicio de OAuth GitHub |
| GET | `/api/auth/callback/github` | Flujo OAuth | Callback administrado por Better Auth |
| GET | `/api/auth/get-session` | Sesión opcional | Sesión actual o null |
| POST | `/api/auth/sign-out` | Sesión | Cierre de sesión |

Las escrituras de películas exigen `authMiddleware` y `requireRole("admin")`. Los endpoints adicionales del plugin admin de Better Auth mantienen sus propios controles de acceso. El panel visual no permite cambiar roles.

Listado con búsqueda y paginación: `GET /api/movies?search=viaje&page=1&limit=12`. Busca por título sin distinguir mayúsculas. La página inicial es 1 y el límite predeterminado es 12 (máximo 100). Los detalles de campos, cuerpos y errores están en [PELICULASYA.md](PELICULASYA.md#api).

## Configuración de Render

| Servicio | Root Directory | Build Command | Inicio / publicación |
| --- | --- | --- | --- |
| Web Service | `backend` | `npm ci --include=dev && npm run build` | `npm start` |
| Static Site | `frontend` | `npm ci --include=dev && npm run build` | `dist` |

Ambos usan `NODE_VERSION=22`. El backend usa `NODE_ENV=production`, las variables privadas de conexión y autenticación, y `BETTER_AUTH_URL=https://peliculasya.onrender.com`. Render asigna el puerto; `/health` permite comprobar el estado.

Rewrites del Static Site, en este orden:

| Source | Destination | Action |
| --- | --- | --- |
| `/api/*` | `https://peliculasya-backend.onrender.com/api/*` | Rewrite |
| `/*` | `/index.html` | Rewrite |

La OAuth App de producción usa Homepage `https://peliculasya.onrender.com` y callback `https://peliculasya.onrender.com/api/auth/callback/github`. Sus credenciales y el secreto de Better Auth son distintos de los locales. Atlas permite los rangos de salida del backend de Render.

## Verificación

```text
cd backend
npm run build
npm test

cd ../frontend
npm run build
npm run lint
npm run test:e2e
```

Las pruebas automatizadas usan MongoDB temporal independiente. Las instrucciones para usar el MongoDB local y Microsoft Edge están en [PELICULASYA.md](PELICULASYA.md#verificación).

Durante el desarrollo pasaron los builds, lint, seis pruebas de integración y tres de navegador. En producción, el usuario confirmó login con GitHub, sesión tras F5, ABM del administrador y acceso denegado al usuario común.

El 18 de noviembre de 2026 se verificó además con navegador automático en producción: catálogo y búsqueda, detalle con F5, registro con rol user, sesión tras F5 y logout, cuentas de prueba, rechazo 403 de escrituras para user, ABM admin, validación, cancelar sin guardar y confirmación de borrado. Se comprobó `/api` bajo el origen del frontend, paginación de la API y ausencia de desborde horizontal a 375, 768 y 1440px. Los registros temporales de verificación se eliminaron.

No se deben versionar archivos `.env` ni credenciales de infraestructura. Las contraseñas publicadas arriba corresponden solamente a cuentas de demostración para la corrección.
