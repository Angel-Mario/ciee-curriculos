FROM node:24-slim AS builder
RUN corepack enable && corepack prepare pnpm@11.8.0 --activate
WORKDIR /app

COPY . .
ARG VITE_SERVER_URL=http://localhost:3000
ENV VITE_SERVER_URL=${VITE_SERVER_URL}
ENV NODE_ENV=production
RUN --mount=type=cache,target=/pnpm/store SQLSERVER_USER=sa SQLSERVER_PASSWORD=BuildOnly_Strong_Password_2026!X9 pnpm install --frozen-lockfile --store-dir=/pnpm/store
RUN pnpm --filter @ciee-curriculos/shared build && pnpm --filter web build

FROM nginx:alpine AS runner
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
