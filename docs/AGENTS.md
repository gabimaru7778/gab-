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

Alternativa legítima: añadir un adaptador para un servidor propio de ComfyUI y modelos de generación con licencias compatibles. Esto evita pagar por cada llamada a ComfyUI, pero no hace que la generación sea gratis: requiere equipo con GPU o cómputo/hosting, electricidad y almacenamiento. La integración debe activarse solo cuando exista un endpoint privado autenticado y controles de uso.

El agente `providers` busca referencias a `hillfit` y `higgsfield`. Una coincidencia textual de Hillfit se reporta para revisión; no se borra automáticamente porque podría ser texto legítimo o un error en un mensaje de diagnóstico.
