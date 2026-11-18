# PeliculasYa

## Platform
web

## Propósito y usuarios
Proyecto académico full stack. Los visitantes y usuarios registrados consultan un catálogo de películas; los administradores crean, editan y eliminan películas.

## Restricciones confirmadas
- Express, TypeScript, MongoDB, React y Vite, reutilizando la arquitectura de la materia.
- Better Auth con email/contraseña y GitHub; el registro asigna el rol user.
- Catálogo público con búsqueda por título y paginación.
- Sin reproducción de películas, pagos, reseñas ni registros privados.
- Afiches mediante URL HTTPS opcional y respaldo cuando no se pueden cargar.
- Backend y frontend separados en Render, con API bajo el mismo origen del frontend.
- Interfaz en español, estética de cine oscuro y adaptación a celulares.
- Código legible separado por responsabilidad; trabajo por etapas explicadas.
- Conservar los apuntes y el ejemplo original de la materia: clases en la raíz y código original en referencia-materia/. PeliculasYa agrega su implementación en backend/ y frontend/ sin borrar ese material de referencia.

## Estado externo
Repositorio propio: https://github.com/TeoFassardi/peliculasya. Frontend: https://peliculasya.onrender.com. Backend: https://peliculasya-backend.onrender.com. Ambos servicios están desplegados en Render y conectados a Atlas. Seed ejecutado con seis películas y cuentas de demostración admin/user. El usuario confirmó OAuth GitHub, sesión tras F5, ABM admin y acceso denegado al usuario común en producción.
