# LOW — roadmap de expansión

Este documento conserva el alcance acordado para LOW y separa capacidades implementables, integraciones y dependencias externas. Es una hoja de ruta, no una afirmación de que todas las funciones estén ya instaladas.

## Principios del producto

- LOW es un asistente personal propio, con interfaz en español y experiencia prioritaria en iPhone; debe adaptarse también a iPad, Android y escritorio.
- Mantener la aplicación Replit existente como punto de partida: React, backend, autenticación Clerk y almacenamiento de conversaciones, tareas y memorias. No reconstruir ni sustituir esa base sin una migración comprobada.
- Arquitectura multimodelo: proveedor intercambiable por tarea; GLM-5.3 se conserva como preferencia de motor principal cuando exista acceso compatible y credenciales válidas. Permitir otros proveedores mediante adaptadores, sin acoplar el producto a uno solo.
- Separar la identidad y políticas de producto de LOW de las reglas particulares de una interfaz conversacional concreta. LOW puede ofrecer preferencias configurables, selección de proveedores y explicaciones transparentes; no debe prometer eludir controles legales, de seguridad, de proveedores o de plataformas.
- Autonomía gradual, visible y revocable: pedir confirmación antes de acciones externas, destructivas, financieras, de publicación, escaneo activo o que cambien permisos.
- Privacidad por defecto: aislamiento por usuario, secretos fuera del cliente, memoria privada, controles de exportación y borrado, auditoría y retención configurable.
- Integrar componentes de terceros mediante adaptadores, revisando licencia, mantenimiento, dependencias, permisos y cadena de suministro antes de incorporarlos. No copiar software propietario ni descompilar apps para reproducir sus funciones protegidas.

## Arquitectura objetivo

| Módulo | Responsabilidad |
|---|---|
| LOW CORE | Identidad de producto, configuración, sesiones y políticas de permisos. |
| LOW ROUTER | Selección de modelo/herramienta por tarea, coste, latencia, disponibilidad y preferencia. |
| LOW MEMORY | Memoria privada, búsqueda contextual, resúmenes, retención y controles del usuario. |
| LOW SKILLS | Herramientas tipadas y extensiones independientes con permisos mínimos. |
| LOW AGENTS | Flujos de investigación, programación, pruebas, planificación y revisión. |
| LOW CLOUD | Trabajos persistentes, cola, reintentos, estado y notificaciones. |
| LOW CREATOR | Flujos para texto, imagen, audio y vídeo con proveedores compatibles. |
| LOW VOICE | Conversación por voz, transcripción y voces configurables según proveedor. |
| LOW SHIELD | Gestión de secretos, aislamiento, permisos, auditoría y análisis defensivo. |
| LOW MULTIDEVICE | PWA/responsive, instalación, sincronización autenticada y continuidad entre dispositivos. |
| LOW DEVELOPER | GitHub, repositorios, ramas, commits, PR, Issues, Actions y asistentes de programación. |
| LOW CONTROL | Panel configurable, widgets de estado, controles rápidos, automatizaciones y aprobaciones. |
| LOW NETWORK | Diagnóstico de conectividad y red local con alcance explícito y herramientas no intrusivas. |
| LOW DATA | Validación de datos, esquemas, calidad, normalización y reportes de inconsistencias. |
| LOW ANDROID | Contenedor Android nativo, permisos del sistema, notificaciones y distribución APK/AAB. |

## Panel de control y herramientas de red

LOW CONTROL tendrá una consola modular que muestre estado de servicios, modelos conectados, tareas en curso, uso/cuotas, dispositivos, integraciones, alertas y registros. Los controles de acciones externas estarán separados de los indicadores de solo lectura.

LOW NETWORK se divide en niveles:
1. Diagnóstico local: estado de conexión, tipo de red, gateway/DNS cuando el sistema lo permita, latencia a destinos de prueba elegidos, resolución DNS, disponibilidad HTTP/HTTPS, certificado TLS y pérdida de paquetes aproximada.
2. Diagnóstico de red propia: comprobaciones no intrusivas de servicios/dispositivos de una LAN propia, únicamente después de elegir el rango y confirmar autorización; límites de velocidad, concurrencia y tiempo, sin explotación ni evasión.
3. Informes: guardar fecha, dispositivo, alcance, método, resultados y limitaciones; ocultar direcciones y datos sensibles en exportaciones cuando sea necesario.

No se habilitará captura de tráfico, interceptación TLS, suplantación, escaneo masivo de Internet ni acceso a redes ajenas por defecto. En Android, las APIs disponibles dependen de la versión y permisos; la lectura de Wi-Fi/ubicación y las funciones VPN requieren permisos y explicación explícita.

