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
- Auth flow: JWT login + protected dashboard route
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

1. `docker compose up --build -d`
2. Services:
   - PostgreSQL on `localhost:5432`
   - Backend API on `localhost:8080`

Notes:

- Compose now builds backend from `back/`.
- Database schema is initialized from `back/KigenTaskDB.sql` on first DB startup.

## API Summary

- Auth:
  - `POST /api/v1/auth/register`
  - `POST /api/v1/auth/login`
- Users:
  - `GET /api/v1/users/me`
- Projects:
  - `POST /api/v1/projects`
  - `GET /api/v1/projects`
  - `GET /api/v1/projects/{projectId}`
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