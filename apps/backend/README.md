# Backend

API REST desenvolvida com NestJS. O Prisma acessa o SQL Server por meio de `@prisma/adapter-mssql`; a documentação OpenAPI é servida pelo Scalar.

## Requisitos e configuração

Instale as dependências na raiz do monorepo:

```bash
pnpm install
```

Crie `apps/backend/.env` a partir do modelo:

```bash
cp apps/backend/.env.example apps/backend/.env
```

No PowerShell:

```powershell
Copy-Item apps/backend/.env.example apps/backend/.env
```

Configure pelo menos `SQLSERVER_USER` e `SQLSERVER_PASSWORD`. O arquivo de exemplo inclui uma senha apenas para desenvolvimento: substitua-a por um segredo único e seguro. O nome padrão do banco de dados é `backend_db`.

Variáveis disponíveis:

| Variável | Uso |
| --- | --- |
| `PORT` | Porta HTTP do backend (padrão: `3000`). |
| `NODE_ENV` | Ambiente de execução: `development`, `production` ou `test`. |
| `CORS_ORIGIN` | Origem permitida pelo CORS (o modelo usa `http://localhost:3001`). |
| `TRUSTED_PROXY_IPS` | Endereços IP/CIDRs de proxies confiáveis, separados por vírgula; vazio por padrão. |
| `SQLSERVER_HOST` | Host do SQL Server (padrão: `localhost`). |
| `SQLSERVER_PORT` | Porta do SQL Server (padrão: `1433`). |
| `SQLSERVER_DATABASE` | Banco de dados (padrão: `backend_db`). |
| `SQLSERVER_USER` | Usuário do banco de dados; obrigatório. |
| `SQLSERVER_PASSWORD` | Senha; obrigatória. |
| `SQLSERVER_ENCRYPT` | Ativa a criptografia da conexão; ativada por padrão. |
| `SQLSERVER_TRUST_SERVER_CERTIFICATE` | Aceita certificados autoassinados; em produção, desative essa opção ao usar certificados válidos. |

## SQL Server e Prisma

Para iniciar a instância local do SQL Server definida no Compose da raiz:

```bash
pnpm db:start
```

A verificação de saúde do Compose cria `backend_db` caso ainda não exista. Para usar uma instância externa, confirme que o banco já foi criado e configure o host, a porta e as credenciais em `apps/backend/.env`.

Comandos do Prisma executados na raiz:

```bash
pnpm prisma:generate
pnpm prisma:format
pnpm prisma:push
pnpm prisma:studio
pnpm prisma:migrate
pnpm prisma:migrate:deploy
```

Também é possível executá-los neste diretório usando os nomes de scripts do pacote (por exemplo, `pnpm prisma:generate`). `prisma:push` sincroniza o esquema sem criar migrações; `prisma:migrate` executa `prisma migrate dev` para desenvolvimento; `prisma:migrate:deploy` aplica migrações já criadas.

O esquema está em `src/database/orm/prisma/schema.prisma` e atualmente define o modelo `Todo`.

## Desenvolvimento e compilação

A partir da raiz:

```bash
pnpm dev:backend
pnpm --filter backend build
pnpm --filter backend start
```

Ou, a partir deste diretório:

```bash
pnpm dev
pnpm build
pnpm start
pnpm start:prod
```

Por padrão, o backend atende em `http://localhost:3000`. As rotas da API usam o prefixo `/api`; a documentação do Scalar está disponível em `/docs`.

## API atual

- `GET /api`: retorna uma mensagem de boas-vindas.
- `GET /api/todos`: lista os itens.
- `POST /api/todos`: cria um item com `title` obrigatório e `description` opcional; `completed` é opcional e seu valor padrão é `false`.
- `PUT /api/todos/:id`: atualiza `title`, `description` e/ou `completed`.
- `DELETE /api/todos/:id`: exclui um item.

Os DTOs são validados com Zod por meio do pipe global do NestJS. Consulte <http://localhost:3000/docs> para ver o esquema OpenAPI gerado.

## Testes

```bash
pnpm --filter backend test
pnpm --filter backend test:e2e
pnpm --filter backend test:cov
```

Os testes unitários usam Vitest; os testes end-to-end usam `vitest.config.e2e.ts`.
