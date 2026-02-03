# 📦 Configuración de Dropbox API para Ajedrez Q-Learning

Este archivo contiene las instrucciones para configurar Dropbox API y obtener el access token necesario para guardar/cargar el conocimiento de aprendizaje.

## 🔑 Paso 1: Crear App en Dropbox

1. Ve a [Dropbox Developers](https://www.dropbox.com/developers)
2. Haz clic en "Create App"
3. Completa el formulario:
   - **App name:** Ajedrez Q-Learning
   - **Choose the type of access you need:** Full Dropbox
   - **Limit file access:** Files and data stores
   - **Choose the type of access you need:** App folder (recomendado) o Full Dropbox
4. Haz clic en "Create App"

## 🔑 Paso 2: Obtener Access Token

1. En la página de tu app, ve a la sección "OAuth 2"
2. Haz clic en "Generate" en "Generated access token"
3. Copia el token generado (se ve como una cadena larga de caracteres)
4. **IMPORTANTE:** Guarda este token en un lugar seguro, solo se muestra una vez

## ⚙️ Paso 3: Configurar en la Aplicación

Una vez que tengas el access token, ve a la aplicación y:

1. Haz clic en el botón "📦 Configurar Dropbox"
2. Pega el access token en el campo correspondiente
3. Haz clic en "Guardar Configuración"
4. La aplicación ahora guardará/cargará el conocimiento desde Dropbox automáticamente

## 📊 Información de la API

| Aspecto | Detalle |
|---------|---------|
| API | Dropbox API v2 |
| Endpoint | https://api.dropboxapi.com/2/ |
| Autenticación | OAuth 2.0 (Access Token) |
| Almacenamiento | 2GB gratuito |
| Límite de archivos | Ilimitado (hasta 2GB) |

## 🔒 Seguridad

- **Nunca compartas** tu access token públicamente
- **No guardes** el token en el repositorio de GitHub
- **El token** se guardará en localStorage de tu navegador
- **Si cambias** de navegador, necesitarás configurar el token nuevamente

## 📝 Notas

- El access token es permanente hasta que lo revoques manualmente
- Puedes revocar el token en cualquier momento desde la página de tu app en Dropbox
- La aplicación guardará el conocimiento en la carpeta `/Apps/Ajedrez Q-Learning/`

## 🔗 Enlaces Útiles

- [Documentación de Dropbox API](https://www.dropbox.com/developers/documentation/http/documentation)
- [Dropbox Developers](https://www.dropbox.com/developers)
- [Dropbox App Console](https://www.dropbox.com/developers/apps)
