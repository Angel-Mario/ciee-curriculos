# CIEE Currículos

Monorepo da aplicação web e da API. O frontend usa React, Vite e TanStack Router; a API usa NestJS e Prisma com SQL Server.

## Requisitos

- Node.js 22 ou superior
- pnpm 11
- Docker Desktop, caso queira usar o SQL Server pelo Docker Compose

## Início rápido

Instale as dependências na raiz do repositório:

```bash
pnpm install
```

Crie o arquivo de ambiente do backend a partir do modelo e configure uma senha para o SQL Server:

```bash
cp apps/backend/.env.example apps/backend/.env
```

No PowerShell:

```powershell
Copy-Item apps/backend/.env.example apps/backend/.env
```

O modelo contém uma senha destinada apenas ao desenvolvimento. Substitua-a por uma senha segura antes de compartilhar o ambiente ou fazer uma implantação. Para o desenvolvimento local, inicie o SQL Server e gere o cliente Prisma:

```bash
pnpm db:start
pnpm prisma:generate
```

`pnpm db:start` inicia o serviço `sqlserver` definido no Docker Compose; a verificação de saúde cria `backend_db` se o banco ainda não existir. Se você usar outra instância do SQL Server, configure a conexão em `apps/backend/.env` e confirme que o banco de dados já existe.

Inicie o frontend e o backend:

```bash
pnpm dev
```

- Web: <http://localhost:3001>
- API: <http://localhost:3000/api>
- Documentação interativa da API: <http://localhost:3000/docs>

O backend oferece uma rota de exemplo e operações CRUD de `Todo` em `/api/todos`.

## Variáveis de ambiente

O backend carrega `apps/backend/.env`. O modelo `apps/backend/.env.example` documenta as seguintes variáveis:

- `PORT`: porta HTTP da API (padrão: `3000`).
- `CORS_ORIGIN`: origem permitida pelo CORS.
- `TRUSTED_PROXY_IPS`: lista de IPs/CIDRs de proxies confiáveis, separada por vírgulas; vazia por padrão.
- `SQLSERVER_HOST`, `SQLSERVER_PORT`, `SQLSERVER_DATABASE`, `SQLSERVER_USER`, `SQLSERVER_PASSWORD`: conexão com o SQL Server.
- `SQLSERVER_ENCRYPT` e `SQLSERVER_TRUST_SERVER_CERTIFICATE`: opções TLS da conexão.

O frontend exige `VITE_SERVER_URL`, por exemplo `http://localhost:3000`. O Vite valida essa variável ao iniciar e ao compilar. Para desenvolvimento local, você pode defini-la em `apps/web/.env.local`.

## Banco de dados e Prisma

Os comandos executados na raiz iniciam as tarefas do Prisma em `apps/backend`:

```bash
pnpm prisma:generate
pnpm prisma:format
pnpm prisma:push
pnpm prisma:migrate
pnpm prisma:migrate:deploy
pnpm prisma:studio
```

`prisma:migrate` executa `prisma migrate dev` e destina-se ao desenvolvimento; `prisma:migrate:deploy` aplica migrações existentes em implantações. Consulte [apps/backend/README.md](apps/backend/README.md) para obter detalhes da configuração do SQL Server.

## Docker Compose

O Compose precisa do arquivo de ambiente do backend para interpolar `SQLSERVER_PASSWORD`; `env_file` e os secrets dos serviços não são usados nessa etapa. Os scripts da raiz já passam esse arquivo:

```bash
pnpm docker:build
pnpm docker:up
pnpm docker:logs
pnpm docker:down
```

Também é possível executar o Compose diretamente:

```bash
docker compose --env-file apps/backend/.env up --build
```

Durante a compilação, o backend monta `apps/backend/.env` como um segredo temporário do BuildKit para gerar o Prisma Client; o arquivo e seus valores não são copiados para a imagem. Em execução, o Compose configura as variáveis necessárias para o backend.

A stack publica a aplicação web na porta `3001`, a API em `127.0.0.1:3000` e o SQL Server em `127.0.0.1:1433`. `APP_PORT` altera a porta da API publicada no host e `SQLSERVER_PORT` altera a porta do SQL Server no host; dentro da rede do Compose, a API sempre se conecta a `sqlserver:1433`.

O Dockerfile da aplicação web monta `apps/web/.env` como um secret do BuildKit. Portanto, esse arquivo precisa existir para compilar com o Compose e definir `VITE_SERVER_URL`. O valor de `VITE_SERVER_URL` é incorporado ao bundle durante a compilação; use uma URL acessível pelo navegador, não o nome interno `backend`.

## Principais scripts

| Comando | Descrição |
| --- | --- |
| `pnpm dev` | Inicia as aplicações em modo de desenvolvimento. |
| `pnpm dev:web` | Inicia apenas a aplicação web. |
| `pnpm dev:backend` | Inicia apenas o backend. |
| `pnpm build` | Compila as aplicações. |
| `pnpm check-types` | Executa as verificações de tipos definidas no workspace. |
| `pnpm check` | Verifica formatação e lint com Ultracite. |
| `pnpm fix` | Aplica correções de formatação e lint. |
| `pnpm db:start` | Inicia o SQL Server pelo Compose. |

## Estrutura

```text
apps/
  backend/   API NestJS, Prisma, configuração e testes
  web/       Aplicação React, Vite e TanStack Router
packages/
  config/    Pacote de configuração do workspace
  ui/        Componentes React compartilhados e estilos
```

## Qualidade e testes

```bash
pnpm check
pnpm check-types
pnpm --filter backend test
pnpm --filter backend test:e2e
```

Os comandos de teste são executados no pacote do backend; não há um script `test` na raiz. Consulte [apps/backend/README.md](apps/backend/README.md) para mais detalhes.
