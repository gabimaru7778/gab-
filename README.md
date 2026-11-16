# LOW ONE

Este repositorio es la única fuente de verdad y desarrollo de LOW. El frontend React y el backend Node/TypeScript viven aquí.

## Migración desde el runtime anterior

- UI recuperada de LOW AppDeploy `low-ko7kz4`, snapshot `1794859894510`, trasladada a `src/`.
- Cliente frontend reemplazado por `src/lib/client.ts`; ya no requiere `@appdeploy/client`.
- Backend independiente inicial en `server/index.ts`: registro/inicio de sesión por correo, sesiones en cookie HttpOnly, SQLite, chat y agente mediante API compatible OpenAI, bóveda cifrada del lado cliente, claves API por usuario y análisis SHIELD defensivo de texto.
- La app antigua queda solo como referencia de migración; no se desarrollarán nuevas funciones allí.

## Desarrollo

Node.js 22+:

```bash
npm install
cp .env.example .env
npm run dev
```

Vite: puerto 5173. API: puerto 3001. Compilar: `npm run build`.

## Estado real de módulos

- CORE: chat base; requiere `LOW_AI_API_KEY` y endpoint/modelo compatibles.
- MEMORY: bóveda cifrada en cliente, almacenada por usuario en SQLite; no hay sincronización multi-dispositivo ni recuperación de clave.
- WORK: agente textual; aún no ejecuta herramientas externas.
- SHIELD: análisis defensivo del texto; no realiza escaneos ni conexiones a objetivos.
- CONNECT: API key por usuario, endpoint Bearer `/v1/chat/completions`, listado de modelos y revocación de claves. Requiere configurar proveedor IA; sin CORS público para navegadores de terceros.
- CREATOR: adaptador multimedia pendiente.
- VOICE: dictado iniciado por el usuario y lectura en voz alta mediante APIs del navegador; la disponibilidad depende de Safari/navegador y permisos del dispositivo. No hay escucha en segundo plano ni voz conversacional en streaming.
- RESEARCH: sin proveedor de búsqueda conectado; el modo actual no navega por la web.
- DEVELOPER: ejecución aislada pendiente; no ejecuta código arbitrario.
- CLOUD: los registros cifrados se guardan en SQLite por cuenta, pero no hay sincronización de clientes/dispositivos ni backup automatizado.
- LEARNING: la ruta de estado es un placeholder; no hay scheduler ni ciclos automáticos.
- Android: no hay APK GitHub-native; requiere endpoint backend HTTPS desplegado y pipeline de compilación.

## Seguridad y despliegue

Contraseñas derivadas con scrypt; sesiones aleatorias almacenadas como hash; cookies HttpOnly/SameSite. Antes de producción faltan rate limiting persistente, verificación de correo, recuperación de cuenta, CSRF/origin hardening, backups, observabilidad y pruebas externas. No guardar secretos en Git. El repositorio sigue siendo público y no se ha cambiado su visibilidad. No hay OAuth ni recuperación de contraseña implementados.
