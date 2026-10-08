import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1791468000000 implements MigrationInterface {
  name = 'InitialSchema1791468000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE project_status_enum AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');
      CREATE TYPE task_status_enum AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');
      CREATE TYPE task_priority_enum AS ENUM ('LOW', 'MEDIUM', 'HIGH');

      CREATE TABLE users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        full_name varchar(150) NOT NULL,
        email varchar(254) NOT NULL CONSTRAINT uq_users_email UNIQUE,
        password_hash varchar(60) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT ck_users_name CHECK (length(trim(full_name)) > 0),
        CONSTRAINT ck_users_email CHECK (email = lower(trim(email)) AND length(email) > 0),
        CONSTRAINT ck_users_password_hash CHECK (password_hash ~ '^\\$2[aby]\\$[0-9]{2}\\$[./A-Za-z0-9]{53}$')
      );

      CREATE TABLE auth_sessions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at timestamptz NOT NULL,
        revoked_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT ck_auth_sessions_expiry CHECK (expires_at > created_at)
      );
      CREATE INDEX idx_auth_sessions_user_expiry ON auth_sessions(user_id, expires_at);

      CREATE TABLE projects (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name varchar(150) NOT NULL,
        description text,
        status project_status_enum NOT NULL DEFAULT 'NOT_STARTED',
        start_date date,
        end_date date,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT ck_projects_name CHECK (length(trim(name)) > 0),
        CONSTRAINT ck_projects_description CHECK (description IS NULL OR length(description) <= 10000),
        CONSTRAINT ck_projects_dates CHECK (start_date IS NULL OR end_date IS NULL OR end_date >= start_date)
      );
      CREATE INDEX idx_projects_owner_status ON projects(owner_id, status);
      CREATE INDEX idx_projects_owner_created ON projects(owner_id, created_at);

      CREATE TABLE tasks (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        name varchar(150) NOT NULL,
        description text,
        priority task_priority_enum NOT NULL DEFAULT 'MEDIUM',
        status task_status_enum NOT NULL DEFAULT 'PENDING',
        due_date date,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT ck_tasks_name CHECK (length(trim(name)) > 0),
        CONSTRAINT ck_tasks_description CHECK (description IS NULL OR length(description) <= 10000)
      );
      CREATE INDEX idx_tasks_project_status_priority ON tasks(project_id, status, priority);
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE tasks;
      DROP TABLE projects;
      DROP TABLE auth_sessions;
      DROP TABLE users;
      DROP TYPE task_priority_enum;
      DROP TYPE task_status_enum;
      DROP TYPE project_status_enum;
    `);
  }
}
