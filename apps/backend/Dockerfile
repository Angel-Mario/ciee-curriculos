FROM node:22-alpine

WORKDIR /app

RUN corepack enable

COPY . .
RUN POSTGRES_URL=postgresql://postgres:postgres@postgres:5432/build_db MYSQL_URL=mysql://root:mysql@mysql:3306/build_db MONGODB_URL=mongodb://mongodb:27017/build_db SQLSERVER_HOST=localhost SQLSERVER_PORT=1433 SQLSERVER_DATABASE=build_db SQLSERVER_USER=sa SQLSERVER_PASSWORD=Build_only_Password_2026!X9 SQLSERVER_ENCRYPT=true SQLSERVER_TRUST_SERVER_CERTIFICATE=true pnpm install --no-lockfile
RUN pnpm run build

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "dist/main"]
