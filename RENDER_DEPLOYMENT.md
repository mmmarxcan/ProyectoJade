# 🚀 Guía de Despliegue en Render

## ✅ Estado del Proyecto

Tu proyecto ahora está **100% listo para Render**. Se han realizado los siguientes cambios:

### ✨ Cambios Realizados:

1. **Backend actualizado** (`backend/server.js`):
   - ✅ Ahora sirve los archivos estáticos del frontend
   - ✅ CORS configurado correctamente para producción
   - ✅ Soporte para rutas SPA (Single Page Application)
   - ✅ Agregadas dependencias de ruta dinámicamente

2. **Backend package.json**:
   - ✅ Script `build` agregado (construye frontend automáticamente)
   - ✅ Especificación de versión de Node (>=18.0.0)

3. **Frontend package.json**:
   - ✅ Agregadas dependencias `react` y `react-dom` (faltaban)

4. **Variables de entorno**:
   - ✅ Backend `.env` actualizado
   - ✅ Frontend `.env` configurado para desarrollo

5. **Archivos nuevos**:
   - ✅ `render.yaml` - Configuración para Render
   - ✅ `.gitignore` - Protege archivos sensibles

---

## 📋 Pasos para Desplegar en Render

### 1️⃣ Preparar el repositorio Git

```bash
git add .
git commit -m "Prepare project for Render deployment"
git push origin main
```

### 2️⃣ Crear cuenta en Render
- Visita [render.com](https://render.com)
- Regístrate con GitHub
- Autoriza a Render para acceder a tus repositorios

### 3️⃣ Crear un nuevo servicio Web

1. Dashboard → **New +** → **Web Service**
2. Selecciona tu repositorio `ProyectoJade`
3. Elige la rama: `main`

### 4️⃣ Configurar el despliegue

**Nombre del servicio:**
```
proyecto-destino
```

**Environment:**
```
Node
```

**Build Command:**
```bash
cd backend && npm install && npm run build
```

**Start Command:**
```bash
cd backend && npm start
```

**Plan:** Free (para comenzar)

### 5️⃣ Configurar variables de entorno

En la sección "Environment Variables", agrega:

| Variable | Valor |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `SUPABASE_URL` | Tu URL de Supabase |
| `SUPABASE_ANON_KEY` | Tu clave anon de Supabase |
| `FRONTEND_URL` | La URL que Render te asigne (ej: `https://proyecto-destino.onrender.com`) |

**Nota:** Las credenciales de Supabase ya están en el `.env` local, pero es recomendable agregarlas como secretos en Render.

### 6️⃣ Desplegar

Render detectará el archivo `render.yaml` automáticamente y realizará el despliegue.

---

## 🔗 Actualizar la URL del API en Producción

Una vez que Render te asigne la URL de tu servicio (ej: `https://proyecto-destino.onrender.com`):

1. **En Render Dashboard**, ve a "Environment Variables"
2. Agrega o actualiza: `FRONTEND_URL=https://proyecto-destino.onrender.com`

El CORS se ajustará automáticamente.

---

## ✅ Verificación Post-Despliegue

Una vez desplegado, verifica que todo funcione:

```bash
# Health check
curl https://tu-url-en-render.onrender.com/health
```

Deberías recibir:
```json
{ "status": "OK", "message": "Servidor Express activo y listo." }
```

---

## 🐛 Solución de Problemas

### El frontend no se construye
- Asegúrate de que `npm install` se ejecute en `/frontend`
- Verifica que todas las dependencias estén en `package.json`

### CORS errors
- Actualiza la variable `FRONTEND_URL` en el `.env` del backend
- Reinicia el servicio en Render

### API calls retornan 404
- Asegúrate de que `VITE_API_URL` en el frontend apunte a la URL correcta
- En desarrollo local: `http://localhost:5000`
- En producción: `https://tu-url-en-render.onrender.com`

### Build fallido
- Revisa los logs en Render: Dashboard → Logs
- Verifica que la estructura de carpetas sea correcta

---

## 📚 Recursos

- [Render Documentation](https://render.com/docs)
- [Express Static Files](https://expressjs.com/en/starter/static-files.html)
- [Vite Build Guide](https://vitejs.dev/guide/build.html)

---

**¡Tu proyecto está listo para el mundo! 🎉**
