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
- `GET /api/candidates`: retorna `{ items, page, pageSize, pageCount, total }`; aceita `q` (nome **ou** e-mail), `sortBy` (`id`, `fullName`, `email`, `phone` ou `interestArea`), `sortOrder` (`asc` ou `desc`), `interestArea` e `hasCurriculum` (`all`, `yes`, `no`). `page` começa em 1 e `pageSize` aceita 1–100 (padrão 10). Sem parâmetros, ordena por ID decrescente.
- `GET /api/candidates/:id`: consulta os dados do candidato ou retorna 404.
- `GET /api/candidates/:id/curriculum/download`: retorna `{ "url": "..." }` quando o usuário solicita a descarga; retorna 404 se o candidato ou o currículo não existir.
- `DELETE /api/candidates/:id`: exclui um candidato ou retorna 404.
- `DELETE /api/candidates` com `{ "ids": [1, 2] }`: exclui até 100 candidatos; IDs repetidos são deduplicados e IDs inexistentes são ignorados. A resposta informa `deletedCount`.
- `POST /api/candidates/import-pdf`: recebe um arquivo `file` em `multipart/form-data` e sugere nome, e-mail e telefone para revisão; não salva o candidato.

Quando um PDF é enviado junto com a criação, o backend envia o objeto ao RustFS antes de gravar os dados no SQL Server. Se a gravação SQL falhar, tenta remover o objeto enviado e preserva o erro original. Se essa limpeza também falhar, registra um aviso e o objeto pode ficar órfão; faça reconciliação operacional desses objetos. As respostas de criação e detalhe incluem apenas os metadados em `curriculum` ou `null`, e a listagem inclui `hasCurriculum`. A URL pública é construída e enviada somente ao solicitar `GET /api/candidates/:id/curriculum/download`.

Os contratos Zod em `packages/shared` validam o formulário, o cliente HTTP e o backend. O pipe global valida os DTOs; o controller de candidatos também valida explicitamente JSON, multipart e parâmetros de listagem. Campos desconhecidos são rejeitados. Consulte <http://localhost:3000/docs> para a referência interativa e <http://localhost:3000/openapi.json> para o contrato JSON, incluindo respostas de candidatos, paginação, importação e exclusão.

O e-mail é normalizado para letras minúsculas e precisa ser único por candidato. Tentativas de cadastro com e-mail já utilizado retornam `409` com código `EMAIL_ALREADY_IN_USE`; a restrição de unicidade também é aplicada no SQL Server. A migration recusa emails duplicados já existentes sem remover registros.

O telefone aceita apenas números brasileiros com DDD válido: fixo com 10 dígitos (assinante iniciado em 2–5) ou celular com 11 dígitos (assinante iniciado em 9). Tanto na importação quanto no cadastro, `+55 (41) 99742-9889` vira `41997429889`. O frontend mostra +55 como prefixo fixo e envia os dígitos nacionais. Outros países, DDDs inexistentes e comprimentos inválidos são rejeitados; telefone vazio é armazenado como `null`.

Erros de validação retornam 400; arquivo acima de 5 MB retorna 413; conteúdo sem assinatura PDF retorna 415; falha na leitura retorna 422 (`PDF_READ_FAILED`). E-mail duplicado retorna 409, registro ausente retorna 404 e falha de armazenamento retorna 503 (`STORAGE_UNAVAILABLE`). Erros inesperados recebem a resposta 500 padrão do NestJS, sem expor detalhes internos ao cliente. A importação não persiste dados e permite continuar o cadastro manual.

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
pnpm --filter backend test:e2e --coverage
```

Os testes unitários usam Vitest; os testes end-to-end usam `vitest.config.e2e.ts`. Os relatórios incluem todos os arquivos TypeScript de `src`, exceto testes e Prisma Client gerado. Cobertura unitária e e2e são medidas separadamente em `coverage` e `coverage-e2e`. O teste de bootstrap executa `main.ts` compilado em outro processo e verifica seu funcionamento, mas esse processo não é instrumentado pelo relatório V8 do Vitest.
