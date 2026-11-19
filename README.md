# PeliculasYa — TP2 Full Stack

Catálogo de películas desarrollado para Programación Web Full Stack. Los visitantes consultan el listado y el detalle; los administradores crean, editan y eliminan películas. Incluye registro, login por email, GitHub y Google, sesión persistente y roles user/admin. Cada cuenta tiene una lista privada con películas, notas y estado de visualización. Incluye búsqueda, filtros, paginación, administración de roles y un asistente de cine flotante. El estado de las verificaciones de producción se detalla al final.

## Entrega

| Recurso | Enlace |
| --- | --- |
| Repositorio | [TeoFassardi/peliculasya](https://github.com/TeoFassardi/peliculasya) |
| Frontend | [peliculasya.onrender.com](https://peliculasya.onrender.com) |
| Backend | [peliculasya-backend.onrender.com](https://peliculasya-backend.onrender.com) |
| Estado del backend | [/health](https://peliculasya-backend.onrender.com/health) |

El backend gratuito puede tardar en responder después de un período sin uso.

### Cumplimiento de la consigna

| Requisito | Implementación / evidencia |
| --- | --- |
| Estructura del repositorio | `backend/` y `frontend/`; documentación y enlaces de entrega en este README |
| Entidad propia | Película: siete campos de texto, número, fecha y booleano |
| CRUD RESTful | GET, POST, PATCH y DELETE sobre `/api/movies`; tabla completa de rutas más abajo |
| Validación y códigos HTTP | Zod en alta y edición; pruebas de 201, 400, 401, 403 y 404 |
| Autenticación | Better Auth con email/contraseña, GitHub y MongoDB para cuentas y sesiones |
| Roles | Registro con rol `user`; escrituras del catálogo con `authMiddleware` + `requireRole("admin")` |
| Frontend | Listado, detalle, registro, login, logout y ABM protegido; React Hook Form + Zod y `useSession()` |
| Deploy | Web Service y Static Site; API por `/api`; rewrites y rutas internas publicados en Render |
| Cuentas para corregir | Admin y user indicados abajo; ingreso y roles verificados en producción el 19/11/2026 |
| Variables y secretos | Las 17 variables están en `backend/.env.example`; `.env` ignorado y auditoría del historial sin coincidencias detectadas |
| Historial | Commits incrementales y descriptivos; no se entrega un único commit final |
| Opcionales | Búsqueda/paginación, lista privada por cuenta, Google y cambio de roles implementados |

**Pendiente externo antes de dar por cerrada la entrega:** volver a probar el ingreso completo con GitHub en Chrome cuando Google resuelva la revisión de seguridad. El inicio OAuth y su callback de producción están verificados, pero Chrome mostró una advertencia de Safe Browsing. Se solicitó revisión en Search Console; no se dispone todavía de una resolución confirmada. No se considera este punto aprobado únicamente porque el código esté implementado.

## Entidad y arquitectura

La entidad es **película**: título, sinopsis y género (texto), duración en minutos (número), fecha de estreno (fecha), disponibilidad (booleano) y afiche opcional (texto con una URL o una imagen optimizada). MongoDB agrega identificador y fechas de creación y modificación.

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

Basado en el [repositorio de la materia](https://github.com/T-Arias/mdw-2026). Los apuntes y el ejemplo original se conservan en `clase N/` y `referencia-materia/`.

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
2. Copiar `backend/.env.example` a `backend/.env` y completar conexión, autenticación y las cuatro variables `SEED_`. Google y el asistente son opcionales. No subir ese archivo a Git.
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
| `GOOGLE_CLIENT_ID` | Client ID de Google; opcional, habilita Google junto con su secret |
| `GOOGLE_CLIENT_SECRET` | Client Secret de Google; dejar ambas variables vacías si no se configura |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | Cuenta admin de corrección; solo las usa el seed |
| `SEED_USER_EMAIL`, `SEED_USER_PASSWORD` | Cuenta común de corrección; solo las usa el seed |
| `GROQ_API_KEY` | Clave de Groq; necesaria solo para el asistente |
| `GOOGLE_API_KEY` | Clave de Gemini para embeddings; distinta del secret de Google OAuth |
| `GROQ_MODEL` | Modelo del asistente; por defecto `openai/gpt-oss-20b` |
| `GEMINI_EMBEDDING_MODEL` | Modelo de embeddings; por defecto `gemini-embedding-001` |

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
| POST | `/api/auth/sign-in/social` | Público | Inicio de OAuth GitHub o Google |
| GET | `/api/auth/callback/github` | Flujo OAuth | Callback administrado por Better Auth |
| GET | `/api/auth/get-session` | Sesión opcional | Sesión actual o null |
| POST | `/api/auth/sign-out` | Sesión | Cierre de sesión |
| GET | `/api/config` | Público | Configuración pública: indica si Google está habilitado |
| GET | `/api/watchlist` | user o admin | Solo los registros de la cuenta autenticada, `{ data, meta }` |
| POST | `/api/watchlist` | user o admin | 201, guarda una película en la lista propia |
| PATCH | `/api/watchlist/:id` | Propietario autenticado | 200, cambia nota o estado de visualización |
| DELETE | `/api/watchlist/:id` | Propietario autenticado | 204, quita un registro de la lista propia |
| GET | `/api/auth/admin/list-users` | admin | Cuentas con búsqueda y paginación |
| POST | `/api/auth/admin/set-role` | admin | Cambia el rol de otra cuenta a user o admin |
| GET | `/api/auth/callback/google` | Flujo OAuth | Callback de Google; requiere proveedor configurado |
| POST | `/api/chat` | user o admin | Respuesta progresiva SSE; requiere claves de Groq y Gemini |

Las escrituras de películas exigen `authMiddleware` y `requireRole("admin")`. Los endpoints del plugin admin de Better Auth mantienen sus propios controles de acceso. El panel `/admin/usuarios` usa `authClient.admin.listUsers` y `authClient.admin.setRole`, pide confirmación antes de cambiar un rol e impide que un administrador se quite su propio acceso. Esta última restricción también se valida en el servidor; solo se admiten los roles user y admin.

Listado con búsqueda y paginación: `GET /api/movies?search=viaje&page=1&limit=12`. Busca por título sin distinguir mayúsculas y trata los caracteres especiales como texto literal. La página inicial es 1 y el límite predeterminado es 12 (máximo 100). El orden es creación descendente, con identificador como desempate.

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

Géneros: Acción, Comedia, Drama, Terror, Ciencia ficción, Animación, Documental, Aventura, Suspenso y Romance. Duración: entero entre 1 y 600. Fecha: `YYYY-MM-DD`. El afiche puede omitirse, quedar vacío, ser una URL HTTPS, una ruta de los afiches incluidos (`/posters/nombre.jpg`) o un JPEG optimizado por el formulario. En `PATCH` enviar uno o más campos; los campos ausentes conservan su valor. Un título puede repetirse.

## Afiches

El catálogo, el detalle, Mi lista y la tabla de administración muestran el mismo afiche. Al crear o editar, el formulario ofrece una vista previa, una URL HTTPS directa y subida de archivos JPG, PNG o WebP de hasta 8 MB. También permite reemplazar o quitar la imagen.

Las imágenes subidas se convierten en el navegador a JPEG de hasta 800 × 1200px y 250 KiB. Se guardan como datos de imagen en MongoDB dentro de `posterUrl`, por lo que no necesitan un servicio externo ni dependen del disco temporal de Render. El backend valida el formato y el tamaño, rechaza SVG y otros esquemas, y limita el cuerpo JSON a 1 MB. Si una imagen externa falla o no hay afiche, se muestra una portada de respaldo.

Las seis películas de muestra incluyen afiches en `frontend/public/posters/`, publicados con el frontend. El seed los asigna a las películas nuevas. Para completar solo los afiches vacíos de esas películas en una base existente:

```text
cd backend
npm run backfill:posters
```

Este comando no reemplaza imágenes elegidas por el administrador ni cambia los demás datos. Publicar primero el frontend que contiene los archivos; la base se obtiene de `backend/.env`.

Fuentes de los afiches de demostración: [Chihiro](https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg), [Interestelar](https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg), [El gran hotel Budapest](https://image.tmdb.org/t/p/w500/eWdyYQreja6JGCzqHWXpWHDrrPo.jpg), [La llegada](https://image.tmdb.org/t/p/w500/x2FJsf1ElAgr63Y3PNPtJrcmpoe.jpg), [El secreto de sus ojos](https://cineplex.com.co/wp-content/uploads/2020/10/poster-el-secreto-de-sus-ojos.jpg) y [Cinema Paradiso](https://image.tmdb.org/t/p/w500/8SRUfRUi6x4O68n0VCbDNRa6iGL.jpg). La procedencia también está guardada en los metadatos de cada archivo.

Errores: `400` por datos, fecha, parámetros o identificador inválidos; `401` sin sesión; `403` sin rol; `404` si no existe; `500` ante fallos internos. Los errores propios usan `{ "error": { "message": "..." } }`; la validación de formularios agrega `details` por campo y `formErrors`. Better Auth conserva su formato de errores.

## Opcionales y registros privados

- **Búsqueda, filtros y paginación:** catálogo público con búsqueda por título y páginas de 12 películas; filtros por estado y paginación en Mi lista; búsqueda por email y páginas de 10 cuentas en el panel de usuarios. Los controles de paginación aparecen cuando hay más de una página.
- **Registros propios:** `/mi-lista` permite guardar películas desde su detalle, marcarlas como vistas, escribir notas privadas de hasta 500 caracteres, filtrar por estado y quitarlas. El propietario se obtiene de la sesión; no se acepta del cliente. Cada lectura, edición y eliminación se limita a esa cuenta, incluso si otra cuenta es admin. Un acceso a un registro ajeno devuelve 404. El catálogo sigue siendo público y solo admin puede modificar películas.
- **Roles:** `/admin/usuarios` permite promover y quitar permisos a otras cuentas. Un usuario común no puede entrar a la pantalla ni llamar a los endpoints de administración. El nuevo rol se consulta desde las sesiones existentes; el backend conserva la autoridad sobre cada operación.
- **Google:** configurado en Render con credenciales de producción. Se verificaron la habilitación del proveedor, el inicio de OAuth y el callback de producción; el usuario confirmó el ingreso completo con una cuenta real. Las pruebas automatizadas usan credenciales ficticias y no acceden a cuentas reales de Google.

Para la API de Mi lista, `POST` recibe `{ "movieId": "identificador-de-pelicula" }`; `PATCH` recibe uno o ambos campos: `{ "watched": true, "note": "Mi comentario privado" }`. Un índice único por cuenta y película evita duplicados (409). El listado admite `page`, `limit`, `status=all|pending|watched` y `movieId` opcional. Si una película desaparece del catálogo, su registro muestra “Película retirada del catálogo”; el propietario puede conservar su nota o quitarla.

## Habilitar Google

1. En [Google Cloud Console](https://console.cloud.google.com/), crear o seleccionar un proyecto. Abrir **Google Auth Platform** y completar **Branding** (nombre PeliculasYa y emails de contacto) y **Audience**. Para una cuenta personal, elegir audiencia externa; si la app está en pruebas, agregar las cuentas autorizadas como usuarios de prueba.
2. En **Clients → Create client**, elegir **Web application**. Crear clientes separados para local y producción, con estas direcciones de retorno:

   | Entorno | Origen de la aplicación | Authorized redirect URI |
   | --- | --- | --- |
   | Local | `http://localhost:5173` | `http://localhost:5173/api/auth/callback/google` |
   | Producción | `https://peliculasya.onrender.com` | `https://peliculasya.onrender.com/api/auth/callback/google` |

3. Guardar el Client ID y el Client Secret locales en `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` de `backend/.env`. Cargar los de producción en **Environment** del backend en Render. No reemplazar las variables de GitHub ni publicar estos valores.
4. Reiniciar el backend local y volver a desplegar el backend de Render. El frontend consulta `/api/config` y muestra “Ingresar con Google” cuando ambas variables están completas. Sin credenciales, email y GitHub siguen funcionando. Configurar solo una variable detiene el inicio con un mensaje claro.
5. Probar ingreso, cancelación, logout y F5 con una cuenta real. Las URI deben coincidir exactamente con las registradas en Google. Solo se utilizan los permisos de identidad básicos del proveedor.

Referencia: [Google: credenciales y direcciones de retorno de OAuth](https://developers.google.com/identity/protocols/oauth2/web-server#creatingcred).

## Configuración de Render

| Servicio | Root Directory | Build Command | Inicio / publicación |
| --- | --- | --- | --- |
| Web Service | `backend` | `npm ci --include=dev && npm run build` | `npm start` |
| Static Site | `frontend` | `npm ci --include=dev && npm run build` | `dist` |

Ambos usan `NODE_VERSION=22.19.0`, como indica `render.yaml`. El backend usa `NODE_ENV=production`, las variables privadas de conexión y autenticación, y `BETTER_AUTH_URL=https://peliculasya.onrender.com`. Render asigna el puerto; `/health` permite comprobar el estado.

Rewrites del Static Site, en este orden:

| Source | Destination | Action |
| --- | --- | --- |
| `/api/*` | `https://peliculasya-backend.onrender.com/api/*` | Rewrite |
| `/*` | `/index.html` | Rewrite |

La OAuth App de producción usa Homepage `https://peliculasya.onrender.com` y callback `https://peliculasya.onrender.com/api/auth/callback/github`. Sus credenciales y el secreto de Better Auth son distintos de los locales.

Para autorizar la conexión a Atlas, en el backend de Render abrir **Connect → Outbound** y agregar todos los rangos mostrados a la **IP Access List** del proyecto en Atlas. Conservar también la IP local si se usa para desarrollo. El seed se ejecuta desde una terminal local contra la base elegida; no forma parte del inicio ni del despliegue automático.

Referencias: [Render: Web Services](https://render.com/docs/web-services), [Render: rewrites](https://render.com/docs/redirects-rewrites), [Better Auth: GitHub](https://www.better-auth.com/docs/authentication/github).

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

Las pruebas automatizadas usan MongoDB temporal independiente y no utilizan la base del `.env`. La primera ejecución de `mongodb-memory-server` descarga un binario de MongoDB y requiere internet. Si ya está instalado localmente, se puede usar ese ejecutable en un proceso temporal separado:

```powershell
$env:MONGOMS_SYSTEM_BINARY = 'C:/Program Files/MongoDB/Server/8.0/bin/mongod.exe'
$env:MONGOMS_SYSTEM_BINARY_VERSION_CHECK = 'false'
```

Ajustar la ruta a la instalación del equipo. Para las pruebas de navegador, ejecutar `npx playwright install chromium` desde `frontend/` antes de `npm run test:e2e`. Como alternativa, usar Microsoft Edge instalado con `$env:PLAYWRIGHT_CHANNEL = 'msedge'`. Los puertos 3000 y 5173 deben estar libres. Estas pruebas inician backend y frontend temporales y los cierran al terminar. Las capturas de 375, 768 y 1440px se generan en `frontend/test-results/` y no se versionan.

En la revisión del 19 de noviembre de 2026 pasaron diez pruebas de integración del backend y once pruebas de navegador, además de los builds de ambos proyectos y el lint del frontend. Cubren CRUD y códigos HTTP, validación, registro y sesiones, permisos, aislamiento de listas, cambio de roles, inicio de Google OAuth, afiches, chat y Markdown, recuperación de errores de conexión y navegación. Las correcciones finales de móvil se volvieron a comprobar con las pruebas de chat y de pulido.

Ese día se verificaron directamente en producción: `/health`, ingreso por email de las dos cuentas de corrección y sus roles, lectura de la sesión con la misma cookie y logout. También se comprobó que GitHub y Google inician OAuth hacia sus dominios oficiales con el callback correcto, y que `/login`, `/mi-lista` y `/admin` sirven el frontend al abrirse directamente. Esta comprobación no sustituye completar la autorización con una cuenta real del proveedor; el bloqueo de Chrome durante la vuelta de GitHub sigue pendiente de resolución externa.

Se revisaron 387 versiones de archivos del historial alcanzable de Git. No se encontraron coincidencias con los secretos locales comprobados ni con los patrones buscados de tokens de GitHub, claves de Google/Groq, URI autenticada de MongoDB y claves privadas. No hay archivos `.env` reales registrados en ese historial y el `.env` local está ignorado. Es una comprobación acotada a esos valores y patrones, no una garantía universal de ausencia de cualquier dato sensible.

El 18 de noviembre de 2026 se verificó además con navegador automático en producción: catálogo y búsqueda, detalle con F5, registro con rol user, sesión tras F5 y logout, cuentas de prueba, rechazo 403 de escrituras para user, ABM admin, validación, cancelar sin guardar y confirmación de borrado. Se comprobó `/api` bajo el origen del frontend, paginación de la API y ausencia de desborde horizontal a 375, 768 y 1440px. Los registros temporales de verificación se eliminaron.

Después de publicar los opcionales se verificaron en producción: listado de cuentas autorizado para admin y rechazado para user, protección contra quitarse el rol propio, y creación, edición y filtrado de registros privados. Otra cuenta admin no pudo consultar ni editar el registro del propietario. Se eliminaron las películas, registros y sesiones temporales de esa comprobación. Google está habilitado y su callback apunta a `https://peliculasya.onrender.com/api/auth/callback/google`.

No se deben versionar archivos `.env` ni credenciales de infraestructura. Las contraseñas publicadas arriba corresponden solamente a cuentas de demostración para la corrección.

## Asistente (LangChain y RAG)

Desde el botón flotante Asistente, cada cuenta consulta catálogo, conteos de su lista y fragmentos semánticos de sinopsis y notas. Usa Groq para respuestas y Gemini para embeddings, persistidos en MongoDB y buscados con MemoryVectorStore. Configurar GROQ_API_KEY y GOOGLE_API_KEY en backend/.env y Render; nunca en el frontend. Los modelos son configurables con GROQ_MODEL y GEMINI_EMBEDDING_MODEL. Las cuotas gratuitas dependen de las cuentas; no habilitar facturación si se busca evitar cargos.

El panel se abre sin abandonar la página, conserva el borrador al minimizarlo y carga su código al usarlo por primera vez. En móvil utiliza un botón compacto. Las respuestas admiten Markdown seguro; las tablas anchas se desplazan dentro del mensaje. No se muestra una lista adicional de fuentes debajo de las respuestas.

La conversación vive en sessionStorage por cuenta: sobrevive al refrescar y se limpia con Nueva conversación o logout. Restaurar una pestaña puede recuperar su almacenamiento. Los proveedores reciben textos necesarios; Google puede usar contenido del nivel gratuito para mejorar productos. Usar notas de prueba sin datos sensibles.

Demo: iniciar sesión, preguntar cuántas películas hay pendientes y luego buscar una nota por significado. Las llamadas reales requieren ambas claves. El endpoint POST /api/chat admite message e history (máximo 20 mensajes). La búsqueda en memoria es para catálogos pequeños. Esta versión usa una cadena RAG de lectura, sin acciones de escritura ni selección dinámica de herramientas.

### Activar el asistente en los servicios existentes de Render

El archivo render.yaml documenta ambos servicios. Para los servicios ya publicados, conservarlos y actualizar su configuración; no crear un Blueprint nuevo que duplique servicios.

1. Backend peliculasya-backend → Environment: agregar GROQ_API_KEY y GOOGLE_API_KEY con los mismos valores verificados localmente. GOOGLE_API_KEY es la clave de Gemini; no es GOOGLE_CLIENT_SECRET del login. No borrar variables existentes. Modelos opcionales: GROQ_MODEL=openai/gpt-oss-20b y GEMINI_EMBEDDING_MODEL=gemini-embedding-001.
2. Verificar backend: Root Directory backend; Build Command npm ci --include=dev && npm run build; Start Command npm start; NODE_VERSION 22.19.0; NODE_ENV production; Health Check /health. Conservar BETTER_AUTH_URL=https://peliculasya.onrender.com y los secretos de autenticación actuales.
3. Frontend: Root Directory frontend; Build Command npm ci --include=dev && npm run build; Publish Directory dist; NODE_VERSION 22.19.0. Nunca agregar claves de IA al frontend.
4. Rewrites, en orden: /api/* hacia https://peliculasya-backend.onrender.com/api/* y luego /* hacia /index.html. Esto incluye POST /api/chat y mantiene la cookie de sesión en el mismo origen.
5. Publicar el código revisado en el repositorio y desplegar backend y frontend desde el mismo commit. Agregar las variables no publica el código que aún esté solo en el equipo.
6. Verificar /health, login, apertura y cierre del chat flotante, navegación y F5 en https://peliculasya.onrender.com. Preguntar por pendientes y por una nota de prueba. Confirmar respuesta progresiva, formato legible y persistencia al refrescar. Un backend gratuito dormido puede demorar en despertar.
7. Si hay errores, revisar Events y Logs del backend sin publicar secretos. Un 503 del chat indica claves faltantes; un evento de error puede indicar cuota o fallo del proveedor. Revertir a un deploy previo de ambos servicios si se necesita rollback.

No se ha configurado ni verificado automáticamente la cuenta de Render desde esta sesión: requiere acceso a Render. El .env local no se sincroniza ni se sube al repositorio. Si se habilita una API key de Render para asistencia, guardarla localmente y nunca compartirla por chat.
