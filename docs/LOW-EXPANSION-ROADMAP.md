# LOW — roadmap de expansión

Este documento conserva el alcance acordado para LOW y separa capacidades implementables, integraciones y dependencias externas. Es una hoja de ruta, no una afirmación de que todas las funciones estén ya instaladas.

## Principios del producto

- LOW es un asistente personal propio, con interfaz en español y experiencia prioritaria en iPhone; debe adaptarse también a iPad, Android y escritorio.
- Mantener la aplicación Replit existente como punto de partida: React, backend, autenticación Clerk y almacenamiento de conversaciones, tareas y memorias. No reconstruir ni sustituir esa base sin una migración comprobada.
- Arquitectura multimodelo: proveedor intercambiable por tarea; GLM-5.3 se conserva como preferencia de motor principal cuando exista acceso compatible y credenciales válidas. Permitir otros proveedores mediante adaptadores, sin acoplar el producto a uno solo.
- Separar la identidad y políticas de producto de LOW de las reglas particulares de una interfaz conversacional concreta. LOW puede ofrecer preferencias configurables, selección de proveedores y explicaciones transparentes; no debe prometer eludir controles legales, de seguridad, de proveedores o de plataformas.
- Autonomía gradual, visible y revocable: pedir confirmación antes de acciones externas, destructivas, financieras, de publicación o que cambien permisos.
- Privacidad por defecto: aislamiento por usuario, secretos fuera del cliente, memoria privada, controles de exportación y borrado, auditoría y retención configurable.

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

## Modelos y agentes

Implementar una interfaz común de proveedor con adaptadores separados. No asumir que un nombre de modelo está disponible por API solo porque exista en una interfaz o anuncio. Verificar endpoint, región, modelo, cuota y autorización antes de habilitarlo.

- Motor preferido: GLM-5.3, sujeto a disponibilidad real del proveedor y credenciales.
- Proveedores alternativos: OpenAI, Anthropic, Google, Z.ai/GLM y otros que el usuario conecte y estén disponibles.
- Agentes: planificación, investigación, programación, revisión de código, pruebas, seguridad defensiva y creación multimedia.
- Enrutamiento: tarea, coste estimado, contexto disponible, latencia, calidad, cuota y preferencia explícita.
- Registrar modelo/proveedor utilizado, sin guardar secretos ni contenido sensible innecesario.

## Compatibilidad multidispositivo

- PWA adaptable con navegación táctil y escritorio.
- Diseño para iPhone primero; después iPad, Android, macOS, Windows y Linux mediante navegador/PWA.
- Estado sincronizado solo tras autenticación; conflictos resueltos con versiones y marcas temporales.
- Trabajos largos ejecutados en servidor, recuperables al cerrar la app; notificaciones opt-in.
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

### Fase 3 — agentes y trabajos persistentes
- Planificador de tareas, cola, estado, reintentos, cancelación y límites de consumo.
- Agentes especializados que usan herramientas tipadas y permisos por acción.
- Handoff humano antes de operaciones sensibles.

### Fase 4 — memoria, voz y creación
- Memoria privada y controles de usuario.
- Voz configurable y conversación multimodal según proveedores.
- Flujos de creación de texto, imágenes, audio y vídeo, con estados de trabajo.

### Fase 5 — multiplataforma y endurecimiento
- PWA instalable y pruebas reales en iOS Safari, Android Chrome y escritorio.
- Accesibilidad, rendimiento, sincronización, backups y recuperación.
- Threat model, pruebas de aislamiento multiusuario y auditoría independiente.

## Criterios de aceptación

- La app existente sigue iniciando sesión y conserva conversaciones, tareas y memorias.
- Un proveedor puede cambiarse sin reescribir el chat ni los agentes.
- Un repositorio GitHub conectado puede consultarse con lectura y los permisos visibles.
- Toda escritura requiere permiso específico y confirmación contextual.
- Una tarea prolongada sobrevive a cerrar y volver a abrir la app.
- El diseño funciona en anchos de 320 px hasta escritorio, con pruebas reales en dispositivos.
- Ninguna clave, token o secreto aparece en bundles, logs o respuestas del cliente.
- Cada capacidad se marca como implemented, connected, needs_credentials, planned o blocked; nunca se presenta una idea como integración terminada.
