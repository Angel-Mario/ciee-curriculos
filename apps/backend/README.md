# backend

backend NestJS application

## Setup

```bash
# Install dependencies
pnpm install
```

## Running the App

```bash
# development mode (live reload)
pnpm dev

# build and production mode
pnpm build
pnpm start
```

## Testing

```bash
# unit tests
pnpm test

# e2e tests
pnpm test:e2e

# test coverage
pnpm test:cov
```

## Database Setup

This project uses **Prisma** as the ORM. Available commands:

```bash
pnpm prisma:generate
pnpm prisma:push
pnpm prisma:studio
pnpm prisma:migrate
pnpm prisma:migrate:deploy
```

Set `SQLSERVER_HOST`, `SQLSERVER_PORT`, `SQLSERVER_DATABASE`, `SQLSERVER_USER`, and `SQLSERVER_PASSWORD` in `.env` before running Prisma commands. The SQL Server database must already exist. The generated password is a development-only example that satisfies SQL Server's password policy; replace it with a unique secret before sharing the project or deploying it. For local development, set `SQLSERVER_TRUST_SERVER_CERTIFICATE=true` when using a self-signed certificate; keep certificate validation enabled for production.

## Docker Compose

Start the application and its database with `docker compose up --build`. Compose publishes the API on `127.0.0.1:3000` by default (Fastify uses `3001`). If that host port is already in use or reserved, set `APP_PORT` to a free host port before starting; the container's internal port stays unchanged. In PowerShell, for example: `$env:APP_PORT = "3100"; docker compose up --build`. Compose also publishes SQL Server on `127.0.0.1:1433` so Prisma commands run on the host can connect. The API container uses the internal `sqlserver:1433` address. If host port 1433 is occupied, change `SQLSERVER_PORT` in `.env`; keep the API container's internal database port at 1433.
