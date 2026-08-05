\set ON_ERROR_STOP on

-- Run with psql variables supplied by secret management before the RLS migration:
-- psql ... -v runtime_role=san_app -v runtime_password="$DB_RUNTIME_PASSWORD" -f database/rls/provision-runtime-role.sql
SELECT format(
    'CREATE ROLE %I LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS PASSWORD %L',
    :'runtime_role',
    :'runtime_password'
)
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'runtime_role')
\gexec

ALTER ROLE :"runtime_role" NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS PASSWORD :'runtime_password';
