# KigenTask API

Production-ready Task Management Backend API (similar to a simplified Jira), built with Java 17 and Spring Boot.

## Overview

KigenTask is a modular REST API with:

- JWT authentication
- Layered architecture
- PostgreSQL persistence
- Input validation and global exception handling
- Dockerized runtime for API + database

This repository is structured to be easy to extend with new modules without breaking existing boundaries.

## Core Features

### Authentication

- Register user
- Login user
- JWT token generation
- JWT validation filter
- Stateless security

### Users

- Get current authenticated user profile

### Projects

- Create project
- Get all projects for current user
- Get project by id

### Tasks

- Create task
- Update task
- Delete task
- List tasks with filters (project, status, assignee)

### Comments

- Add comment to task
- Get comments by task

## Tech Stack

- Java 17
- Spring Boot 3.5
- Spring Security
- Spring Data JPA (Hibernate)
- PostgreSQL
- JWT (JJWT)
- Maven
- Docker + Docker Compose

## Architecture

Layered architecture by responsibility:

- controller: HTTP endpoints
- service: business rules and orchestration
- repository: persistence access
- model: entities and enums
- dto: request and response contracts
- security: JWT and security filters/config
- config: Spring configuration and typed properties
- exception: domain and global exception mapping

## Project Structure

```text
KigenTask
├─ src/main/java/com/kigentask
│  ├─ config
│  ├─ controller
│  ├─ dto
│  ├─ exception
│  ├─ model
│  ├─ repository
│  ├─ security
│  └─ service
├─ src/main/resources
│  ├─ application.yml
│  └─ META-INF/additional-spring-configuration-metadata.json
├─ src/test/java/com/kigentask
├─ scripts/smoke-test.ps1
├─ KigenTaskDB.sql
├─ Dockerfile
└─ docker-compose.yml
```

## Database Design

Entity relationships:

- User 1:N Projects
- Project 1:N Tasks
- Task 1:N Comments

Additional design details:

- User roles via many-to-many table (`app_role`, `user_role`)
- PostgreSQL native enums for task status and priority
- Constraints and indexes included
- Trigger-based `updated_at` handling in SQL script

Database script:

- `KigenTaskDB.sql`

## Security Design

- Password hashing: BCrypt
- Auth model: Bearer JWT
- Session policy: stateless
- Public routes:
  - `POST /api/v1/auth/register`
  - `POST /api/v1/auth/login`
  - `GET /api/v1/health`
  - `GET /actuator/health`
- All remaining routes require valid JWT.

## API Endpoints

Base URL:

- `http://localhost:8080/api/v1`

### Health

- `GET /health`

### Auth

- `POST /auth/register`
- `POST /auth/login`

### Users

- `GET /users/me`

### Projects

- `POST /projects`
- `GET /projects`
- `GET /projects/{projectId}`

### Tasks

- `POST /tasks`
- `PUT /tasks/{taskId}`
- `DELETE /tasks/{taskId}`
- `GET /tasks?projectId=&status=&assigneeUserId=`

### Comments

- `POST /tasks/{taskId}/comments`
- `GET /tasks/{taskId}/comments`

## Configuration

Environment variables:

- `DB_URL` (default: `jdbc:postgresql://localhost:5432/kigentask`)
- `DB_USERNAME` (default: `postgres`)
- `DB_PASSWORD` (default: `postgres`)
- `SERVER_PORT` (default: `8080`)
- `JWT_SECRET` (default included for dev)
- `JWT_EXPIRATION_MS` (default: `86400000`)

Important note:

- For production, always replace `JWT_SECRET` with your own strong base64-encoded secret.

## Run Locally

Prerequisites:

- Java 17+
- Maven 3.9+
- PostgreSQL running locally

Steps:

1. Configure environment variables if needed.
2. (Optional) Execute SQL script manually:
	- `psql -U postgres -d kigentask -f KigenTaskDB.sql`
3. Start app:
	- `mvn spring-boot:run`

## Run with Docker

Build and run API + PostgreSQL:

1. `docker compose up --build -d`
2. API available at `http://localhost:8080`
3. Health check:
	- `GET http://localhost:8080/api/v1/health`

Stop stack:

- `docker compose down`

## Validation and Tests

### Unit/Context Tests

- `mvn test`

### End-to-End Smoke Test

PowerShell script that validates:

- register
- login
- profile
- create project
- create task
- add comment
- list tasks

Run:

- `./scripts/smoke-test.ps1`

Expected result:

- output starts with `SMOKE_OK`

## Error Handling

Global exception handling provides consistent JSON responses with:

- timestamp
- status
- error
- message
- path

Mapped statuses include:

- 400 bad request
- 401 unauthorized
- 403 forbidden
- 404 not found
- 409 conflict
- 500 internal server error

## Production Notes

Current implementation is production-friendly for architecture and core behavior.

Recommended next hardening steps:

- Add integration tests for all modules
- Add Flyway or Liquibase migrations and switch JPA from `ddl-auto: update` to `validate`
- Add OpenAPI/Swagger documentation
- Add CI pipeline for build/test/lint
- Add rate limiting and audit logging if required

## License

Use according to your repository and organization policy.