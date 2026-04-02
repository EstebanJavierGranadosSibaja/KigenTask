# KigenTask Monorepo

KigenTask is organized as a monorepo with a web frontend and a Spring Boot backend.

## Repository Layout

```text
KigenTask
├─ front/   # React + TypeScript (Vite)
├─ back/    # Spring Boot API + PostgreSQL schema + smoke tests
└─ docker-compose.yml
```

## Modules

### front

- Tech: React 19, TypeScript, Vite, React Router
- Auth flow: JWT login, Google login, protected dashboard route
- Main commands:
  - `npm --prefix front install`
  - `npm --prefix front run dev`
  - `npm --prefix front run lint`
  - `npm --prefix front run build`

### back

- Tech: Java 17, Spring Boot 3.5, Spring Security, JPA, PostgreSQL, JWT
- API base path: `/api/v1`
- Main commands:
  - `mvn -f back/pom.xml spring-boot:run`
  - `mvn -f back/pom.xml test`
  - `./back/scripts/smoke-test.ps1`

## Maven Installation (Windows)

Recommended (winget):

- `winget install Apache.Maven`

Then open a new terminal and verify:

- `mvn -v`

## Environment Setup

- Create `back/.env` from `back/.env.example`.
- Create `front/.env` from `front/.env.example`.
- For Docker Compose, create root `.env` from `.env.example`.
- Use the same Google Client ID in backend (`GOOGLE_CLIENT_ID`) and frontend (`VITE_GOOGLE_CLIENT_ID`).
- Set `CORS_ALLOWED_ORIGINS` with your frontend URLs (comma-separated).

## Run Locally

1. Start PostgreSQL (local or Docker).
2. Start backend:
   - `mvn -f back/pom.xml spring-boot:run`
3. Start frontend:
   - `npm --prefix front run dev`
4. Open:
   - Frontend: `http://127.0.0.1:5173`
   - Backend health: `http://localhost:8080/api/v1/health`

## Run with Docker Compose

From repository root:

1. Copy `.env.example` to `.env` in repository root.
1. `docker compose up --build -d`
1. Services are available at `http://localhost:5173` (frontend), `http://localhost:8080` (backend API), and `localhost:5432` (PostgreSQL).

Notes:

- Compose now builds backend from `back/`.
- Compose now builds frontend from `front/`.
- Database schema is initialized from `back/KigenTaskDB.sql` on first DB startup.

Optional demo data (all entities):

- Run `Get-Content -Raw .\back\KigenTaskSeedData.sql | docker exec -i kigen-task-db psql -v ON_ERROR_STOP=1 -U postgres -d kigentask`
- The script is idempotent, you can run it multiple times safely.

Useful commands:

- `docker compose logs -f api`
- `docker compose logs -f front`
- `docker compose down`

## API Summary

- Auth:
  - `POST /api/v1/auth/register`
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/google`
- Users:
  - `GET /api/v1/users/me`
- Projects:
  - `POST /api/v1/projects`
  - `GET /api/v1/projects`
  - `GET /api/v1/projects/{projectId}`
  - `PUT /api/v1/projects/{projectId}`
  - `DELETE /api/v1/projects/{projectId}`
- Tasks:
  - `POST /api/v1/tasks`
  - `PUT /api/v1/tasks/{taskId}`
  - `DELETE /api/v1/tasks/{taskId}`
  - `GET /api/v1/tasks?projectId=&status=&assigneeUserId=`
- Comments:
  - `POST /api/v1/tasks/{taskId}/comments`
  - `GET /api/v1/tasks/{taskId}/comments`

## Monorepo Practices

- Keep frontend-only dependencies in `front/package.json`.
- Keep backend runtime and tooling in `back/pom.xml`.
- Prefer root-level orchestration commands (`npm --prefix front ...`, `mvn -f back/pom.xml ...`) for CI and scripts.

## Deployment Notes

Current state:

- Full stack is dockerized for local and server execution.
- Register/login (credentials) and login with Google are available.

Minimum production checklist before deploy:

- Move from `ddl-auto: update` to managed migrations (Flyway/Liquibase).
- Use strong secrets for JWT and database.
- Set production Google OAuth origins and consent screen.
- Add HTTPS reverse proxy (Nginx/Traefik) and domain.
