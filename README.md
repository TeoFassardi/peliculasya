# PeliculasYa

Catálogo de películas desarrollado para la materia Programación Web Full Stack. Los visitantes pueden buscar películas y consultar sus fichas; los administradores gestionan el catálogo. No reproduce películas.

Basado en la arquitectura del [repositorio de la materia](https://github.com/T-Arias/mdw-2026). Se retiraron los apuntes y ejemplos de alumnos, materias y chat de la aplicación; siguen disponibles en el historial original.

## Entrega y estado del despliegue

| Recurso | Estado |
| --- | --- |
| Repositorio propio | Pendiente de crear y configurar el remoto |
| Frontend en Render | Pendiente de publicar |
| Backend en Render | Pendiente de publicar |
| GitHub OAuth en producción | Pendiente de configurar y probar |

Estas entradas se deben reemplazar por enlaces reales antes de entregar. La aplicación local y las pruebas no acreditan el funcionamiento en producción.

## Stack y estructura

- `backend/`: Express 5, TypeScript, Mongoose, MongoDB y Better Auth.
- `frontend/`: React, Vite, TypeScript, React Router, RTK Query, React Hook Form y Zod.
- `backend/src/routes`: métodos HTTP y middlewares.
- `backend/src/controllers`: traducción entre HTTP y los servicios.
- `backend/src/services`: consultas de datos.
- `backend/src/models` y `schemas`: persistencia y validación.

La entidad película tiene título, sinopsis, género, duración numérica, fecha de estreno, disponibilidad booleana y URL opcional del afiche. MongoDB agrega `_id`, `createdAt` y `updatedAt`.

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

## Usuarios de prueba

Configuración propuesta para la corrección, **todavía no creada en una base publicada**:

| Rol | Email | Contraseña |
| --- | --- | --- |
| admin | `admin@peliculasya.test` | `Aula-Cine-Admin-2026!` |
| user | `user@peliculasya.test` | `Aula-Cine-User-2026!` |

Para crearlos, copiar estos datos a las cuatro variables `SEED_` y ejecutar `npm run seed` contra la base elegida. Estas credenciales serán públicas: usar cuentas exclusivas de demostración sin datos personales. Si se eligen otras, actualizar esta tabla antes de entregar.

El seed se puede repetir: no duplica las películas de muestra, no sobreescribe sus cambios ni cambia las contraseñas existentes. Si un email ya existe con un rol diferente, se detiene sin promoverlo; usar un email nuevo. El seed nunca se ejecuta automáticamente al iniciar o desplegar.

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

Listado: `GET /api/movies?search=viaje&page=1&limit=12`. Busca por título sin distinguir mayúsculas y trata caracteres especiales de búsqueda como texto literal. `page` empieza en 1; `limit` admite de 1 a 100 y vale 12 por defecto. Orden: creación descendente, con identificador como desempate.

Ejemplo de cuerpo para crear una película:

```json
{
  "title": "Mi película",
  "synopsis": "Una historia para descubrir.",
  "genre": "Drama",
  "durationMinutes": 100,
  "releaseDate": "2024-06-15",
  "available": true,
  "posterUrl": ""
}
```

Géneros: Acción, Comedia, Drama, Terror, Ciencia ficción, Animación, Documental, Aventura, Suspenso y Romance. Duración: entero entre 1 y 600. Fecha: `YYYY-MM-DD`. El afiche puede omitirse, quedar vacío o ser HTTPS. En `PATCH` enviar uno o más campos. Un título puede repetirse.

Errores: `400` por datos, fecha, parámetros o identificador inválidos; `401` sin sesión; `403` sin rol; `404` si no existe; `500` ante fallos internos. Los errores propios usan `{ "error": { "message": "..." } }`; la validación agrega `details` por campo y `formErrors` para errores generales. Better Auth conserva su formato de errores.

## Desplegar en Render

1. Crear una base en MongoDB Atlas, usuario de base y reglas de acceso de red compatibles con Render. Guardar la URI únicamente en variables de entorno.
2. Crear un repositorio propio en GitHub y subir el proyecto con commits por etapa. El remoto original apunta a la materia: revisarlo con `git remote -v` y reemplazar `origin` por la URL del repositorio propio antes de hacer push.
3. Crear **Web Service** conectado al repositorio: Root Directory `backend`, Build Command `npm ci --include=dev && npm run build`, Start Command `npm start`, Health Check Path `/health`.
4. Configurar `NODE_VERSION=22`, `NODE_ENV=production`, `MONGODB_URI`, un `BETTER_AUTH_SECRET` nuevo y las credenciales GitHub de producción. Render asigna `PORT`.
5. Crear **Static Site** del mismo repositorio: Root Directory `frontend`, Build Command `npm ci --include=dev && npm run build`, Publish Directory `dist`, `NODE_VERSION=22`.
6. Configurar estos **Rewrites**, en este orden, reemplazando el dominio de ejemplo por el backend real:

| Source | Destination | Action |
| --- | --- | --- |
| `/api/*` | `https://<backend-real>.onrender.com/api/*` | Rewrite |
| `/*` | `/index.html` | Rewrite |

7. En el backend, poner `BETTER_AUTH_URL=https://<frontend-real>.onrender.com` y volver a desplegar.
8. Crear una segunda OAuth App de GitHub. Homepage: URL del frontend. Callback: `https://<frontend-real>.onrender.com/api/auth/callback/github`. Cargar sus credenciales en el backend.
9. Ejecutar el seed contra la base de producción desde una terminal local configurada con las variables de ese entorno. No publicar los valores ni registrar las credenciales en comandos o commits.
10. Completar las URLs del inicio de este README y verificar todas las pruebas de aceptación siguientes.

Referencias: [Render: Web Services](https://render.com/docs/web-services), [Render: rewrites](https://render.com/docs/redirects-rewrites), [Better Auth: GitHub](https://www.better-auth.com/docs/authentication/github).

## Verificación

```text
cd backend
npm run build
npm test

cd ../frontend
npm run build
npm run lint
```

Las pruebas del backend crean una base temporal con `mongodb-memory-server` en replica set. La primera ejecución descarga MongoDB y necesita acceso a internet. No usan la base del `.env`. Cubren CRUD, permisos, registro, sesión por cookie, logout, validación, búsqueda y paginación.

Si la descarga de MongoDB está bloqueada y ya hay una instalación local, en PowerShell se puede indicar su ejecutable antes de correr las pruebas:

```powershell
$env:MONGOMS_SYSTEM_BINARY = 'C:/Program Files/MongoDB/Server/8.0/bin/mongod.exe'
$env:MONGOMS_SYSTEM_BINARY_VERSION_CHECK = 'false'
npm test
```

La ruta debe coincidir con la instalación de cada equipo. Esto inicia un proceso separado con datos temporales, no el servicio MongoDB existente.

Pruebas de navegador desde `frontend/`: ejecutar `npx playwright install chromium` y luego `npm run test:e2e`. Si se usa Microsoft Edge instalado, configurar `$env:PLAYWRIGHT_CHANNEL = 'msedge'`. Las variables `MONGOMS_` anteriores también se heredan para estas pruebas. Los puertos 3000 y 5173 deben estar libres. Se inician frontend y backend temporales, con usuarios y catálogo aislados, y se cierran al terminar.

Validado durante el desarrollo: build de ambos proyectos, lint del frontend, seis pruebas de integración y tres pruebas de navegador. Las capturas de 375, 768 y 1440px se generan en `frontend/test-results/` y no se versionan. Quedan pendientes las comprobaciones específicas de producción.

Comprobación manual obligatoria antes de entregar:

- Registro crea rol user; login email, logout y F5 conservan/revocan sesión según corresponda.
- Visitante va a login al abrir `/admin`; user ve “Sin permisos”; admin puede hacer todo el ABM.
- Catálogo y detalle funcionan sin sesión; búsqueda, páginas y portadas de respaldo funcionan.
- Formularios muestran errores y permiten corregirlos; cancelar no guarda; eliminar pide confirmación.
- GitHub funciona en la URL publicada. Verificar también rechazo/cancelación del proveedor.
- F5 en `/movies/:id`, `/login` y `/admin` funciona en Render.
- En Network del navegador todas las llamadas a la API salen a `/api` del frontend.
- Probar teclado y anchos de 375, 768 y 1440px.
- Revisar secretos en archivos e historial antes de publicar; revocar cualquier credencial filtrada antes de limpiar su historial.
