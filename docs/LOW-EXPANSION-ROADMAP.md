# LOW — Personal Intelligence

## Dirección del proyecto

LOW se desarrolla como un asistente personal operativo y modular, no como una página de login, no como un clon de ChatGPT y no como un laboratorio de ciberseguridad aislado. El repositorio actual es la base de trabajo. No se toma el proyecto de login anterior ni una instancia externa como fuente obligatoria de la arquitectura.

## Identidad y experiencia

- Interfaz en español, primero móvil, adaptable a tablet y escritorio.
- Estética obsidiana/negro con violeta, esfera holográfica y controles claros.
- Navegación por módulos; panel central configurable; chat y voz como capacidades, no como el producto completo.
- Estado honesto por función: implemented, connected, needs_credentials, planned o blocked.

## Arquitectura

| Módulo | Función |
|---|---|
| LOW CORE | Asistente central, contexto de tarea y conversación. |
| LOW ROUTER | Selección de proveedor/modelo por tarea, coste, latencia y disponibilidad. |
| LOW MEMORY | Memoria privada controlada por el usuario, búsqueda contextual y exportación/borrado. |
| LOW RESEARCH | Investigación, búsqueda y síntesis con fuentes. |
| LOW DEVELOPER | GitHub, repositorios, código, ramas, commits, PR, Issues y Actions. |
| LOW AGENTS | Planificar, delegar, coordinar y verificar agentes especializados. |
| LOW CREATOR | Texto, imagen, audio, música, vídeo y documentos. |
| LOW VOICE | Voz, transcripción y síntesis con permisos explícitos. |
| LOW WORK | Tareas, recordatorios, proyectos y automatizaciones. |
| LOW CONNECT | Integraciones con servicios y dispositivos mediante adaptadores. |
| LOW CLOUD | Cola de trabajos persistentes, reintentos, cancelación y notificaciones. |
| LOW SHIELD | Secretos, permisos, aislamiento, auditoría, límites y protección de datos. |
| LOW CONTROL | Panel de mando, controles rápidos, estado y aprobaciones. |
| LOW NETWORK | Diagnóstico de conectividad y redes propias autorizadas. |
| LOW DATA | Validación, calidad, normalización y análisis de archivos/datos. |
| LOW MULTIDEVICE | Web instalable, continuidad y sincronización segura. |
| LOW ACADEMY | Simulaciones educativas locales, ficticias y aisladas para autenticación, validación y conceptos de seguridad. |\n| LOW ANDROID | Aplicación Android mediante Capacitor, APK de prueba y releases firmadas. |

## Estado real de esta base

- Implementado: interfaz modular, navegación responsive, panel de estado, diagnóstico de conexión navegador/API, validación local JSON/CSV, simulador académico de autenticación SQL en memoria y PWA rebrandeada.
- Pendiente de conexión: modelos, GitHub App/OAuth propio de LOW, agentes, memoria persistente, nube, voz, generadores multimedia y automatizaciones.
- En preparación: configuración Capacitor y flujo de compilación Android.
- No implementado: escaneo activo de redes, ejecución remota, control de dispositivos, sincronización real multidispositivo ni acciones de escritura autónomas.

## Modelos y agentes

- GLM-5.3 es el modelo preferido solicitado, condicionado a verificar ID de modelo, endpoint oficial, acceso de cuenta, cuotas y credenciales.
- Mantener adaptadores independientes para proveedores compatibles; fallback configurable.
- Evaluar OpenCode y Everything Claude Code (ECC) para skills, agentes, hooks y prácticas de desarrollo; revisar licencias, dependencias y aislamiento antes de adoptar componentes.
- Los modelos nombrados en conversaciones previas como Gemini 4 Hydrogen, GPT-6.1 Terra y Cloudflare Codex Harness se consideran candidatos por verificar, no servicios conectados.
- Ningún agente puede autoelevar permisos, filtrar secretos o ejecutar acciones sensibles sin aprobación humana.

## GitHub Developer

- GitHub App/OAuth de LOW con scopes mínimos, credenciales solo en backend y aislamiento por cuenta.
- Lectura de repositorios, ramas, commits, archivos, PR, Issues, Actions y alertas de seguridad disponibles.
- Escrituras, creación de ramas/commits/PR, ejecuciones y cambios de configuración con aprobación contextual.
- Webhooks firmados, paginación, rate limits y reintentos seguros.
- No exponer valores de secretos; solo mostrar estado de alertas si la cuenta tiene acceso.

## Control, redes y datos

- Panel de control para servicios, proveedores, agentes, trabajos, integraciones, alertas y dispositivos.
- Diagnóstico local de conectividad, latencia al propio backend, DNS/TLS/HTTP cuando se habilite el servicio de diagnóstico.
- Cualquier comprobación LAN requiere alcance elegido, autorización, límites, cancelación y registro; nada de escaneo indiscriminado de redes ajenas.
- JSON/CSV/XML y formularios: esquemas, campos requeridos, tipos, rangos, duplicados, consistencia y vista previa. No sobrescribir originales sin aprobación.
- Redactar PII, credenciales y tokens en registros.

## Android y multiplataforma

- Capacitor permite reutilizar la interfaz web en un contenedor Android nativo; se deben probar APIs y permisos en dispositivos reales.
- CI genera APK debug como artefacto de prueba. El release se firma con keystore protegido en secretos de CI; nunca se almacena en Git.
- Preparar AAB solo cuando se decida distribuir en Google Play.
- Mantener web/PWA como experiencia adaptable para iOS, Android y escritorio.

## Seguridad

- Helmet, CSP de producción, rate limits, límites de tamaño, validación de entradas, autorización por recurso y gestión segura de secretos.
- Evitar dependencias remotas innecesarias en cliente; revisar licencias, lockfiles, Dependabot y análisis estático.
- Threat model para navegador, API, agentes, proveedores, webhooks, almacenamiento y trabajos.
- Backups, exportación/borrado, recuperación y auditoría.
- Aprobación humana para despliegues, merges, borrados, cambios de permisos, escritura en repositorios y acciones de red fuera de diagnóstico local.

## Fases

1. Consolidar interfaz, pruebas, seguridad y build reproducible.
2. Implementar router multimodelo y conexión real con GLM cuando se verifique acceso.
3. GitHub Developer con lectura y escrituras aprobadas.
4. LOW CONTROL, NETWORK y DATA con herramientas verificables.
5. Agentes, memoria, nube y trabajos persistentes.
6. Voz, creación multimodal y conectores.
7. Android APK/AAB, pruebas de dispositivo y sincronización multidispositivo.

## Criterios de aceptación

- Build, typecheck y pruebas automatizadas pasan.
- Las funciones locales no envían contenido a proveedores sin aviso.
- Ninguna clave se incluye en el bundle del cliente ni en el repositorio.
- Las integraciones muestran su estado real y permisos.
- Un APK se considera entregado solo después de compilarse y verificarse.
