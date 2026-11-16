# LOW Academy — laboratorio de redes y ejecución transparente

## Objetivo
Ofrecer un laboratorio didáctico e interactivo que muestre cómo LOW interpreta una instrucción, planifica, ejecuta pasos, inspecciona resultados y propone el siguiente seguimiento. La interfaz debe distinguir siempre entre plan, simulación y acción real.

## Simulador Wi-Fi aislado
- Las redes, puntos de acceso, direcciones, clientes y eventos se generan como datos ficticios en memoria.
- Los rangos de documentación reservados se usan solo como etiquetas de ejemplo.
- No se crea un SSID real, no se emiten tramas, no se abren sockets, no se captura tráfico y no se descubren dispositivos cercanos.
- Escenarios: hogar, oficina segmentada y red de invitados.
- Permite estudiar topología, confianza, segmentación, intentos laterales simulados y controles defensivos.

## Trazabilidad de ejecución
Cada tarea se presenta como una secuencia observable: planificación, límites y permisos, pasos ejecutados, archivos/código afectados, resultados, errores y propuestas de seguimiento. La interfaz debe mostrar estado por paso y permitir pausar, continuar o cancelar. Una simulación no debe presentarse como una operación real.

## Observabilidad de dispositivos
La inspección real solo puede usar APIs del sistema y permisos explícitos, con indicadores visibles y alcance limitado al dispositivo propio o administrado. Cámara, micrófono, ubicación y archivos son permisos separados, apagados por defecto y revocables. No hay captura oculta, persistencia clandestina ni vigilancia de terceros. En el laboratorio, los eventos de cámara/micrófono son exclusivamente sintéticos.

## Simulación de evasión y respuesta
Se permite modelar un nodo ficticio que cambia identificadores, intenta evadir controles o genera señales anómalas. LOW debe mostrar la detección, aislar el nodo virtual y conservar el registro. No se implementan ocultamiento real, evasión de EDR/antivirus, anti-forensics ni autodestrucción para borrar rastros.

## Parada y limpieza
El botón de parada detiene la simulación y elimina únicamente el estado efímero del laboratorio. Los registros de auditoría permanecen disponibles. La limpieza nunca borra archivos del usuario, registros de seguridad ni evidencia.

## Estado de esta entrega
El simulador es local, determinista y no conectado a redes reales. La vinculación multidispositivo, captura autorizada de telemetría del propio equipo, agentes nativos y ejecución remota siguen siendo trabajo separado y requieren aprobación explícita, autenticación mutua y revisión de seguridad.
