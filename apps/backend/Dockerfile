FROM node:24-slim AS base

RUN apt-get update \
  && apt-get install --no-install-recommends -y openssl \
  && rm -rf /var/lib/apt/lists/*

FROM base AS builder
WORKDIR /workspace
RUN corepack enable && corepack prepare pnpm@11.8.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json apps/backend/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/config/package.json packages/config/package.json
COPY apps/backend/prisma.config.ts apps/backend/prisma.config.ts
COPY apps/backend/src/config/env.ts apps/backend/src/config/env.ts
COPY apps/backend/src/database/orm/prisma/schema.prisma apps/backend/src/database/orm/prisma/schema.prisma

RUN --mount=type=cache,id=backend-pnpm,target=/pnpm/store \
  SQLSERVER_USER=sa SQLSERVER_PASSWORD=BuildOnly_Strong_Password_2026!X9 \
  pnpm --filter backend... install --frozen-lockfile --store-dir=/pnpm/store

COPY apps/backend/src apps/backend/src
COPY apps/backend/nest-cli.json apps/backend/tsconfig.json apps/backend/tsconfig.build.json apps/backend/
COPY packages/shared packages/shared
COPY packages/config packages/config
RUN pnpm --filter @ciee-curriculos/shared build && pnpm --filter backend build

RUN --mount=type=cache,id=backend-pnpm,target=/pnpm/store \
  pnpm --filter backend deploy --legacy --prod --ignore-scripts --store-dir=/pnpm/store /production
# Install the SQL Server migration engine during build, avoiding runtime downloads.
RUN node -e "require(require('node:module').createRequire(require('node:fs').realpathSync('/production/node_modules/prisma/package.json')).resolve('@prisma/engines/scripts/postinstall.js'))"

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder --chown=node:node /production ./
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
