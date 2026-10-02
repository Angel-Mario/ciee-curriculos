FROM node:22-alpine

WORKDIR /app

RUN corepack enable

COPY . .
RUN --mount=type=secret,id=backend_env,target=/run/secrets/backend_env,required=true DOTENV_CONFIG_PATH=/run/secrets/backend_env pnpm install --no-lockfile
RUN pnpm run build

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "dist/main"]
