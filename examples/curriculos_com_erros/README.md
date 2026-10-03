# Currículos com erros para testes

Os dados são fictícios. Importe cada arquivo no formulário de novo candidato para verificar avisos, validação e preenchimento manual.

| Arquivo | Erro proposital | Resultado esperado |
| --- | --- | --- |
| [01_sem_nome.pdf](01_sem_nome.pdf) | Nome ausente. | Importar e-mail e telefone; deixar nome para preenchimento manual (`PARTIAL_EXTRACTION`). |
| [02_email_invalido.pdf](02_email_invalido.pdf) | E-mail escrito com `(arroba)` em vez de `@`. | Importar nome e telefone; deixar e-mail para preenchimento manual (`PARTIAL_EXTRACTION`). |
| [03_telefone_invalido.pdf](03_telefone_invalido.pdf) | Telefone brasileiro com DDD inexistente: `20`. | Importar nome e e-mail; deixar telefone para preenchimento manual (`PARTIAL_EXTRACTION`). |
| [04_dois_emails.pdf](04_dois_emails.pdf) | Dois e-mails diferentes. | Importar nome e telefone; solicitar escolha manual do e-mail (`EMAIL_AMBIGUOUS`). |
| [05_dois_telefones.pdf](05_dois_telefones.pdf) | Dois telefones diferentes. | Importar nome e e-mail; solicitar escolha manual do telefone (`PHONE_AMBIGUOUS`). |
| [06_sem_texto.pdf](06_sem_texto.pdf) | PDF válido com uma página em branco. | Nenhum dado sugerido; todos os campos exigem preenchimento manual. Atualmente retorna `PARTIAL_EXTRACTION`, pois o parser acrescenta um marcador de página ao texto. |
| [07_pdf_corrompido.pdf](07_pdf_corrompido.pdf) | Assinatura PDF válida, mas estrutura truncada. | A API retorna HTTP 422 (`PDF_READ_FAILED`); permitir continuar o cadastro manualmente. |
| [08_falso_pdf.pdf](08_falso_pdf.pdf) | Texto simples com extensão `.pdf`, sem assinatura PDF. | A API rejeita o arquivo com HTTP 415. |
| [09_arquivo_vazio.pdf](09_arquivo_vazio.pdf) | Arquivo com zero bytes. | O formulário rejeita com “O arquivo está vazio. Selecione outro PDF.” |

Os casos de extração parcial devem preservar os dados válidos sugeridos. Nenhum desses arquivos deve criar um candidato automaticamente: o cadastro só é salvo após revisão e envio do formulário.

Os arquivos foram verificados com o mesmo parser e extractor usados pelo backend. Os arquivos 07, 08 e 09 são deliberadamente inválidos; não são documentos para uso normal.