## Validación de datos

LOW DATA podrá validar JSON/CSV/XML y formularios mediante esquemas declarados, tipos, campos requeridos, rangos, fechas, formatos, duplicados, referencias cruzadas y reglas de negocio. Debe distinguir errores confirmados de advertencias, ofrecer vista previa y no modificar el original sin crear copia y recibir confirmación. Enmascarar datos personales y secretos en logs y reportes.

## Integraciones GitHub

Diseñar un adaptador independiente llamado GitHubProvider para que la aplicación no dependa de un único conector. Capacidades objetivo, sujetas a los permisos reales de la cuenta:

1. Lectura: repositorios, metadatos, ramas, commits, árboles, archivos, releases, Issues, PR y ejecuciones de Actions.
2. Desarrollo: crear ramas, proponer cambios, crear commits y abrir PR; comparar cambios y consultar revisiones.
3. Colaboración: crear/actualizar Issues, etiquetas, comentarios, asignaciones y revisiones, siempre dentro de permisos concedidos.
4. CI/CD: leer resultados y logs de workflows; solicitar ejecuciones solo con confirmación y permisos explícitos.
5. Seguridad: consultar alertas de Dependabot, secret scanning y code scanning cuando el repositorio y token tengan acceso; nunca leer ni mostrar valores de secretos.
6. Eventos: webhooks firmados para sincronizar cambios, PR, Issues y Actions; validar firma, deduplicar eventos y reintentar con backoff.
7. Compatibilidad: REST API, GraphQL cuando aporte valor, GitHub App como integración preferida, OAuth para identidad y permisos mínimos. El token no debe llegar al navegador.

### Matriz de permisos

- Por defecto: lectura.
- Escritura de archivos, ramas, Issues y PR: permiso independiente y confirmación contextual.
- Merge, publicación, despliegue, cambios de Actions/secrets, borrado y cambios de permisos: confirmación reforzada; nunca acciones autónomas silenciosas.
- Mostrar en LOW qué cuenta, organización, repositorio y permisos están conectados.
- Respetar límites de tasa, paginación, scopes, reglas de organización y respuestas 401/403/404/409/422/429/5xx.

## Modelos, agentes y herramientas investigadas

Implementar una interfaz común de proveedor con adaptadores separados. No asumir que un nombre de modelo está disponible por API solo porque exista en una interfaz o anuncio. Verificar endpoint, región, modelo, cuota y autorización antes de habilitarlo.

- GLM-5.3: preferencia solicitada, pendiente de verificar ID/endpoint y acceso API real.
- OpenCode: candidato para el plano de agentes/codificación; estudiar integración como servicio o agente externo aislado, no incrustar su entorno completo dentro de la app móvil.
- Everything Claude Code (ECC): candidato para adaptar skills, hooks, agentes y prácticas de verificación que sean compatibles con la licencia y el runtime de LOW.
- OpenAI, Anthropic, Google/Gemini, Z.ai/GLM y otros: adaptadores opcionales si el usuario conecta credenciales y el proveedor habilita el modelo.
- GPT-6.1 Terra, Gemini 4 Hydrogen, Cloudflare Codex Harness y otros nombres mencionados previamente: mantener como elementos por verificar; no activar ni anunciar disponibilidad hasta confirmar proyecto, documentación, API y licencia.
- Agentes: planificación, investigación, programación, revisión de código, pruebas, seguridad defensiva, diagnóstico de red autorizado y creación multimedia.
- Enrutamiento: tarea, coste estimado, contexto disponible, latencia, calidad, cuota y preferencia explícita.
- Registrar modelo/proveedor utilizado, sin guardar secretos ni contenido sensible innecesario.

## Android APK y distribución

La primera vía recomendada es reutilizar la interfaz web existente dentro de una envoltura Android con Capacitor, siempre que la auditoría confirme compatibilidad. Mantener lógica sensible en el backend; no empaquetar API keys ni secretos en el APK.

- Configurar aplicación Android, nombre/ícono LOW, navegación, manejo de enlaces, almacenamiento seguro y permisos justificados.
- Añadir solo puentes nativos necesarios: notificaciones, compartir archivos, cámara/micrófono si el usuario activa esas funciones, y diagnóstico de conectividad permitido por Android.
- CI de GitHub Actions: compilar, ejecutar pruebas, generar APK debug para pruebas y publicar el artefacto como descarga de pre-release.
- Release: firma con keystore protegido como secreto de CI; nunca subir keystore ni contraseñas al repositorio. Verificar firma y hash antes de distribuir.
- Preparar AAB para Google Play si se decide publicar allí. APK directo para instalación manual, con aviso de origen y verificación de firma.
- Probar instalación, actualización, permisos, enlaces, sesiones, almacenamiento, accesibilidad y comportamiento sin conexión en dispositivos Android reales.

