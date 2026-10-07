/* Grimório de Mesa — consulta rápida de regras.
   O conteúdo fica nos arquivos .json; este arquivo só lê e mostra. */
(function () {
  "use strict";

  var CATEGORIAS = {
    regra:    { rotulo: "Regra",    plural: "Regras",    letra: "R", cor: "var(--cat-regra)" },
    condicao: { rotulo: "Condição", plural: "Condições", letra: "C", cor: "var(--cat-condicao)" },
    acao:     { rotulo: "Ação",     plural: "Ações",     letra: "A", cor: "var(--cat-acao)" },
    magia:    { rotulo: "Magia",    plural: "Magias",    letra: "M", cor: "var(--cat-magia)" },
    classe:   { rotulo: "Classe",   plural: "Classes",   letra: "Cl", cor: "var(--cat-classe)" },
    antecedente: { rotulo: "Antecedente", plural: "Antecedentes", letra: "An", cor: "var(--cat-origem)" },
    especie:  { rotulo: "Espécie",  plural: "Espécies",  letra: "Es", cor: "var(--cat-origem)" },
    talento:  { rotulo: "Talento",  plural: "Talentos",  letra: "T", cor: "var(--cat-talento)" },
    equipamento: { rotulo: "Equipamento", plural: "Equipamento", letra: "Eq", cor: "var(--cat-equip)" }
  };
  var ORDEM_CAT = ["regra", "condicao", "acao", "antecedente", "especie", "talento", "equipamento", "magia", "classe"];
  var FONTE_PADRAO = "SRD 5.2 · tradução para consulta de mesa";
  // Abas seguindo os capítulos do Livro do Jogador
  var ABAS = [
    { id: "jogo",      cap: "Cap. 1", nome: "Jogando o Jogo" },
    { id: "classes",   cap: "Cap. 3", nome: "Classes" },
    { id: "origens",   cap: "Cap. 4", nome: "Origens" },
    { id: "talentos",  cap: "Cap. 5", nome: "Talentos" },
    { id: "equipamento", cap: "Cap. 6", nome: "Equipamento" },
    { id: "magias",    cap: "Cap. 7", nome: "Magias" },
    { id: "favoritos", cap: "Seus",   nome: "★ Favoritos" }
  ];
  function capitulo(e) {
    if (e.capitulo) return e.capitulo;
    if (e.categoria === "classe") return "classes";
    if (e.categoria === "magia") return "magias";
    return "jogo";
  }
  var NOMES_OPCOES = { "Invocação": "Invocações Místicas", "Metamagia": "Opções de Metamagia", "Manobra": "Manobras" };

  var estado = {
    entradas: [],
    porId: {},
    versao: null,
    aba: "jogo",
    busca: "",
    scrollLista: 0,
    veioDaLista: false,
    ultimaCarga: 0
  };

  var app = document.getElementById("app");
  var campoBusca = document.getElementById("busca");
  var botaoLimpar = document.getElementById("limpar");

  /* ---------- armazenamento local (pode falhar em modo privado) ---------- */
  function ler(chave, padrao) {
    try { var v = localStorage.getItem(chave); return v === null ? padrao : JSON.parse(v); }
    catch (e) { return padrao; }
  }
  function gravar(chave, valor) {
    try { localStorage.setItem(chave, JSON.stringify(valor)); } catch (e) { /* sem armazenamento */ }
  }
  var favoritos = ler("grimorio:favoritos", []);

  /* ---------- utilitários ---------- */
  function normalizar(s) {
    return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  }
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function rotuloNivel(n) { return n === 0 ? "Truque" : "Nível " + n; }

  /* ---------- texto formatado (Markdown simplificado) ---------- */
  function inline(t) {
    t = esc(t);
    t = t.replace(/\[\[([a-z0-9\-]+)(?:\|([^\]]+))?\]\]/g, function (_, id, rotulo) {
      var alvo = estado.porId[id];
      var texto = rotulo || (alvo ? alvo.nome : id);
      if (!alvo) return texto;
      return '<a class="ref" href="#' + id + '">' + texto + "</a>";
    });
    t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    t = t.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    return t;
  }

  function celulas(linha) {
    return linha.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map(function (c) { return c.trim(); });
  }

  function formatar(texto, aninhado) {
    var hTag = aninhado ? "h4" : "h3";
    var linhas = String(texto || "").split("\n");
    var html = [];
    var i = 0;
    while (i < linhas.length) {
      var l = linhas[i];
      if (!l.trim()) { i++; continue; }
      if (l.indexOf("### ") === 0) {
        html.push("<" + hTag + ">" + inline(l.slice(4)) + "</" + hTag + ">"); i++; continue;
      }
      if (l.indexOf("- ") === 0) {
        var itens = [];
        while (i < linhas.length && linhas[i].indexOf("- ") === 0) { itens.push("<li>" + inline(linhas[i].slice(2)) + "</li>"); i++; }
        html.push("<ul>" + itens.join("") + "</ul>"); continue;
      }
      if (l.trim().charAt(0) === "|") {
        var bloco = [];
        while (i < linhas.length && linhas[i].trim().charAt(0) === "|") { bloco.push(linhas[i]); i++; }
        var cab = celulas(bloco[0]);
        var corpo = bloco.slice(1).filter(function (b) { return !/^\|?\s*:?-{2,}/.test(b.trim()); });
        var t = "<div class=\"tabela\"><table" + (cab.length >= 8 ? " class=\"larga muito-larga\"" : cab.length >= 5 ? " class=\"larga\"" : "") + "><thead><tr>" +
          cab.map(function (c) { return "<th>" + inline(c) + "</th>"; }).join("") + "</tr></thead><tbody>" +
          corpo.map(function (b) { return "<tr>" + celulas(b).map(function (c) { return "<td>" + inline(c) + "</td>"; }).join("") + "</tr>"; }).join("") +
          "</tbody></table></div>";
        html.push(t); continue;
      }
      var par = [];
      while (i < linhas.length && linhas[i].trim() && linhas[i].indexOf("- ") !== 0 && linhas[i].indexOf("### ") !== 0 && linhas[i].trim().charAt(0) !== "|") {
        par.push(linhas[i]); i++;
      }
      html.push("<p>" + inline(par.join(" ")) + "</p>");
    }
    return html.join("");
  }

  function referencias(texto) {
    var ids = [];
    String(texto || "").replace(/\[\[([a-z0-9\-]+)/g, function (_, id) { if (ids.indexOf(id) < 0) ids.push(id); });
    return ids;
  }

  /* ---------- busca ---------- */
  // Termos antigos ou alternativos que também devem encontrar a entrada
  var SINONIMOS = [
    ["salvaguarda", "teste de resistencia"],
    ["imobiliz", "agarrado agarrar agarrao"],
    ["contido", "impedido restrito"],
    ["correr", "disparada"],
    ["analisar", "estudar"],
    ["usar magia", "acao magia conjurar"],
    ["trilha", "caminho"]
  ];

  function prepararIndice(e) {
    e._nome = normalizar(e.nome);
    e._en = normalizar(e.nome_en);
    e._tags = normalizar((e.tags || []).join(" "));
    e._resumo = normalizar(e.resumo);
    e._texto = normalizar(String(e.texto || "").replace(/\[\[[a-z0-9\-]+\|?/g, "").replace(/[\]*#|]/g, " "));
    e._refs = referencias(e.texto);
    var tudo = e._nome + " " + e._tags + " " + e._resumo + " " + e._texto;
    SINONIMOS.forEach(function (s) { if (tudo.indexOf(s[0]) >= 0) e._tags += " " + s[1]; });
  }

  function pontuar(e, consulta, termos) {
    var total = 0;
    for (var i = 0; i < termos.length; i++) {
      var t = termos[i];
      var p = 0;
      if (e._nome.indexOf(t) >= 0) p = 60;
      else if (e._en.indexOf(t) >= 0) p = 50;
      else if (e._tags.indexOf(t) >= 0) p = 30;
      else if (e._resumo.indexOf(t) >= 0) p = 15;
      else if (e._texto.indexOf(t) >= 0) p = 5;
      if (!p) return 0;
      total += p;
    }
    if (e._nome === consulta || e._en === consulta) total += 200;
    else if (e._nome.indexOf(consulta) === 0 || e._en.indexOf(consulta) === 0) total += 100;
    return total;
  }

  function ordenarPadrao(a, b) {
    var ca = ORDEM_CAT.indexOf(a.categoria), cb = ORDEM_CAT.indexOf(b.categoria);
    if (ca !== cb) return ca - cb;
    if (a.categoria === "classe") {
      var ka = a.de || a.id, kb = b.de || b.id;
      if (ka !== kb) return ka.localeCompare(kb, "pt-BR");
      var ra = !a.de ? 0 : (a.subclasse ? 2 : 1), rb = !b.de ? 0 : (b.subclasse ? 2 : 1);
      if (ra !== rb) return ra - rb;
      if (a.subclasse !== b.subclasse) return String(a.subclasse).localeCompare(String(b.subclasse), "pt-BR");
      if (a.tipo !== b.tipo) return a.tipo === "subclasse" ? -1 : 1;
      if ((a.nivel || 0) !== (b.nivel || 0)) return (a.nivel || 0) - (b.nivel || 0);
    }
    if (a.magia && b.magia && a.magia.nivel !== b.magia.nivel) return a.magia.nivel - b.magia.nivel;
    return a.nome.localeCompare(b.nome, "pt-BR");
  }

  function resultados() {
    var consulta = normalizar(estado.busca).trim();
    if (!consulta) return [];
    var termos = consulta.split(/\s+/);
    return estado.entradas
      .map(function (e) { return { e: e, p: pontuar(e, consulta, termos) }; })
      .filter(function (r) { return r.p > 0; })
      .sort(function (a, b) { return b.p - a.p || ordenarPadrao(a.e, b.e); })
      .map(function (r) { return r.e; });
  }

  /* ---------- vistas ---------- */
  function chip(valor, rotulo, ativo, n, attr) {
    return '<button type="button" class="chip" ' + (attr || "data-filtro") + '="' + valor + '" aria-pressed="' + (ativo ? "true" : "false") + '">' +
      esc(rotulo) + (n !== undefined ? '<span class="n">' + n + "</span>" : "") + "</button>";
  }

  function contar(cat) { return estado.entradas.filter(function (e) { return (!cat || e.categoria === cat) && !e.de; }).length; }

  function nomeClasse(e) { var c = e.de && estado.porId[e.de]; return c ? c.nome : ""; }
  function rotuloLado(e) {
    if (e.magia) return rotuloNivel(e.magia.nivel);
    if (e.tipo === "subclasse") return "Subclasse";
    if (e.categoria === "talento" && e.sub_curto) return e.sub_curto;
    if (e.categoria === "equipamento") return e.sub_curto && e.sub_curto !== "Regras" ? e.sub_curto : "Equipamento";
    if (e.de) return (e.sub_curto || e.subclasse || nomeClasse(e)) + " " + (e.nivel || "");
    return (CATEGORIAS[e.categoria] || CATEGORIAS.regra).rotulo;
  }
  function rotuloFicha(e, cat) {
    if (e.magia) return cat.rotulo + " · " + e.magia.escola;
    if (e.tipo === "subclasse") return "Subclasse de " + nomeClasse(e);
    if (e.categoria === "talento" && e.sub_curto) return "Talento · " + e.sub_curto;
    if (e.de) return (e.subclasse || nomeClasse(e)) + " · Nível " + e.nivel;
    return cat.rotulo;
  }

  function itemLista(e) {
    var cat = CATEGORIAS[e.categoria] || CATEGORIAS.regra;
    var lado = rotuloLado(e);
    var fav = favoritos.indexOf(e.id) >= 0 ? ' <span class="estrela" aria-label="Favorito">★</span>' : "";
    return '<li><a class="item" href="#' + e.id + '" style="--cor:' + cat.cor + '">' +
      '<span class="selo" aria-hidden="true">' + cat.letra + "</span>" +
      '<span class="item-texto"><span class="item-nome">' + esc(e.nome) + (e.nome_en ? '<span class="item-en">' + esc(e.nome_en) + "</span>" : "") + "</span>" +
      '<span class="item-resumo" style="display:block">' + esc(e.resumo || "") + "</span></span>" +
      '<span class="item-lado">' + esc(lado) + fav + "</span></a></li>";
  }

  function renderAbas() {
    var nav = document.getElementById("abas");
    if (!nav) return;
    var buscando = !!estado.busca.trim();
    nav.innerHTML = ABAS.map(function (a) {
      var ativa = !buscando && estado.aba === a.id;
      return '<button type="button" class="aba" data-aba="' + a.id + '" aria-pressed="' + ativa + '">' +
        '<span class="aba-cap">' + esc(a.cap) + '</span><span class="aba-nome">' + esc(a.nome) + "</span></button>";
    }).join("");
    var ativa = nav.querySelector('[aria-pressed="true"]');
    if (ativa) nav.scrollLeft = Math.max(0, ativa.offsetLeft - 8);
  }

  function secao(titulo, itens, extra) {
    if (!itens.length) return "";
    return '<section class="secao"><h2 class="secao-titulo">' + esc(titulo) + '<span class="n">' + itens.length + "</span></h2>" +
      (extra || "") + '<ul class="lista">' + itens.map(itemLista).join("") + "</ul></section>";
  }

  function porCapitulo(cap) {
    return estado.entradas.filter(function (e) { return capitulo(e) === cap && !e.de; });
  }

  function vistaLista() {
    renderAbas();
    var html = "";
    if (estado.busca.trim()) {
      var res = resultados();
      html = '<p class="contagem">' + res.length + (res.length === 1 ? " resultado" : " resultados") + " para “" + esc(estado.busca.trim()) + "” em todos os capítulos</p>" +
        (res.length ? '<ul class="lista">' + res.map(itemLista).join("") + "</ul>"
                    : '<p class="vazio">Nada encontrado. Tente outra palavra ou o nome em inglês.</p>');
    } else if (estado.aba === "jogo") {
      var jogo = porCapitulo("jogo").sort(ordenarPadrao);
      html = '<header class="cap-cab"><span class="cap-num">Capítulo 1</span><h2>Jogando o Jogo</h2></header>' +
        secao("Regras", jogo.filter(function (e) { return e.categoria === "regra"; })) +
        secao("Ações", jogo.filter(function (e) { return e.categoria === "acao"; })) +
        secao("Condições", jogo.filter(function (e) { return e.categoria === "condicao"; }));
    } else if (estado.aba === "classes") {
      var classes = porCapitulo("classes").sort(ordenarPadrao);
      html = '<header class="cap-cab"><span class="cap-num">Capítulo 3</span><h2>Classes de Personagem</h2></header>' +
        '<ul class="lista">' + classes.map(function (c) {
          var subs = estado.entradas.filter(function (s) { return s.de === c.id && s.tipo === "subclasse"; })
            .sort(function (a, b) { return a.nome.localeCompare(b.nome, "pt-BR"); });
          return itemLista(c).replace("</a></li>", "</a>" +
            '<div class="subs">' + subs.map(function (s) { return '<a class="chip" href="#' + s.id + '">' + esc(s.sub_curto || s.nome) + "</a>"; }).join("") + "</div></li>");
        }).join("") + "</ul>";
    } else if (estado.aba === "origens") {
      var org = porCapitulo("origens").sort(ordenarPadrao);
      html = '<header class="cap-cab"><span class="cap-num">Capítulo 4</span><h2>Origens dos Personagens</h2></header>' +
        secao("Regras", org.filter(function (e) { return e.categoria === "regra"; })) +
        secao("Antecedentes", org.filter(function (e) { return e.categoria === "antecedente"; })) +
        secao("Espécies", org.filter(function (e) { return e.categoria === "especie"; }));
    } else if (estado.aba === "talentos") {
      var tal = porCapitulo("talentos").sort(ordenarPadrao);
      var grupo = function (g) { return tal.filter(function (e) { return e.categoria === "talento" && e.sub_curto === g; }); };
      html = '<header class="cap-cab"><span class="cap-num">Capítulo 5</span><h2>Talentos</h2></header>' +
        secao("Regras", tal.filter(function (e) { return e.categoria !== "talento"; })) +
        secao("Talentos de Origem", grupo("Origem")) +
        secao("Talentos Gerais", grupo("Geral")) +
        secao("Estilos de Luta", grupo("Estilo de Luta")) +
        secao("Dádivas Épicas", grupo("Dádiva Épica"));
    } else if (estado.aba === "equipamento") {
      var eqs = porCapitulo("equipamento").sort(ordenarPadrao);
      var g = function (x) { return eqs.filter(function (e) { return (e.sub_curto || "") === x; }); };
      html = '<header class="cap-cab"><span class="cap-num">Capítulo 6</span><h2>Equipamento</h2></header>' +
        secao("Regras e tabelas", g("Regras")) +
        secao("Propriedades de armas", g("Propriedade")) +
        secao("Propriedades de maestria", g("Maestria")) +
        secao("Ferramentas", g("Ferramentas")) +
        secao("Itens com regras", g("Item")) +
        secao("Montarias, serviços e itens mágicos", g(""));
    } else if (estado.aba === "magias") {
      var magias = porCapitulo("magias").sort(ordenarPadrao);
      var niveis = [];
      magias.forEach(function (m) { if (niveis.indexOf(m.magia.nivel) < 0) niveis.push(m.magia.nivel); });
      html = '<header class="cap-cab"><span class="cap-num">Capítulo 7</span><h2>Magias</h2></header>' +
        niveis.map(function (n) {
          return secao(n === 0 ? "Truques" : n + "º círculo", magias.filter(function (m) { return m.magia.nivel === n; }));
        }).join("");
    } else {
      var favs = favoritos.map(function (id) { return estado.porId[id]; }).filter(Boolean);
      html = '<header class="cap-cab"><span class="cap-num">Seus</span><h2>Favoritos</h2></header>' +
        (favs.length ? '<ul class="lista">' + favs.map(itemLista).join("") + "</ul>"
                     : '<p class="vazio">Nenhum favorito ainda. Abra uma regra e toque na estrela para guardá-la aqui.</p>');
    }
    app.innerHTML = '<div class="vista">' + html + "</div>";
  }

  // Características escritas por extenso dentro da ficha da classe ou subclasse
  function blocoCarac(f) {
    return '<section class="carac" id="c-' + f.id + '">' +
      '<h3 class="carac-titulo"><span class="carac-nivel">Nível ' + (f.nivel || "") + '</span>' +
      '<a href="#' + f.id + '">' + esc(f.nome) + "</a></h3>" +
      '<div class="carac-corpo">' + formatar(f.texto, true) + "</div></section>";
  }

  function blocoOpcoes(lista) {
    var grupos = {};
    lista.forEach(function (f) { (grupos[f.sub_curto] = grupos[f.sub_curto] || []).push(f); });
    return Object.keys(grupos).map(function (g) {
      var itens = grupos[g].sort(function (a, b) { return a.nome.localeCompare(b.nome, "pt-BR"); });
      return '<details class="opcoes"><summary>' + esc(NOMES_OPCOES[g] || g) + ' <span class="n">' + itens.length + "</span></summary>" +
        itens.map(function (f) {
          return '<section class="opcao" id="c-' + f.id + '"><h4><a href="#' + f.id + '">' + esc(f.nome) + "</a></h4>" + formatar(f.texto, true) + "</section>";
        }).join("") + "</details>";
    }).join("");
  }

  function porNivel(a, b) { return (a.nivel || 0) - (b.nivel || 0) || a.nome.localeCompare(b.nome, "pt-BR"); }

  function corpoClasse(e) {
    var texto = String(e.texto || "");
    if (!e.de) {
      // Ficha da classe: troca a lista de links pelas características completas
      var iCar = texto.indexOf("### Características"), iSub = texto.indexOf("### Subclasses");
      var antes = iCar >= 0 ? texto.slice(0, iCar) : texto;
      var subs = iSub >= 0 ? texto.slice(iSub) : "";
      var feats = estado.entradas.filter(function (f) { return f.de === e.id && !f.subclasse && f.tipo !== "subclasse"; });
      var nucleo = feats.filter(function (f) { return !f.sub_curto; }).sort(porNivel);
      var opcoes = feats.filter(function (f) { return f.sub_curto; });
      return formatar(antes) +
        '<h3>Características da classe</h3>' + nucleo.map(blocoCarac).join("") + blocoOpcoes(opcoes) +
        formatar(subs);
    }
    // Ficha da subclasse: introdução + todas as características por nível
    var corte = texto.indexOf("\n\n- **Nível");
    var intro = corte >= 0 ? texto.slice(0, corte) : texto;
    var todas = estado.entradas.filter(function (f) { return f.subclasse === e.subclasse && f.tipo !== "subclasse" && f.de === e.de; });
    var proprias = todas.filter(function (f) { return !f.sub_curto || f.sub_curto === e.sub_curto; }).sort(porNivel);
    var opcoesS = todas.filter(function (f) { return f.sub_curto && f.sub_curto !== e.sub_curto; });
    var classe = estado.porId[e.de];
    return formatar(intro) + proprias.map(blocoCarac).join("") + blocoOpcoes(opcoesS) +
      (classe ? '<p class="volta-classe">Classe: <a class="ref" href="#' + classe.id + '">' + esc(classe.nome) + "</a></p>" : "");
  }

  function vistaFicha(e) {
    var cat = CATEGORIAS[e.categoria] || CATEGORIAS.regra;
    var fav = favoritos.indexOf(e.id) >= 0;
    var bloco = "";
    if (e.magia) {
      var m = e.magia;
      var campos = [
        ["Nível", rotuloNivel(m.nivel)],
        ["Escola", m.escola],
        ["Tempo de conjuração", m.tempo, m.tempo && m.tempo.length > 24],
        ["Alcance", m.alcance],
        ["Componentes", m.componentes, m.componentes && m.componentes.length > 18],
        ["Duração", m.duracao, m.duracao && m.duracao.length > 18],
        ["Classes", (m.classes || []).join(", "), true]
      ].filter(function (c) { return c[1]; });
      // campos longos ocupam a linha inteira
      bloco = '<dl class="bloco-magia">' + campos.map(function (c) {
        return (c[2] ? '<div class="largo">' : "<div>") + "<dt>" + esc(c[0]) + "</dt><dd>" + esc(c[1]) + "</dd></div>";
      }).join("") + "</dl>";
    }

    var saindo = e._refs.filter(function (id) { return estado.porId[id] && id !== e.id; });
    var chegando = estado.entradas.filter(function (o) { return o.id !== e.id && o._refs.indexOf(e.id) >= 0 && saindo.indexOf(o.id) < 0; })
      .map(function (o) { return o.id; });
    var rel = saindo.concat(chegando);
    if (e.categoria === "classe" && (!e.de || e.tipo === "subclasse")) rel = []; // a ficha já lista tudo
    var pai = e.de && e.tipo !== "subclasse" ? (e.subclasse ? estado.entradas.filter(function (s) { return s.tipo === "subclasse" && s.subclasse === e.subclasse && s.de === e.de; })[0] : estado.porId[e.de]) : null;
    if (pai) rel = [pai.id].concat(rel.filter(function (id) { return id !== pai.id; }));
    var relacionados = rel.length
      ? '<section class="relacionados"><h3>Veja também</h3><div>' +
        rel.map(function (id) { var o = estado.porId[id]; return '<a class="chip" href="#' + id + '">' + esc(o.nome) + "</a>"; }).join("") +
        "</div></section>"
      : "";

    app.innerHTML = '<article class="vista" style="--cor:' + cat.cor + '">' +
      '<button type="button" class="voltar" id="voltar">← Voltar</button>' +
      '<header class="ficha-cab"><div>' +
      '<div class="ficha-cat">' + esc(rotuloFicha(e, cat)) + "</div>" +
      "<h2>" + esc(e.nome) + "</h2>" +
      (e.nome_en ? '<div class="ficha-en">' + esc(e.nome_en) + "</div>" : "") +
      '</div><button type="button" class="favoritar" id="favoritar" aria-pressed="' + fav + '" aria-label="' + (fav ? "Remover dos favoritos" : "Adicionar aos favoritos") + '">' + (fav ? "★" : "☆") + "</button></header>" +
      bloco +
      '<div class="corpo">' + (e.categoria === "classe" && (!e.de || e.tipo === "subclasse") ? corpoClasse(e) : formatar(e.texto)) + "</div>" +
      relacionados +
      '<p class="fonte-ficha">Fonte: ' + esc(e.fonte || FONTE_PADRAO) + ".</p>" +
      "</article>";
  }

  function vistaSobre() {
    app.innerHTML = '<section class="vista sobre">' +
      '<button type="button" class="voltar" id="voltar">← Voltar</button>' +
      "<h2>Sobre</h2>" +
      "<p>O Grimório de Mesa reúne regras de Dungeons &amp; Dragons (edição 2024) para consulta rápida durante o jogo. O conteúdo é atualizado pelo narrador e chega automaticamente quando o app é aberto com internet. Sem internet, o app mostra a última versão baixada.</p>" +
      "<p>Versão do conteúdo: <strong>" + esc(estado.versao || "—") + "</strong>.</p>" +
      '<p class="licenca">Este trabalho inclui material do System Reference Document 5.2 (“SRD 5.2”) da Wizards of the Coast LLC, disponível em <a href="https://www.dndbeyond.com/srd" target="_blank" rel="noopener">dndbeyond.com/srd</a>. O SRD 5.2 é licenciado sob a Licença Creative Commons Atribuição 4.0 Internacional, disponível em <a href="https://creativecommons.org/licenses/by/4.0/legalcode" target="_blank" rel="noopener">creativecommons.org/licenses/by/4.0/legalcode</a>. O texto foi traduzido e adaptado para o português.</p>' +
      '<p class="licenca">Algumas entradas trazem um resumo das regras do Livro do Jogador (2024) escrito com outras palavras, para consulta da mesa. A fonte de cada entrada aparece no fim da ficha.</p>' +
      "</section>";
  }

  /* ---------- roteamento ---------- */
  function rotaAtual() { return decodeURIComponent((location.hash || "").replace(/^#/, "")); }

  function renderizar() {
    if (!estado.entradas.length) return;
    var rota = rotaAtual();
    if (rota === "sobre") { vistaSobre(); window.scrollTo(0, 0); return; }
    var e = estado.porId[rota];
    if (e) { estado.aba = capitulo(e); renderAbas(); vistaFicha(e); window.scrollTo(0, 0); return; }
    vistaLista();
    window.scrollTo(0, estado.scrollLista);
  }

  window.addEventListener("hashchange", function (ev) {
    var anterior = (ev.oldURL || "").split("#")[1] || "";
    estado.veioDaLista = !estado.porId[anterior] && anterior !== "sobre";
    renderizar();
  });

  /* ---------- interações ---------- */
  app.addEventListener("click", function (ev) {
    var alvo = ev.target.closest("button, a");
    if (!alvo) return;

    if (alvo.matches(".item") || (alvo.matches("a") && rotaAtual() === "")) {
      estado.scrollLista = window.scrollY;
    }
    if (alvo.id === "voltar") {
      if (estado.veioDaLista && history.length > 1) history.back();
      else location.hash = "";
      return;
    }
    if (alvo.id === "favoritar") {
      var id = rotaAtual();
      var i = favoritos.indexOf(id);
      if (i >= 0) favoritos.splice(i, 1); else favoritos.push(id);
      gravar("grimorio:favoritos", favoritos);
      vistaFicha(estado.porId[id]);
      return;
    }
  });

  document.getElementById("abas").addEventListener("click", function (ev) {
    var b = ev.target.closest("[data-aba]");
    if (!b) return;
    estado.aba = b.getAttribute("data-aba");
    gravar("grimorio:aba", estado.aba);
    estado.scrollLista = 0;
    if (estado.busca) { campoBusca.value = ""; estado.busca = ""; botaoLimpar.hidden = true; }
    if (rotaAtual() !== "") location.hash = ""; else { vistaLista(); window.scrollTo(0, 0); }
  });

  campoBusca.addEventListener("input", function () {
    estado.busca = campoBusca.value;
    botaoLimpar.hidden = !campoBusca.value;
    estado.scrollLista = 0;
    if (rotaAtual() !== "") { location.hash = ""; } else { vistaLista(); window.scrollTo(0, 0); }
  });
  campoBusca.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape") { campoBusca.value = ""; campoBusca.dispatchEvent(new Event("input")); }
    if (ev.key === "Enter" && estado.busca.trim()) {
      var r = resultados();
      if (r.length) { campoBusca.blur(); location.hash = r[0].id; }
    }
  });
  botaoLimpar.addEventListener("click", function () {
    campoBusca.value = ""; campoBusca.dispatchEvent(new Event("input")); campoBusca.focus();
  });
  document.getElementById("link-inicio").addEventListener("click", function (ev) {
    ev.preventDefault();
    estado.scrollLista = 0;
    if (rotaAtual() !== "") location.hash = ""; else { vistaLista(); window.scrollTo(0, 0); }
  });

  /* ---------- aviso ---------- */
  var aviso = document.getElementById("aviso");
  var avisoTexto = document.getElementById("aviso-texto");
  var avisoAcao = document.getElementById("aviso-acao");
  var acaoAtual = null;
  function avisar(texto, rotuloAcao, acao) {
    avisoTexto.textContent = texto;
    acaoAtual = acao || null;
    avisoAcao.hidden = !acao;
    if (rotuloAcao) avisoAcao.textContent = rotuloAcao;
    aviso.hidden = false;
    if (!acao) setTimeout(function () { aviso.hidden = true; }, 6000);
  }
  avisoAcao.addEventListener("click", function () { aviso.hidden = true; if (acaoAtual) acaoAtual(); });
  document.getElementById("aviso-fechar").addEventListener("click", function () { aviso.hidden = true; });

  /* ---------- carregamento do conteúdo ---------- */
  function buscarJSON(caminho) {
    return fetch(caminho, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error(caminho + ": " + r.status);
      return r.json();
    });
  }

  function carregar(silencioso) {
    return buscarJSON("index.json").then(function (indice) {
      if (silencioso && indice.versao === estado.versao) return;
      return Promise.all(indice.arquivos.map(function (a) { return buscarJSON(a); })).then(function (partes) {
        var entradas = [];
        partes.forEach(function (p) { entradas = entradas.concat(p); });
        entradas.forEach(prepararIndice);
        estado.entradas = entradas;
        estado.porId = {};
        entradas.forEach(function (e) { estado.porId[e.id] = e; });
        estado.versao = indice.versao;
        estado.ultimaCarga = Date.now();
        document.getElementById("versao").textContent = "Conteúdo " + indice.versao;

        var vista = ler("grimorio:versao", null);
        if (vista && vista !== indice.versao) {
          avisar("Conteúdo atualizado. " + (indice.notas || ""));
        }
        gravar("grimorio:versao", indice.versao);
        renderizar();
      });
    }).catch(function (erro) {
      if (silencioso) return;
      app.innerHTML = '<p class="vazio">Não foi possível carregar o conteúdo. Conecte-se à internet e abra o app de novo para baixar a primeira versão.</p>';
      console.error(erro);
    });
  }

  var abaSalva = ler("grimorio:aba", "jogo");
  if (ABAS.some(function (a) { return a.id === abaSalva; })) estado.aba = abaSalva;
  carregar(false);

  // Ao voltar para o app depois de um tempo, verifica se há conteúdo novo
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible" && Date.now() - estado.ultimaCarga > 10 * 60 * 1000) {
      carregar(true);
      if (registro) { try { registro.update(); } catch (e) { /* ignora */ } }
    }
  });

  /* ---------- funcionamento offline e atualização do app ---------- */
  var registro = null;
  if ("serviceWorker" in navigator) {
    try {
      navigator.serviceWorker.register("sw.js").then(function (reg) {
        registro = reg;
        reg.addEventListener("updatefound", function () {
          var novo = reg.installing;
          if (!novo) return;
          novo.addEventListener("statechange", function () {
            if (novo.state === "installed" && navigator.serviceWorker.controller) {
              avisar("Nova versão do app disponível.", "Atualizar", function () { novo.postMessage("pular-espera"); });
            }
          });
        });
      }).catch(function () { /* sem offline neste ambiente */ });
      var recarregou = false;
      navigator.serviceWorker.addEventListener("controllerchange", function () {
        if (recarregou) return;
        recarregou = true;
        location.reload();
      });
    } catch (e) { /* sem offline neste ambiente */ }
  }
})();
