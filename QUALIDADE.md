# Qualidade e verificação

## Critérios do desafio

A verificação foi organizada em torno do funcionamento dos dois cadastros, da integração entre frontend, backend e SQL Server e das validações e mensagens apresentadas ao usuário.

| Critério | Implementação e verificação |
| --- | --- |
| Cadastro manual sem PDF | Formulário compartilhado e testes da criação pela API com persistência real. |
| Cadastro assistido por PDF | Extração no backend, sugestões revisáveis e importação sem persistência automática. |
| Continuidade do cadastro manual | Tratamento de falhas de leitura e campos ausentes sem exigir o arquivo para salvar. |
| Validação dos dados | Contratos Zod compartilhados, testes de campos obrigatórios, e-mail, telefone e área ou cargo restrito à lista predefinida. |
| Validação do arquivo | Limite de 5.000.000 bytes, verificação de assinatura PDF e respostas para arquivos inválidos. |
| Listagem e detalhes | Consultas pela API, com filtros, ordenação e paginação, exercitadas nos testes. |
| SQL Server e migrations | Testes de integração em banco dedicado e migrations versionadas. |
| Facilidade de avaliação | Docker Compose, exemplos de ambiente, comandos no README e currículo fictício. |

## Cuidados incorporados à implementação

- Validação no navegador e na API, utilizando os mesmos contratos de dados.
- E-mail normalizado e restrição única no SQL Server, com resposta clara para duplicidade.
- Mensagens para erros de validação, leitura de PDF, registros ausentes e indisponibilidade do armazenamento.
- Cancelamento da importação anterior e descarte de respostas tardias ao trocar o arquivo.
- Confirmação antes de excluir um candidato ou abandonar alterações do formulário.
- Tentativa de limpeza do upload quando a persistência SQL falha.
- Atualização do cache após cadastro e exclusão.
- Documentação OpenAPI das operações e respostas.

## Testes e relatórios

Os testes unitários exercitam regras e serviços. No frontend, os testes cobrem chamadas da API, cache e hooks de cadastro e importação. Os testes e2e da API utilizam SQL Server e RustFS reais, incluindo a importação do currículo fictício fornecido no repositório.

### Revisão final em 03/10/2026

- Lint e formatação: `pnpm check` aprovado.
- Compilação, tipos e testes do workspace: `pnpm exec turbo run build check-types test --force` aprovado, sem reutilizar resultados do cache.
- Testes unitários: 162 do backend e 56 do frontend aprovados.
- Integração: `pnpm --filter backend test:e2e` aprovado, com 28 testes e SQL Server e RustFS reais.
- Docker: imagens compiladas e stack iniciada com `docker compose --env-file apps/backend/.env up -d --wait`; frontend, backend, SQL Server e RustFS saudáveis, com inicialização do bucket concluída.

A conferência desta revisão no navegador alcançou a listagem e o formulário. A conexão da ferramenta de navegador foi interrompida antes de concluir novas interações; os fluxos de cadastro e importação foram verificados pelos testes existentes.

### Cobertura de linhas registrada em 03/10/2026

| Suíte | Cobertura | Relatório local |
| --- | --: | --- |
| Backend — unitários | 52,39% | `apps/backend/coverage/index.html` |
| Backend — integração/e2e | 78,96% | `apps/backend/coverage-e2e/index.html` |
| Frontend | 38,35% | `apps/web/coverage/index.html` |

Os valores foram consultados nos arquivos `coverage-summary.json` existentes. Cada suíte tem seu próprio relatório; os percentuais não são somados. A medição inclui fontes não exercitados pelos testes, excluindo testes e código gerado conforme a configuração. A execução compilada do backend também possui verificação em subprocesso, fora da instrumentação desses relatórios.

### Reproduzir as verificações

Na raiz do repositório:

```bash
pnpm check
pnpm check-types
pnpm build
pnpm test
pnpm --filter backend test:cov
pnpm --filter web test:cov
pnpm --filter backend test:e2e --coverage
```

Para os e2e, prepare SQL Server, RustFS e o banco dedicado conforme o [README do backend](apps/backend/README.md#testes). As suítes criam dados próprios e removem os candidatos produzidos durante a execução.

## Escopo das verificações

A revisão no navegador complementou os testes com a conferência do formulário, das sugestões importadas, das mensagens e da confirmação de descarte. A automação de interações completas entre páginas é uma evolução possível; os testes de frontend atuais se concentram nos contratos, cache e hooks.

A extração de PDF depende de texto disponível no documento e permite revisão manual, conforme o enunciado. O armazenamento foi configurado para execução local do desafio; controle de acesso para dados reais e reconciliação entre SQL e S3 são evoluções para outro contexto de uso.
