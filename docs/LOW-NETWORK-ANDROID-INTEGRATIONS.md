# LOW — especificación de control, redes, datos y Android

Estado: diseño técnico pendiente de implementación sobre el proyecto LOW real. La rama actual del repositorio contiene el Cyber Lab PWA, no el código completo de Replit.

## 1. Panel LOW CONTROL
- Inicio configurable con tarjetas de conexión, modelos, trabajos, notificaciones, estado de servicios, seguridad, almacenamiento y dispositivos.
- Centro de comandos: cada acción explica qué hará, sobre qué recurso, con qué permisos y si modifica datos.
- Historial auditable con usuario, fecha, alcance, resultado y botón de cancelación cuando sea posible.
- Separar controles de lectura, acciones reversibles y acciones sensibles.

## 2. LOW NETWORK
- Pruebas locales: conectividad, gateway/DNS si el SO lo expone, DNS lookup, HTTP/HTTPS, TLS, latencia y pérdida aproximada.
- Pruebas de LAN propia: inventario acotado y chequeos no intrusivos solo tras elegir rango y confirmar propiedad/autorización.
- Allowlist de destinos, límites de concurrencia, timeout, backoff y botón detener.
- Sin escaneo de Internet, explotación, fuerza bruta, interceptación, captura de tráfico ni evasión.
- En Android, declarar permisos mínimos y explicar su uso; las APIs de red y Wi-Fi cambian según versión y fabricante.

## 3. LOW DATA
- Validadores para JSON, CSV, XML y formularios mediante esquemas configurables.
- Tipos, requeridos, longitudes, rangos, fechas, patrones, duplicados y consistencia entre campos.
- Informe con errores, advertencias y sugerencias; distinguir validación sintáctica de veracidad del dato.
- Vista previa y exportación; no sobrescribir el original sin aprobación.
- Redacción de PII, credenciales y tokens en logs.

## 4. LOW ANDROID
- Auditar el frontend y backend reales antes de elegir Capacitor o un wrapper nativo.
- Reutilizar UI React cuando sea compatible; mantener las claves y la lógica privada en servidor.
- Construir APK debug en CI para pruebas; firmar release con keystore guardado como secreto de CI.
- Verificar firma, hash, permisos, actualizaciones y compatibilidad de Android.
- Generar AAB solo si se decide publicar en Google Play.
- Entregar APK mediante Releases/Artifacts; no afirmar que existe hasta que el pipeline lo produzca y se pruebe en un teléfono.

## 5. Candidatos GitHub para evaluación
- OpenCode: agente de codificación open source; evaluar servicio externo/aislado, provider adapters y modelo de permisos.
- Everything Claude Code: evaluar skills, hooks, agentes, reglas y pruebas que puedan adaptarse; revisar licencia y dependencias antes de copiar o modificar.
- GLM/Z.ai: verificar API oficial, identificadores de modelo, región, cuotas y credenciales. El nombre GLM-5.3 queda como preferencia, no como conexión confirmada.
- GitHub Actions, Dependabot, secret scanning y CodeQL: integrar estados y alertas si la cuenta, el repositorio y el plan conceden permisos.

## 6. Seguridad de extensiones
- Cada plugin/skill declara versión, licencia, origen, permisos, endpoints, datos que lee/escribe y mantenimiento.
- Ejecutar herramientas externas aisladas del proceso web; validar entradas y salidas; denegar por defecto.
- Prohibir secretos en el cliente y revisar dependencias con lockfile y escaneo.
- Requerir aprobación antes de escribir repositorios, publicar, desplegar, escanear redes o cambiar configuraciones.
