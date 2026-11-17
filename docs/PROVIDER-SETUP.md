# Configuración de proveedores y despliegue de LOW

## Secretos del servidor

Configura estos valores en el gestor de secretos del **servicio donde se despliegue el backend**. Los secretos guardados en GitHub Actions no se convierten automáticamente en variables de entorno del servidor.

| Variable | Uso | Obligatoria |
|---|---|---|
| `LOW_AI_API_KEY` | Chat, WORK y SHIELD | Sí, para respuestas IA |
| `LOW_AI_BASE_URL` | Base URL compatible con OpenAI | No |
| `LOW_AI_MODEL` | Modelo del proveedor | No |
| `TAVILY_API_KEY` | Búsqueda web RESEARCH | Sí, para búsqueda real |
| `HF_API_KEY_ID` | Identificador de la API de Higgsfield | Sí, para CREATOR |
| `HF_API_KEY_SECRET` | Secreto de la API de Higgsfield | Sí, para CREATOR |
| `APP_ORIGIN` | Origen público del frontend | Sí, en producción |
| `APP_ORIGINS` | Lista separada por comas de orígenes permitidos | Alternativa a APP_ORIGIN |
| `LOW_DATA_DIR` | Directorio persistente de SQLite | Sí, configurar almacenamiento persistente |

No pegues claves en el chat, en Issues, en archivos del repositorio ni en el código del navegador. Si una clave se expone, revócala y genera otra.

## Higgsfield: CREATOR

1. Crea una cuenta API en [Open Higgsfield](https://open.higgsfield.ai/).
2. Genera las credenciales ID y Secret.
3. Añádelas como `HF_API_KEY_ID` y `HF_API_KEY_SECRET` al entorno del backend.
4. Confirma que la cuenta API tiene saldo disponible. La suscripción del sitio Higgsfield y el saldo API son productos de facturación separados.
5. Prueba primero una imagen sencilla; revisa el coste del modelo y sus parámetros antes de generar vídeo.

LOW utiliza Soul Standard para imágenes y Seedance 2.0 para vídeo. Los trabajos se consultan en segundo plano y sus tokens de consulta expiran después de 24 horas.

## RESEARCH

Crea una clave de Tavily y configúrala como `TAVILY_API_KEY`. Si no está configurada, LOW devolverá un error de configuración y no afirmará haber buscado en Internet.

## Despliegue

El backend necesita un servicio Node.js persistente y almacenamiento persistente para `LOW_DATA_DIR`. Un hosting estático (por ejemplo, GitHub Pages) no puede ejecutar este backend SQLite.

Antes de producción:
- configurar HTTPS y el origen exacto en `APP_ORIGIN`;
- montar un volumen persistente para SQLite y copias de seguridad;
- establecer límites persistentes de uso y observabilidad;
- revisar autenticación, recuperación de cuenta, CSRF y política de datos;
- realizar una prueba de restauración y una revisión externa de seguridad.

## Android

No compilar ni publicar el APK hasta que exista un backend HTTPS estable y se haya resuelto el acceso autenticado desde la aplicación móvil. El backend actual utiliza cookies de sesión HttpOnly y protección por origen; un APK Capacitor que llame a un dominio distinto necesita una estrategia móvil/CORS/CSRF probada. No incrustar claves de proveedor dentro del APK.
