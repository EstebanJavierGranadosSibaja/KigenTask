# KigenTask Frontend

Frontend base en React + TypeScript para consumir la API de KigenTask con autenticacion JWT.

## Incluye

- Login conectado a `/api/v1/auth/login`
- Registro normal conectado a `/api/v1/auth/register`
- Login con Google conectado a `/api/v1/auth/google`
- Session bootstrap con token en `localStorage`
- Ruta protegida para dashboard
- Dashboard inicial con:
  - perfil autenticado (`/api/v1/users/me`)
  - listado de proyectos (`GET /api/v1/projects`)
  - creacion de proyecto (`POST /api/v1/projects`)

## Requisitos

- Node.js 20+
- Backend KigenTask corriendo (por defecto en `http://localhost:8080`)

## Configuracion

1. Crear archivo `.env` tomando como base `.env.example`.
2. Ajustar `VITE_API_BASE_URL` si el backend usa otro host o puerto.
3. Configurar `VITE_GOOGLE_CLIENT_ID` con el Client ID Web de Google Cloud.
4. En Google Cloud, agregar los origenes del frontend en "Authorized JavaScript origins": `http://localhost:5173` y `http://127.0.0.1:5173`.

Ejemplo:

```bash
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_GOOGLE_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com
```

## Scripts

```bash
npm install
npm run dev
npm run lint
npm run build
```

Desde la raiz del monorepo puedes usar:

```bash
npm --prefix front install
npm --prefix front run dev
npm --prefix front run lint
npm --prefix front run build
```

## Estructura relevante

- `src/context/AuthContext.tsx`: proveedor de autenticacion y bootstrap de sesion
- `src/context/useAuth.ts`: hook de acceso al contexto
- `src/lib/api.ts`: cliente HTTP base y manejo de errores
- `src/pages/LoginPage.tsx`: pantalla de login
- `src/pages/DashboardPage.tsx`: pantalla protegida inicial
