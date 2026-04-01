# KigenTask Frontend

Frontend base en React + TypeScript para consumir la API de KigenTask con autenticacion JWT.

## Incluye

- Login conectado a `/api/v1/auth/login`
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

Ejemplo:

```bash
VITE_API_BASE_URL=http://localhost:8080/api/v1
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
