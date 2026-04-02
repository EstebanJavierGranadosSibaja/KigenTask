You are a senior backend engineer specialized in Java and Spring Boot.

Help me build a **production-ready backend API** following best practices in architecture, security, and clean code.

## PROJECT GOAL

Build a Task Management API (similar to a simplified Jira) with:

* Users
* Projects
* Tasks
* Comments
* Authentication (JWT)

## TECH STACK

* Java 17+
* Spring Boot
* Spring Security
* JWT
* PostgreSQL
* JPA / Hibernate
* Maven
* Docker

---

## ARCHITECTURE REQUIREMENTS

Use a clean layered architecture:

* controller
* service
* repository
* model (entities)
* dto
* security
* config

Follow SOLID principles and separation of concerns.

---

## FEATURES

### Authentication

* Register user
* Login user
* JWT token generation
* JWT validation filter
* Secure endpoints

### Users

* Get current user profile

### Projects

* Create project
* Get all projects
* Get project by ID

### Tasks

* Create task
* Update task
* Delete task
* Get tasks (with filtering if possible)

### Comments

* Add comment to task
* Get comments by task

---

## DATABASE DESIGN

Entities and relationships:

* User (1:N Projects)
* Project (1:N Tasks)
* Task (1:N Comments)

Use proper JPA annotations and relationships.

---

## SECURITY

* Use Spring Security
* Password hashing (BCrypt)
* JWT-based authentication
* Stateless session

---

## BEST PRACTICES

* Use DTOs (do NOT expose entities directly)
* Global exception handling
* Input validation (@Valid)
* Proper HTTP status codes
* Clean and readable code

---

## DOCKER

Create:

* Dockerfile for the backend
* docker-compose.yml with PostgreSQL

---

## STEP-BY-STEP DEVELOPMENT

Guide me step by step. Do NOT generate everything at once.

Start with:

1. Project initialization (Spring Boot)
2. Dependencies (Spring Web, Security, JPA, PostgreSQL, Lombok)
3. Basic structure

Then continue step by step.

---

## IMPORTANT

* Explain briefly what each part does
* Write production-quality code
* Avoid overengineering, but follow real-world standards
* Code must be ready to run

---

Start with project setup and structure.
