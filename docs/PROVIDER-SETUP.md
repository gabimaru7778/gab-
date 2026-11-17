# Configuración de proveedores y despliegue de LOW

## Secretos y variables del servidor

Configura estos valores en el gestor de configuración del servicio donde se ejecute el backend. GitHub Actions Secrets no se convierten automáticamente en variables de entorno del servidor.

| Variable | Uso |
|---|---|
| `LOW_AI_API_KEY` | Chat, WORK y SHIELD |
| `LOW_AI_BASE_URL` | Endpoint compatible con OpenAI |
| `LOW_AI_MODEL` | Modelo del proveedor |
| `TAVILY_API_KEY` | Búsqueda RESEARCH |
| `LOW_COMFYUI_URL` | Dirección privada de ComfyUI, por ejemplo `http://127.0.0.1:8188` |
| `LOW_COMFYUI_PUBLIC_URL` | URL pública/HTTPS desde la que el navegador puede descargar resultados; opcional si el host privado también es accesible desde el navegador |
| `LOW_COMFYUI_IMAGE_WORKFLOW` | JSON de workflow ComfyUI en formato API para imagen |
| `LOW_COMFYUI_VIDEO_WORKFLOW` | JSON de workflow ComfyUI en formato API para vídeo |
| `APP_ORIGIN` | Origen público del frontend |
| `APP_ORIGINS` | Lista separada por comas de orígenes permitidos |
| `LOW_DATA_DIR` | Directorio persistente de SQLite |

No pegues secretos ni workflows con credenciales en el chat, Issues o repositorio.

## CREATOR: ComfyUI (sustituto de Higgsfield)

LOW ya no usa credenciales ni endpoints de Higgsfield. CREATOR utiliza la API HTTP de ComfyUI, un motor abierto que se puede ejecutar en un servidor controlado por ti.

1. Instala ComfyUI desde el repositorio oficial: https://github.com/Comfy-Org/ComfyUI
2. Instala y descarga modelos compatibles con los workflows elegidos. Para vídeo, Wan 2.2 está integrado en ComfyUI: https://github.com/Wan-Video/Wan2.2
3. Inicia ComfyUI en una red privada y configura `LOW_COMFYUI_URL` en el backend.
4. En ComfyUI, exporta cada workflow en formato API (no el formato visual de navegador).
5. En ambos workflows, coloca el marcador literal `{{PROMPT}}` en el campo de texto que recibirá la descripción. Guarda el JSON completo como `LOW_COMFYUI_IMAGE_WORKFLOW` y `LOW_COMFYUI_VIDEO_WORKFLOW` en la configuración del servidor.
6. Si el navegador no puede acceder a la dirección privada del servidor, publica solo la ruta de entrega de archivos detrás de HTTPS y configura `LOW_COMFYUI_PUBLIC_URL`. No expongas la API administrativa de ComfyUI sin autenticación, firewall y proxy seguro.
7. Prueba primero una imagen y después un vídeo corto. Comprueba VRAM, tiempo, almacenamiento y licencia del modelo.

La API de ComfyUI recibe workflows por `POST /prompt`, consulta trabajos por `GET /history/{prompt_id}` y entrega archivos por `GET /view`. LOW conserva su autenticación de usuario, token temporal de trabajo y límite de solicitudes.

### Costes y límites reales

El código de ComfyUI es abierto y la instalación propia no cobra por cada llamada a un proveedor externo. Sin embargo, no significa generación gratuita: necesitas hardware con GPU o un servidor alquilado, electricidad, almacenamiento y ancho de banda. Cada modelo tiene sus propios requisitos y términos de licencia. GitHub aloja el código; no proporciona cómputo GPU gratuito.

## RESEARCH

Configura `TAVILY_API_KEY`. Sin ella, LOW devolverá un error explícito y no afirmará haber buscado en Internet.

## Despliegue

El backend necesita Node.js persistente y almacenamiento persistente para `LOW_DATA_DIR`. Un hosting estático como GitHub Pages no ejecuta este backend SQLite.

Antes de producción:
- configurar HTTPS y origen exacto;
- montar almacenamiento persistente y copias de seguridad;
- mantener ComfyUI en red privada, con autenticación y límites;
- revisar CSRF, recuperación de cuenta y política de datos;
- realizar prueba de restauración y revisión externa de seguridad.

## Android

No compilar ni publicar el APK hasta que exista un backend HTTPS estable y una estrategia de sesión móvil probada. No incrustar claves de proveedor dentro del APK.

## Open Generative AI (estudio complementario)

LOW incluye un acceso externo al proyecto [Anil-matcha/Open-Generative-AI](https://github.com/Anil-matcha/Open-Generative-AI). Su código declara licencia MIT y ofrece estudios de imagen, vídeo, lip-sync y workflows. Esta integración de LOW es un lanzador externo: no incorpora el código de esa aplicación en el backend ni comparte automáticamente chats, bóveda o archivos de LOW.

- Repositorio: https://github.com/Anil-matcha/Open-Generative-AI
- Versión alojada: https://muapi.ai/open-generative-ai
- La versión alojada puede requerir cuenta, credenciales de proveedor o créditos y está sujeta a sus propias condiciones.
- La licencia del repositorio no convierte automáticamente en libres las APIs alojadas, todos los modelos, pesos ni sus usos comerciales. Revisa las licencias de cada modelo y proveedor.
- Para una instalación propia, sigue las instrucciones y requisitos del repositorio original. Necesitarás un equipo/servidor compatible; un iPhone por sí solo no sustituye el hardware de inferencia.
- No introduzcas secretos de LOW ni datos privados en servicios externos salvo que decidas compartirlos.

La integración directa servidor-a-servidor con su catálogo de modelos queda pendiente de un adaptador API documentado y de credenciales guardadas en el gestor de secretos del hosting. No se simula como si ya estuviera conectada.


## ECC: toolkit de ingeniería de agentes

LOW incorpora un acceso al repositorio oficial [affaan-m/ECC](https://github.com/affaan-m/ECC) desde la sección ECC Engineering. ECC aporta flujos de trabajo de ingeniería y configuraciones para distintos agentes de desarrollo. No es el proveedor del chat de LOW ni se instala dentro del backend de producción. Revisa la documentación oficial para elegir el adaptador correspondiente al entorno de desarrollo y evita instalar simultáneamente métodos que dupliquen hooks.
