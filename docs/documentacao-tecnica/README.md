# Documentação técnica — CIEE Currículos

## Ler a documentação

**[Abrir o PDF da documentação técnica](main.pdf)**

O documento apresenta a solução entregue, o atendimento ao desafio, capturas reais da interface, decisões de arquitetura, verificações, processo de desenvolvimento e um roteiro de avaliação. O anexo reúne os 13 diagramas do Visual Paradigm, incluindo o D09 corrigido.

## Arquivos disponíveis

| Arquivo ou pasta | Conteúdo |
| --- | --- |
| [main.pdf](main.pdf) | Documento compilado para leitura. |
| [main.tex](main.tex) | Capa, tipografia, tabelas e estrutura do documento. |
| [projeto.tex](projeto.tex) | Texto da implementação, decisões e avaliação. |
| [modelagem.tex](modelagem.tex) | Explicações e inclusão dos diagramas. |
| [visualp.vpp](visualp.vpp) | Projeto editável no Visual Paradigm. |
| [imagens/](imagens/) | Diagramas e capturas utilizados pelo LaTeX. |
| [diagramas-manifest.json](diagramas-manifest.json) | Identificadores dos modelos e caminhos das imagens exportadas. |

Todos os arquivos necessários para compilar o documento estão nesta pasta. O relato de desenvolvimento e o registro de qualidade estão na raiz do repositório: [DESENVOLVIMENTO.md](../../DESENVOLVIMENTO.md) e [QUALIDADE.md](../../QUALIDADE.md).

## Gerar o PDF

Requer uma distribuição LaTeX, como MiKTeX ou TeX Live, com `pdflatex`, KOMA-Script, TeX Gyre Heros e os pacotes declarados em `main.tex`. Na raiz do repositório:

```bash
cd docs/documentacao-tecnica
pdflatex -interaction=nonstopmode -halt-on-error main.tex
pdflatex -interaction=nonstopmode -halt-on-error main.tex
```

A segunda execução atualiza sumário e referências. O resultado é `main.pdf`. Os arquivos auxiliares da compilação são ignorados pelo `.gitignore` local; o PDF, os fontes e as imagens ficam disponíveis para versionamento.

## Atualizar os diagramas

Abra `visualp.vpp` no Visual Paradigm, edite o modelo e exporte o PNG para o caminho correspondente em `diagramas-manifest.json`. Depois recompile o documento. Preserve os nomes das imagens para manter as referências usadas em `modelagem.tex`.

Para configurar e executar a aplicação, consulte o [README principal](../../README.md).
