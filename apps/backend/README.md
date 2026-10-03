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
| `S3_ACCESS_KEY` / `S3_SECRET_KEY` | Credenciais do RustFS local; configure segredos próprios fora do desenvolvimento. |
| `S3_ENDPOINT` | Endpoint S3 usado pelo backend (`http://localhost:9000` local; `http://rustfs:9000` no Compose). |
| `S3_ENDPOINT_PUBLIC` | Origem acessível pelo navegador para abrir currículos (`http://localhost:9000` por padrão). |
| `S3_REGION`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET` | Região, credenciais S3 e bucket (`curricula`). |

O Compose inicia RustFS e configura leitura pública anônima no bucket `curricula` para permitir links diretos aos PDFs. Currículos contêm dados pessoais: mantenha as portas locais vinculadas a `127.0.0.1` e revise a política de acesso antes de expor RustFS ou o bucket em uma rede pública.

## RustFS: console e inicialização do bucket

Para iniciar somente o armazenamento, execute na raiz do monorepo:

```bash
docker compose --env-file apps/backend/.env up -d rustfs rustfs_init
```

Acesse a interface de administração em <http://localhost:9001>. Entre com `S3_ACCESS_KEY` como usuário e `S3_SECRET_KEY` como senha, definidos em `apps/backend/.env`. Se essas variáveis não estiverem configuradas, os valores de desenvolvimento do Compose são `rustfs_user` e `rustfs_password_secure`. Na seção de buckets, abra `curricula` (ou o nome configurado em `S3_BUCKET`) para visualizar os PDFs. A porta `9000` atende a API S3; a porta `9001` atende o console.

O serviço `rustfs_init` usa a imagem `amazon/aws-cli:2.27.49` apenas para criar o bucket e aplicar a política de leitura pública via API S3 do RustFS local; ele não acessa serviços da AWS. Depois de concluir, o contêiner termina com código `0`, portanto aparecer como parado é esperado. O backend aguarda essa inicialização antes de iniciar.

A AWS CLI não é necessária para o funcionamento do RustFS em si. Ela automatiza a preparação do bucket neste Compose. É possível fazer essa configuração manualmente, mas, nesse caso, também seria necessário ajustar a dependência do backend em `rustfs_init`.

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

O esquema está em `src/database/orm/prisma/schema.prisma` e define `Candidate` e o modelo inicial `Todo`. A migration inicial é aditiva: em uma base nova ela cria ambas as tabelas; em uma base já criada pelo esquema Todo, preserva os dados e acrescenta `candidates`. Confira `prisma migrate status` antes de executar migrations em uma base existente.

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
- `POST /api/candidates`: cria um candidato com `fullName` e `email` obrigatórios; aceita `phone`, `interestArea` e `professionalSummary` opcionais, em JSON ou multipart com PDF opcional no campo `file`.
- `GET /api/candidates`: lista candidatos e aceita `q` (ocorrências em nome **ou** e-mail), `sortBy` (`id`, `fullName`, `email`, `phone` ou `interestArea`) e `sortOrder` (`asc` ou `desc`). Sem parâmetros, ordena por ID decrescente.
- `GET /api/candidates/:id`: consulta os dados do candidato ou retorna 404.
- `GET /api/candidates/:id/curriculum/download`: retorna `{ "url": "..." }` quando o usuário solicita a descarga; retorna 404 se o candidato ou o currículo não existir.
- `DELETE /api/candidates/:id`: exclui um candidato ou retorna 404.
- `DELETE /api/candidates` com `{ "ids": [1, 2] }`: exclui até 100 candidatos; IDs repetidos são deduplicados e IDs inexistentes são ignorados. A resposta informa `deletedCount`.
- `POST /api/candidates/import-pdf`: recebe um arquivo `file` em `multipart/form-data` e sugere nome, e-mail e telefone para revisão; não salva o candidato.

Quando um PDF é enviado junto com a criação, o backend envia o objeto ao RustFS antes de gravar os dados no SQL Server. Se a gravação SQL falhar depois do upload, o objeto pode ficar órfão no bucket; faça limpeza operacional desses objetos se isso ocorrer. As respostas de criação e detalhe incluem apenas os metadados em `curriculum` ou `null`, e a listagem inclui `hasCurriculum`. A URL pública é construída e enviada somente ao solicitar `GET /api/candidates/:id/curriculum/download`.

Os DTOs são validados com Zod por meio do pipe global do NestJS. Consulte <http://localhost:3000/docs> para ver o esquema OpenAPI gerado.

O e-mail é normalizado para letras minúsculas e precisa ser único por candidato. Tentativas de cadastro com e-mail já utilizado retornam `409` com código `EMAIL_ALREADY_IN_USE`; a restrição de unicidade também é aplicada no SQL Server. A migration recusa emails duplicados já existentes sem remover registros.

O telefone é normalizado tanto na importação do PDF quanto no cadastro: `+55 (41) 99742-9889` vira `+5541997429889`. Números sem código internacional conservam apenas os dígitos, sem presumir um país. O cadastro aceita de 10 a 15 dígitos e a máscara visual deve ser aplicada pelo frontend.

## Testes

Os testes e2e da API de candidatos precisam de um banco SQL Server dedicado cujo nome termine em `_test`. A suíte verifica essa condição antes de iniciar e2e; não use `backend_db`. Crie o banco vazio `backend_db_test` na mesma instância SQL Server configurada no `.env` antes de aplicar as migrations.

Inicie SQL Server e RustFS, incluindo a configuração do bucket, na raiz do monorepo:

```bash
docker compose --env-file apps/backend/.env up -d --wait sqlserver rustfs rustfs_init
```

Depois execute, no PowerShell ou Bash:

```bash
pnpm --filter backend test:e2e
```

Dentro de `apps/backend`, basta executar `pnpm test:e2e`. O script carrega o `.env`, seleciona `backend_db_test`, aplica migrations, compila o backend e executa os e2e. Não é necessário definir ou remover variáveis manualmente. Para usar outro banco dedicado, configure `SQLSERVER_TEST_DATABASE` no `.env`; o nome precisa terminar em `_test`. O banco dedicado deve existir antes da primeira execução. SQL Server e RustFS devem estar disponíveis, pois os testes fazem persistência e upload reais.

Os e2e criam candidatos com dados únicos e removem somente os IDs criados pela própria suíte. A base `backend_db_test` permanece disponível entre execuções; os testes não a reinicializam nem apagam seu conteúdo.

```bash
pnpm --filter backend test
pnpm --filter backend test:e2e
pnpm --filter backend test:cov
```

Os testes unitários usam Vitest; os testes end-to-end usam `vitest.config.e2e.ts`.
