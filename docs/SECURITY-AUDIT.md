# Informe de auditoría técnica de LOW

Fecha: 16 de noviembre de 2026  
Rama revisada: `low-github-native`  
Alcance: revisión estática del código, revisión de endpoints y pruebas de integración en GitHub Actions. No es una prueba de penetración ni una certificación de seguridad.

## Parches aplicados

- Corregida la lectura de MEMORY: la interfaz ahora consume `records`, que es el campo devuelto por el backend.
- La bóveda valida la forma de salt, IV y ciphertext antes de guardar; el cifrado AES-GCM se realiza en el cliente.
- El registro limita contraseñas a 12–200 caracteres.
- Sesiones aleatorias se almacenan como hashes; la cookie es HttpOnly y SameSite Strict.
- Las claves CONNECT se almacenan como SHA-256, se pueden revocar y se comprueba que cada usuario solo revoque sus propias claves.
- Los límites por ruta se guardan en SQLite y distinguen correctamente rutas montadas; las pruebas cubren el límite y la independencia de SHIELD.
- CREATOR requiere sesión LOW, aplica límites distintos para envío y polling, guarda solo el hash del token temporal y expira los trabajos a las 24 horas.
- El token de consulta de CREATOR se envía en un header y no en la URL.
- RESEARCH usa una URL de proveedor fija; no permite que el usuario suministre una URL de destino.
- El sandbox DEVELOPER ejecuta JavaScript en un iframe con origen opaco, CSP sin conexiones de red, sin Node ni acceso a archivos, y un límite de 2 segundos.
- El texto de interfaz ahora diferencia módulos completos, parciales y pendientes.

## Pendientes que bloquean producción

1. Verificación de correo, recuperación de cuenta y política de bloqueo/rotación de sesiones.
2. Revisión formal de CSRF y pruebas de navegador en despliegue real. Actualmente se usa SameSite Strict y allowlist de Origin en producción; no hay flujo CORS público para clientes web externos.
3. Backups cifrados, prueba de restauración, exportación y borrado de datos.
4. Auditoría de eventos y observabilidad.
5. Revisión de configuración del host, proxy inverso, persistencia de SQLite, HTTPS y límites de recursos.
6. Dependencias sin lockfile comprometido; CI utiliza `npm install`, no `npm ci`.
7. Prueba de los proveedores configurados: `LOW_AI_API_KEY`, `TAVILY_API_KEY` y una instancia privada de ComfyUI con workflows API de imagen y vídeo.
8. Pruebas de carga y revisión externa independiente antes de abrir el servicio a usuarios.

## Límites funcionales

- El sandbox es solo JavaScript de navegador; no es una VM, contenedor Linux, Python, shell ni ejecución de repositorios.
- VOICE depende del soporte de voz del navegador; no escucha en segundo plano.
- LEARNING tiene una verificación diaria de CI configurada en este branch, pero no un agente que se autoentrene ni modifique código. El schedule de GitHub Actions solo se activa cuando el workflow llega a la rama predeterminada.
- CLOUD guarda registros cifrados por cuenta en SQLite; el acceso desde varios dispositivos requiere una única instancia de backend persistente. No hay backups automatizados.
- Android no se puede cerrar con seguridad hasta tener backend HTTPS desplegado y una estrategia de autenticación móvil probada. No se incrustan secretos de proveedor en el APK.

## Resultado

Los checks de TypeScript, build y pruebas de API han pasado en commits anteriores de esta misma rama. El último parche de aislamiento de límites está en verificación CI. No hay despliegue de producción ni se ha fusionado el PR.


## ORS4Net KeyHunter: límites de integración

Repositorio revisado: https://github.com/n0rs4rt/Ors4Net-keyHunter. Su README describe una aplicación Python de escritorio para Windows que enumera perfiles Wi-Fi guardados y puede mostrar contraseñas, importar/exportar perfiles y comprobar exposición mediante k-anonymity.

LOW solo incorpora un enlace informativo al proyecto. No se integra extracción de contraseñas, recolección remota, importación/exportación de perfiles, eliminación de redes, validación de credenciales ni envío de secretos a LOW. Los reportes que genere el programa pueden contener contraseñas y deben permanecer bajo control local del propietario.

La herramienta requiere Windows y hardware Wi-Fi compatible; no se ejecuta en el iPhone ni en el backend web de LOW. Revisa el código y la licencia del proyecto original antes de instalar binarios.
