-- =============================================================
-- KigenTask - PostgreSQL Database Schema
-- Target: Task Management API (Spring Boot + JWT)
-- =============================================================

BEGIN;

-- Case-insensitive text for username/email uniqueness.
CREATE EXTENSION IF NOT EXISTS citext;

-- =============================================================
-- ENUMS
-- =============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
        CREATE TYPE task_status AS ENUM (
            'TODO',
            'IN_PROGRESS',
            'IN_REVIEW',
            'DONE',
            'CANCELLED'
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_priority') THEN
        CREATE TYPE task_priority AS ENUM (
            'LOW',
            'MEDIUM',
            'HIGH',
            'CRITICAL'
        );
    END IF;
END $$;

-- =============================================================
-- TABLES
-- =============================================================

CREATE TABLE IF NOT EXISTS app_user (
    id BIGSERIAL PRIMARY KEY,
    username CITEXT NOT NULL UNIQUE,
    email CITEXT NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT ck_app_user_username_not_blank CHECK (btrim(username::text) <> ''),
    CONSTRAINT ck_app_user_email_not_blank CHECK (btrim(email::text) <> ''),
    CONSTRAINT ck_app_user_password_hash_not_blank CHECK (btrim(password_hash) <> '')
);

CREATE TABLE IF NOT EXISTS app_role (
    id SMALLSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT ck_app_role_name_not_blank CHECK (btrim(name) <> '')
);

CREATE TABLE IF NOT EXISTS user_role (
    user_id BIGINT NOT NULL,
    role_id SMALLINT NOT NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_user_role_user FOREIGN KEY (user_id)
        REFERENCES app_user (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_user_role_role FOREIGN KEY (role_id)
        REFERENCES app_role (id)
        ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS project (
    id BIGSERIAL PRIMARY KEY,
    owner_user_id BIGINT NOT NULL,
    name VARCHAR(120) NOT NULL,
    project_key VARCHAR(20) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_project_owner FOREIGN KEY (owner_user_id)
        REFERENCES app_user (id)
        ON DELETE RESTRICT,
    CONSTRAINT uq_project_key UNIQUE (project_key),
    CONSTRAINT uq_project_owner_name UNIQUE (owner_user_id, name),
    CONSTRAINT ck_project_name_not_blank CHECK (btrim(name) <> ''),
    CONSTRAINT ck_project_key_pattern CHECK (project_key ~ '^[A-Z][A-Z0-9_]{1,19}$')
);

CREATE TABLE IF NOT EXISTS task (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL,
    reporter_user_id BIGINT NOT NULL,
    assignee_user_id BIGINT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status task_status NOT NULL DEFAULT 'TODO',
    priority task_priority NOT NULL DEFAULT 'MEDIUM',
    due_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_task_project FOREIGN KEY (project_id)
        REFERENCES project (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_task_reporter FOREIGN KEY (reporter_user_id)
        REFERENCES app_user (id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_task_assignee FOREIGN KEY (assignee_user_id)
        REFERENCES app_user (id)
        ON DELETE SET NULL,
    CONSTRAINT ck_task_title_not_blank CHECK (btrim(title) <> '')
);

CREATE TABLE IF NOT EXISTS task_comment (
    id BIGSERIAL PRIMARY KEY,
    task_id BIGINT NOT NULL,
    author_user_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_task_comment_task FOREIGN KEY (task_id)
        REFERENCES task (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_task_comment_author FOREIGN KEY (author_user_id)
        REFERENCES app_user (id)
        ON DELETE RESTRICT,
    CONSTRAINT ck_task_comment_content_not_blank CHECK (btrim(content) <> '')
);

-- =============================================================
-- INDEXES
-- =============================================================

CREATE INDEX IF NOT EXISTS idx_user_role_role_id
    ON user_role (role_id);

CREATE INDEX IF NOT EXISTS idx_project_owner_user_id
    ON project (owner_user_id);

CREATE INDEX IF NOT EXISTS idx_task_project_id
    ON task (project_id);

CREATE INDEX IF NOT EXISTS idx_task_status
    ON task (status);

CREATE INDEX IF NOT EXISTS idx_task_assignee_user_id
    ON task (assignee_user_id);

CREATE INDEX IF NOT EXISTS idx_task_due_date
    ON task (due_date);

CREATE INDEX IF NOT EXISTS idx_task_comment_task_id
    ON task_comment (task_id);

CREATE INDEX IF NOT EXISTS idx_task_comment_created_at
    ON task_comment (created_at DESC);

-- =============================================================
-- AUDIT TRIGGERS (auto-update updated_at)
-- =============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_app_user_updated_at ON app_user;
CREATE TRIGGER trg_app_user_updated_at
BEFORE UPDATE ON app_user
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_app_role_updated_at ON app_role;
CREATE TRIGGER trg_app_role_updated_at
BEFORE UPDATE ON app_role
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_project_updated_at ON project;
CREATE TRIGGER trg_project_updated_at
BEFORE UPDATE ON project
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_task_updated_at ON task;
CREATE TRIGGER trg_task_updated_at
BEFORE UPDATE ON task
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_task_comment_updated_at ON task_comment;
CREATE TRIGGER trg_task_comment_updated_at
BEFORE UPDATE ON task_comment
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- =============================================================
-- SEED DATA
-- =============================================================

INSERT INTO app_role (name)
VALUES ('ROLE_USER'), ('ROLE_ADMIN')
ON CONFLICT (name) DO NOTHING;

COMMIT;