# LOW — vinculación multidispositivo adaptable

## Objetivo de experiencia
La orden de usuario es única: **«LOW, conecta este dispositivo»**. LOW identifica plataforma y capacidades, elige el transporte compatible y presenta el permiso mínimo necesario. No debe pedir al usuario que conozca protocolos.

## Estrategia de transporte (fallback ordenado)
1. **QR + enlace de un solo uso**: opción preferida para vincular móviles, tabletas y escritorio. Un equipo muestra QR; el otro lo escanea. El código expira en 2 minutos y la sesión requiere aprobación explícita en el equipo propietario.
2. **Red local**: descubrimiento solo dentro de la LAN autorizada, con permiso del sistema y un agente LOW visible en el dispositivo remoto. No realizar barridos indiscriminados.
3. **Bluetooth/BLE**: usar el selector nativo de dispositivos complementarios en Android cuando sea compatible; la asociación del sistema no crea por sí misma un canal de datos, que debe establecerse después.
4. **LOW Sync relay**: canal cifrado de salida para equipos en redes distintas. Solo se habilita cuando exista un servicio de sincronización desplegado, identidad de dispositivo, claves por equipo y aprobación de ambas partes.

## Requisitos de seguridad para la implementación completa
- Tokens de emparejamiento aleatorios, de un solo uso, con vencimiento corto y límite de intentos.
- Confirmación visual en ambos equipos; mostrar nombre, plataforma y permisos solicitados.
- Claves por dispositivo, revocación individual, rotación y registro de actividad.
- TLS extremo a extremo cuando aplique; no enviar contraseñas Wi-Fi, claves API ni archivos privados durante el descubrimiento.
- No aceptar dispositivos desconocidos ni ejecutar acciones remotas por el mero hecho de descubrirlos.
- Sincronización por categorías con permisos granulares: portapapeles, archivos, notificaciones, cámara, micrófono, ubicación y control remoto separados.
- Android: Companion Device Manager para el emparejamiento nativo Bluetooth/Wi-Fi donde aplique; permisos de red local según la versión de Android/Capacitor.
- iOS: QR/deep link y APIs públicas de Apple; no prometer descubrimiento Bluetooth o control de otros equipos que iOS no exponga a una app normal.

## Estado honesto
La base actual detecta plataforma/capacidades del navegador y selecciona una estrategia recomendada. La sesión real entre dispositivos todavía necesita LOW Sync desplegado, flujo de aprobación, almacenamiento seguro de claves y agentes complementarios para escritorio/otros móviles. No se presenta una recomendación como conexión ya establecida.
