# LOW — red, datos, integraciones y Android

## Estado

Este documento describe el trabajo sobre la nueva base LOW. No depende de la página de login ni de una instancia anterior. Las capacidades se marcan como activas solo tras pruebas reproducibles.

## LOW CONTROL
Panel modular con estado de servicios, modelos, agentes, trabajos, integraciones, alertas, dispositivos y aprobaciones. Diferenciar indicadores de solo lectura de acciones que modifican recursos.

## LOW NETWORK
- Comprobación de conectividad del dispositivo y disponibilidad de la API propia.
- Diagnóstico adicional: DNS, TLS, HTTP, latencia y conectividad LAN propia, sujeto a APIs del sistema y permisos.
- Allowlist, límites de concurrencia, timeout, cancelación y registro para toda prueba de red.
- No escanear Internet ni redes de terceros; no explotación, fuerza bruta, interceptación o evasión.

## LOW DATA
- JSON: sintaxis, tipos, campos requeridos y esquemas.
- CSV: encabezados, duplicados, campos entrecomillados y consistencia de columnas.
- XML/formularios: añadir validadores por esquema en una fase posterior.
- Vista previa, reporte de errores/advertencias y operación no destructiva.
- Los validadores locales no suben contenido a la API.

## GitHub
GitHub App/OAuth propio de LOW; permisos mínimos; tokens solo en backend. Lectura de repositorios, archivos, ramas, commits, PR, Issues, Actions y alertas disponibles. Las escrituras y ejecuciones requieren aprobación contextual.

## Modelos y agentes
GLM-5.3 como preferencia solo tras verificar endpoint y acceso real. OpenCode y ECC son candidatos para integración modular; revisar licencias, seguridad de dependencias y aislamiento. No copiar componentes propietarios ni presentar servicios como conectados sin pruebas.

## Android
- Capacitor 8 como runtime para empaquetar la interfaz React en Android (Android 7/API 24+ según la matriz de Capacitor 8).\n- La app nativa debe apuntar a `VITE_LOW_API_URL` (variable de repositorio `LOW_API_URL` en Actions); una ruta relativa desde el WebView no sustituye a un backend remoto.\n- Evitar fuentes web externas en el arranque; tipografía de sistema, carga diferida y assets locales.
- Construcción debug APK mediante GitHub Actions, artefacto descargable y verificación de instalación.
- Keystore de release protegido como secreto de CI; nunca subirlo al repositorio.
- AAB solo para Google Play si se decide publicar.
- Revisar permisos nativos y probar en teléfonos reales.

## LOW CONNECT — dispositivos
Consultar `docs/LOW-DEVICE-MESH.md`. La interfaz detecta capacidades y propone transporte; QR/LAN/Bluetooth/relay reales requieren servicio de emparejamiento, agente remoto y aprobación mutua. No etiquetar dispositivos como conectados hasta completar handshake autenticado.