## Seguridad y calidad

- Threat model para cliente, API, proveedores, plugins, webhooks, almacenamiento y trabajos en segundo plano.
- Autenticación fuerte, aislamiento multiusuario en servidor, autorización por recurso y protección CSRF/CORS según arquitectura.
- Validación de entrada/salida, rate limits por usuario, límites de tamaño, protección SSRF, allowlists de destinos para diagnósticos, timeouts y cancelación.
- Secretos en gestor de secretos del hosting; rotación y redacción de logs.
- Dependabot, secret scanning, CodeQL/code scanning cuando el plan/permisos lo permitan; revisar dependencias y licencias.
- Backups cifrados, exportación/borrado verificable y plan de recuperación.
- Ningún agente puede autoelevar permisos ni ejecutar acciones destructivas sin aprobación humana.

## Compatibilidad multidispositivo

- PWA adaptable con navegación táctil y escritorio.
- Diseño para iPhone primero; después iPad, Android, macOS, Windows y Linux mediante navegador/PWA.
- Estado sincronizado solo tras autenticación; conflictos resueltos con versiones y marcas temporales.
- Trabajos largos ejecutados en servidor, recuperables al cerrar y volver a abrir la app; notificaciones opt-in.
- No afirmar integración nativa de iOS/Android sin implementar y probar los permisos y APIs de cada sistema.

## Plan de implementación por fases

### Fase 0 — inventario y estabilización
- Recuperar el estado real de Replit y GitHub; identificar qué es código operativo y qué es documentación.
- Ejecutar build, typecheck, pruebas y análisis de secretos.
- Corregir errores 401/403, 429, 502, desconexiones y sesiones expiradas.
- Mantener la app actual y hacer una copia/branch antes de migraciones.

### Fase 1 — núcleo y proveedor multimodelo
- Interfaces ModelProvider, ToolProvider y MemoryProvider.
- Router con GLM-5.3 preferido si está disponible, fallback configurable y manejo de cuota.
- Configuración segura de proveedores por usuario/entorno.
- Pruebas con mocks y verificación de errores reales.

### Fase 2 — GitHub Developer
- GitHub App / OAuth, scopes mínimos y conexión por usuario.
- Lectura de repositorios, ramas, commits, PR, Issues y Actions.
- Acciones de escritura con confirmación y registro de auditoría.
- Webhooks firmados y panel de actividad.

### Fase 3 — control, red y datos
- Panel de control modular y controles rápidos con permisos visibles.
- Diagnóstico local de conectividad y LAN autorizada con límites y reportes.
- Validación de JSON/CSV/formularios con esquemas y vista previa.
- Pruebas de privacidad, autorización y límites de uso.

### Fase 4 — agentes y trabajos persistentes
- Planificador de tareas, cola, estado, reintentos, cancelación y límites de consumo.
- Agentes especializados que usan herramientas tipadas y permisos por acción.
- Handoff humano antes de operaciones sensibles.

### Fase 5 — memoria, voz y creación
- Memoria privada y controles de usuario.
- Voz configurable y conversación multimodal según proveedores.
- Flujos de creación de texto, imágenes, audio y vídeo, con estados de trabajo.

### Fase 6 — Android y multiplataforma
- Envoltura Android y pipeline de APK/AAB.
- Firma segura, artefactos de prueba y proceso de release.
- PWA y pruebas reales en iOS Safari, Android Chrome y escritorio.
- Accesibilidad, rendimiento, sincronización, backups y recuperación.

## Criterios de aceptación

- La app Replit existente sigue iniciando sesión y conserva conversaciones, tareas y memorias.
- Un proveedor puede cambiarse sin reescribir el chat ni los agentes.
- Un repositorio GitHub conectado puede consultarse con lectura y los permisos visibles.
- Toda escritura requiere permiso específico y confirmación contextual.
- Un diagnóstico de red siempre muestra el alcance y no se ejecuta contra destinos no autorizados.
- Una validación de datos nunca sobrescribe el original sin confirmación.
- Una tarea prolongada sobrevive a cerrar y volver a abrir la app.
- El APK se instala, actualiza y verifica; no contiene secretos.
- El diseño funciona en anchos de 320 px hasta escritorio, con pruebas reales en dispositivos.
- Ninguna clave, token o secreto aparece en bundles, logs o respuestas del cliente.
- Cada capacidad se marca como implemented, connected, needs_credentials, planned o blocked; nunca se presenta una idea como integración terminada.
