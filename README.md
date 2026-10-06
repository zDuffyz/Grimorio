# Grimório de Mesa

App de consulta rápida de regras de D&D 2024 para a mesa. Funciona no celular como um app instalado (Android e iPhone), abre sem internet e recebe atualizações de conteúdo sozinho.

## O que tem na pasta

| Arquivo | Para que serve |
|---|---|
| `index.html` | A tela do app (visual e estrutura) |
| `app.js` | Busca, filtros, favoritos e navegação |
| `sw.js` | Faz o app abrir offline e buscar atualizações |
| `manifest.webmanifest` | Nome, ícone e cores do app instalado |
| `icons/` | Ícones do app |
| `data/index.json` | Versão do conteúdo e lista de arquivos |
| `data/*.json` | O conteúdo: regras, condições, ações e magias |

## Publicar no GitHub Pages (uma vez só)

1. Crie uma conta em github.com, se ainda não tiver.
2. Clique em **New repository**. Nome sugerido: `grimorio-de-mesa`. Deixe como **Public** (veja a observação abaixo).
3. No repositório novo, clique em **Add file → Upload files** e arraste **todo o conteúdo desta pasta** (não a pasta em si). Confirme em **Commit changes**.
4. Vá em **Settings → Pages**. Em *Source*, escolha **Deploy from a branch**, branch **main**, pasta **/ (root)**, e salve.
5. Em um ou dois minutos o app fica disponível em `https://SEU-USUARIO.github.io/grimorio-de-mesa/`.

Mande esse link para os jogadores.

**Sobre privacidade:** no plano gratuito do GitHub, o GitHub Pages só publica repositórios públicos. O link não aparece em buscadores com facilidade, mas qualquer pessoa que tiver o endereço consegue abrir. Para o conteúdo do SRD isso não é problema, porque ele é de licença livre.

## Instalar no celular

- **Android (Chrome):** abra o link, toque no menu ⋮ e escolha **Instalar app** ou **Adicionar à tela inicial**.
- **iPhone (Safari):** abra o link, toque em **Compartilhar** e depois em **Adicionar à Tela de Início**.

Depois de aberto uma vez com internet, o app funciona offline.

## Atualizar o conteúdo

1. No GitHub, abra o arquivo em `data/` que quer mudar e clique no lápis (✏️) para editar.
2. Faça a alteração e salve com **Commit changes**.
3. Abra `data/index.json` e mude o campo `versao` (por exemplo, de `2026.10.06-1` para `2026.10.07-1`). Em `notas`, escreva uma linha sobre o que mudou. Salve.

Na próxima vez que os jogadores abrirem o app com internet, o conteúdo novo é baixado e aparece um aviso com a sua nota. Ninguém precisa reinstalar nada.

Para criar uma categoria de arquivo nova (por exemplo, `data/cenario.json` para material do seu cenário), crie o arquivo e acrescente o nome dele na lista `arquivos` do `data/index.json`.

## Formato de uma entrada

```json
{
  "id": "agarrado",
  "nome": "Agarrado",
  "nome_en": "Grappled",
  "categoria": "condicao",
  "tags": ["agarrar", "escapar"],
  "resumo": "Uma linha que aparece na lista.",
  "texto": "Texto completo.\n\n- Item de lista\n- **Negrito** e *itálico*\n\n### Subtítulo\n| Coluna | Coluna |\n|---|---|\n| a | b |"
}
```

- `id`: só letras minúsculas sem acento, números e hífen. Precisa ser único.
- `categoria`: `regra`, `condicao`, `acao` ou `magia`.
- Para criar um link para outra entrada dentro do texto, use `[[id]]` ou `[[id|texto do link]]`. Exemplo: `[[incapacitado|Incapacitado]]`. A ficha também mostra automaticamente as entradas relacionadas.
- Magias têm um campo extra `magia` com `nivel` (0 para truque), `escola`, `tempo`, `alcance`, `componentes`, `duracao` e `classes`.
- Quebras de linha dentro do `texto` são escritas como `\n`. Aspas dentro do texto precisam ser `\"` ou, mais simples, use aspas curvas “assim”.

Se um arquivo JSON ficar com erro de digitação, o app não carrega a versão nova. Para conferir antes de salvar, cole o conteúdo em jsonlint.com.

## Atualizar o próprio app

Só é preciso quando `index.html`, `app.js` ou os ícones mudarem. Depois de subir os arquivos novos, abra `sw.js` e aumente o número em `VERSAO_APP` (por exemplo, de `1.0.0` para `1.0.1`). Os jogadores verão o aviso **Nova versão do app disponível** com o botão **Atualizar**.

## Testar no computador

Dentro desta pasta, rode `python -m http.server 8000` e abra `http://localhost:8000`. Abrir o `index.html` direto com dois cliques não funciona, porque o navegador bloqueia a leitura dos arquivos de conteúdo.

## Licença do conteúdo

Este trabalho inclui material do System Reference Document 5.2 ("SRD 5.2") da Wizards of the Coast LLC, disponível em https://www.dndbeyond.com/srd. O SRD 5.2 é licenciado sob a Licença Creative Commons Atribuição 4.0 Internacional, disponível em https://creativecommons.org/licenses/by/4.0/legalcode. O texto foi traduzido e adaptado para o português.

Esse aviso de atribuição precisa continuar no app (tela **Sobre e licença**) enquanto houver conteúdo do SRD nele.
