# LOW: agentes de auditoría autónomos

El workflow `.github/workflows/low-agents.yml` ejecuta cuatro revisores independientes en GitHub Actions al hacer push/PR, manualmente o cada día. Cada agente inspecciona el árbol del repositorio y publica un JSON descargable como artefacto de su ejecución.

| Agente | Responsabilidad |
|---|---|
| Architecture | Estructura frontend/backend, persistencia, reproducibilidad y CI |
| Security | Higiene de secretos, frontera cliente/servidor, sesiones, límites y cabeceras |
| Quality | Pruebas y scripts de comprobación/build |
| Providers | Inventario de proveedores, referencias Hillfit/ComfyUI y opciones alternativas |

## Alcance y límites

Son auditores estáticos deterministas, no agentes LLM con capacidad de modificar código. No hacen llamadas a servicios externos, no ejecutan escaneos de red, no acceden a secretos y no hacen commits. Los informes son señales para revisión, no una certificación de seguridad ni garantía de ausencia de errores.

Las futuras capacidades de agentes que propongan parches deberán trabajar en ramas aisladas, ejecutar pruebas y requerir aprobación humana antes de fusionar o desplegar.

## Sustitución de Higgsfield y costes de CREATOR

El código anterior utilizaba Higgsfield; el runtime actual usa ComfyUI. No debe copiarse una API privada ni eludirse autenticación o facturación de servicios externos.

La alternativa implementada es un servidor propio de ComfyUI con modelos de generación y licencias compatibles. Esto evita pagar por cada llamada a un proveedor SaaS, pero no hace que la generación sea gratis: requiere equipo con GPU o cómputo/hosting, electricidad y almacenamiento. La integración debe activarse solo cuando exista un endpoint privado autenticado y controles de uso.

El agente `providers` busca referencias a `hillfit` y `higgsfield`. Una coincidencia textual de Hillfit se reporta para revisión; no se borra automáticamente porque podría ser texto legítimo o un error en un mensaje de diagnóstico.


## ECC: Everything Claude Code

LOW registra ECC como toolkit de ingeniería de agentes desde el repositorio oficial https://github.com/affaan-m/ECC. ECC ofrece agentes, skills, hooks, reglas, memoria, aprendizaje continuo y flujos de planificación/pruebas/revisión; la matriz de compatibilidad varía por harness. Su licencia del repositorio es MIT según el proyecto.

- La UI de LOW enlaza al repositorio oficial y al paquete oficial AgentShield.
- Esta integración es una referencia y punto de acceso para el entorno de desarrollo, no un runtime de agentes LLM embebido en producción.
- No se descargan ni ejecutan instaladores, hooks o scripts ECC en GitHub Actions ni en el backend de LOW automáticamente.
- Antes de habilitarlo en un entorno, revisar versión, archivos, permisos, hooks y compatibilidad; usar exclusivamente fuentes oficiales y un solo método de instalación por harness.
- Los agentes de auditoría propios de LOW siguen siendo estáticos y de solo lectura; cualquier agente futuro con capacidad de parchear código debe usar rama aislada, pruebas y aprobación humana.

Repositorio canónico: https://github.com/affaan-m/ECC
Paquete AgentShield: https://www.npmjs.com/package/ecc-agentshield
