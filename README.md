# CSC 336 Project

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Prerequisites

To develop this application, you will need the following tools installed on your local system:

- **Node.js** (v20+)
- **pnpm** (preferred package manager)
- **Podman** or **Docker** (for containerized PostgreSQL database)

## Setup

1. **Install Dependencies**:
   Install the project dependencies using `pnpm`:

   ```sh
   pnpm install
   ```

2. **Configure Environment Variables**:
   Copy the example environment file to create your own configuration:

   ```sh
   cp .env.example .env
   ```

   By default, the `.env` file is configured to connect to a local PostgreSQL instance at `localhost:5432` with username `root` and password `mysecretpassword`.

3. **Start the Database**:
   Use Docker or Podman to spin up the local PostgreSQL database:

   ```sh
   podman compose up -d
   # or with podman
   docker compose up -d
   ```

## Database Migrations

This project uses a custom SQL migration runner located at `migrations/migrate.mjs`. The runner interacts with the database specified by the `DATABASE_URL` environment variable.

The following commands are defined in `package.json` to manage database schema updates:

- **Create a New Migration**:
  Generates a new, timestamped `.sql` migration file inside the `migrations/` directory.

  ```sh
  pnpm migrate:create <migration-name>
  ```

- **Apply Pending Migrations**:
  Applies any migrations that have not yet been recorded in the database's `_migrations` table.

  ```sh
  pnpm migrate:up
  ```

- **Reset Database Schema**:
  Resets the database by dropping the `public` schema, recreating it, and running all migration scripts from scratch. **Warning: This will destroy all local data.**

  ```sh
  pnpm migrate:reset
  ```

## Developing

Once the database is running and migrations are applied, start the development server:

```sh
pnpm dev
```

## Building

To create a production version of your app:

```sh
pnpm build
```

You can preview the production build with `pnpm preview`.
