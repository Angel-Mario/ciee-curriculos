# Desenvolvimento do desafio

## Organização do trabalho

Comecei pela leitura do enunciado e pela definição dos dois caminhos de cadastro: preenchimento manual e importação de um currículo PDF, ambos usando o mesmo formulário. Antes de programar, dediquei aproximadamente 2 horas à modelagem no Visual Paradigm e à preparação da documentação em LaTeX. Essa etapa ajudou a organizar as responsabilidades da interface, da API e do banco e a separar a leitura do arquivo da confirmação do cadastro.

Organizei a implementação em etapas: estrutura do monorepo, contratos compartilhados, persistência no SQL Server, cadastro manual, importação e revisão do PDF, listagem e detalhes. Depois acrescentei recursos de consulta e armazenamento opcional do currículo, revisei os tratamentos de erro e documentei a execução e os testes.

Ao final, dediquei aproximadamente 1 hora à atualização dos diagramas e do documento conforme a implementação entregue. A documentação técnica reúne 13 diagramas sobre casos de uso, componentes, dados, implantação e sequências dos principais fluxos.

## Decisões técnicas e motivos

| Decisão | Motivo |
| --- | --- |
| React com TypeScript e Vite | Atender à opção de frontend do desafio com componentes reutilizáveis e tipagem dos dados. |
| Node.js com NestJS | Organizar a API em controllers e serviços, separando validação, extração de PDF e persistência. |
| SQL Server com Prisma e migrations | Persistir os dados no banco solicitado e permitir recriar sua estrutura de forma reproduzível. |
| Contratos Zod em `packages/shared` | Aplicar as mesmas regras no formulário e na API e validar os dados trocados entre as aplicações. |
| Um formulário para os dois cadastros | Manter os campos e validações consistentes, com revisão das sugestões antes de salvar. |
| Extração no backend com `pdf-parse` | Ler o PDF no servidor e devolver sugestões, campos ausentes e avisos sem cadastrar automaticamente. |
| TanStack Router e TanStack Query | Manter filtros na URL, organizar consultas e atualizar o cache após alterações. |
| RustFS compatível com S3 | Oferecer armazenamento opcional do PDF separado dos dados do candidato no SQL Server. |
| Docker Compose | Facilitar a avaliação com frontend, API, banco e armazenamento configurados em conjunto. |

O PDF permanece opcional: importar dados e guardar o arquivo são escolhas separadas. Se a leitura falhar, o formulário continua disponível para preenchimento manual. Depois de salvar, a interface abre os detalhes e atualiza o cache da listagem.

## Melhorias entregues

Além do fluxo solicitado, implementei recursos úteis para a consulta e organização dos candidatos:

- Busca por nome ou e-mail, filtros por área e presença de currículo, ordenação e paginação.
- Layout adaptável, com tabela ou cartões conforme o espaço disponível.
- Armazenamento opcional e download do currículo na tela de detalhes.
- Exclusão individual com confirmação na interface e operação em lote disponível pela API.
- E-mail normalizado e único, com prevenção de duplicidade também no SQL Server.
- Validação de telefone brasileiro, com DDD e tratamento do prefixo `+55`.
- Confirmação ao sair de um formulário com alterações e cancelamento de importações anteriores.
- Referência interativa da API em `/docs` e contrato OpenAPI em `/openapi.json`.

## Uso de inteligência artificial e minha participação

Utilizei Codex no T3 Code, com GPT-6.1-Sol nas sessões registradas, como apoio à análise dos requisitos, implementação, revisão e documentação. Defini as prioridades e as decisões da solução e orientei os ajustes conforme o comportamento esperado.

Alguns exemplos de pedidos e aproveitamento das respostas:

- **Unificar a validação entre frontend e backend:** adaptei os contratos compartilhados para tratar campos obrigatórios, e-mail e telefone, incluindo números extraídos com `+55`.
- **Organizar o formulário de cadastro:** separei campos, importação e confirmação em componentes e hooks com responsabilidades específicas.
- **Revisar API e testes:** alinhei as expectativas dos testes ao contrato paginado e completei os schemas OpenAPI das operações entregues.
- **Atualizar a modelagem conforme o código:** revisei os diagramas de banco, armazenamento e sequências e integrei as imagens à documentação em LaTeX.

As sugestões foram adaptadas ao projeto: mantive a validação Zod e o estado React do formulário, ajustei o tratamento de erros e cancelamentos e revisei os relatórios para incluir os arquivos de código das aplicações. A revisão também contemplou a tentativa de remover um arquivo enviado quando a gravação no banco falha.

## Como verifiquei a solução

Durante o desenvolvimento, utilizei verificações de tipos, compilação, lint e formatação, testes unitários e testes de integração da API com SQL Server e RustFS reais. Os testes de integração usam um banco dedicado com sufixo `_test`, criam seus próprios dados e removem os registros produzidos pela suíte.

Os cenários contemplam cadastro manual, sugestões de PDF, validação de campos e arquivos, duplicidade de e-mail, listagem, detalhes, exclusão e operações com o currículo. Também revisei no navegador as mensagens de validação, o preenchimento a partir do PDF e a confirmação de descarte. O arquivo `examples/curriculo-ficticio.pdf` permite reproduzir a importação com dados fictícios.

Os comandos e a configuração estão no [README](README.md). O [registro de qualidade](QUALIDADE.md) detalha os cenários e os relatórios disponíveis.

## Tempo aproximado dedicado

| Etapa | Tempo |
| --- | --: |
| Modelagem e preparação do LaTeX, antes da programação | 2h |
| Desenvolvimento em 02/10: 14h30–17h20 e 19h30–23h | 6h20 |
| Desenvolvimento em 03/10: 08h30–12h | 3h30 |
| Atualização final dos diagramas e da documentação | 1h |
| Enriquecimento da documentação e revisão final em 03/10: 13h30–14h30 | 1h |
| **Total dos períodos registrados** | **13h50** |

Os valores são aproximados e correspondem aos períodos registrados para o desafio.

## Dificuldades, limites e evolução

A principal dificuldade da importação é transformar texto de currículos com formatos variados em sugestões úteis. Por isso, preservei a revisão manual e tratei a extração como auxílio ao cadastro. A leitura trabalha com PDFs que contêm texto; documentos digitalizados e layouts ambíguos podem exigir preenchimento manual, conforme previsto no desafio.

Outra decisão foi coordenar banco e armazenamento: o cadastro tenta compensar uma falha SQL removendo o upload. Uma evolução seria acrescentar reconciliação automática entre esses serviços. O acesso direto ao PDF foi configurado para avaliação local; em um uso com dados reais, adotaria controle de acesso e links temporários.

Com mais tempo, ampliaria a automação das interações completas da interface. Os testes atuais já cobrem contratos, hooks e integração da API, oferecendo uma base para essa evolução.
