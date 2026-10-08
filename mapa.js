/* Grimório de Mesa — aba Mapa (combate em grid) e Tela da mesa.
   Usa a conexão do campanha.js (window.Mesa.contexto). */
(function () {
  "use strict";

  var G = window.Grimorio, esc = G.esc;
  var CONDICOES = ["Amedrontado", "Atordoado", "Caído", "Cego", "Contido", "Enfeitiçado", "Envenenado", "Exaustão",
    "Imobilizado", "Incapacitado", "Inconsciente", "Invisível", "Paralisado", "Petrificado", "Surdo", "Concentrando"];
  var ABREV = { "Amedrontado": "Am", "Atordoado": "At", "Caído": "Ca", "Cego": "Ce", "Contido": "Co", "Enfeitiçado": "En",
    "Envenenado": "Ev", "Exaustão": "Ex", "Imobilizado": "Im", "Incapacitado": "In", "Inconsciente": "Ic", "Invisível": "Iv",
    "Paralisado": "Pa", "Petrificado": "Pe", "Surdo": "Su", "Concentrando": "◎" };
  var CORES = ["#7B3D6B", "#2F5D73", "#3B6647", "#9A4E1A", "#9C2F2A", "#4E3F86", "#865617", "#4B5966"];

  var ctx = null;                // { sb, atual, rpc, q }
  var raiz = null, modoTela = false;
  var est = {
    cenas: [], cena: null, tokens: [], biblioteca: { mapas: [], tokens: [] },
    vista: { x: 0, y: 0, z: 1 }, ferramenta: "mover",        // mover | regua | revelar | cobrir
    painel: null,                                             // { tipo: "token"|"cena"|"novo-token"|"nova-cena"|"foundry", id }
    canal: null
  };

  function souMestre() { return ctx && ctx.atual && ctx.atual.papel === "mestre" && !modoTela; }
  function meuPapel() { return ctx && ctx.atual ? ctx.atual.papel : null; }
  function erro(e) { G.avisar(window.Mesa.msgErro(e)); }
  function q(p) { return ctx.q(p); }
  function rpc(n, a) { return ctx.rpc(n, a); }
  function urlImg(u) { return !u ? "" : /^(https?:|data:|blob:)/.test(u) ? u : u.replace(/^\/+/, ""); }
  function token(id) { return est.tokens.filter(function (t) { return t.id === id; })[0]; }

  /* ---------- carregamento ---------- */
  function carregarBiblioteca() {
    var ler = function (u) { return fetch(u, { cache: "no-cache" }).then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; }); };
    return Promise.all([ler("mapas/index.json"), ler("tokens/index.json")]).then(function (r) {
      est.biblioteca.mapas = r[0] || []; est.biblioteca.tokens = r[1] || [];
    });
  }

  function carregarCenas() {
    var c = ctx.atual.id;
    return q(ctx.sb.from("cenas").select("*").eq("campanha", c).order("criada_em")).then(function (lista) {
      est.cenas = lista || [];
      var ativa = est.cenas.filter(function (x) { return x.ativa; })[0];
      var mantida = est.cena && est.cenas.filter(function (x) { return x.id === est.cena.id; })[0];
      est.cena = (souMestre() && mantida) || ativa || (souMestre() ? est.cenas[est.cenas.length - 1] : null) || null;
    });
  }

  function carregarTokens() {
    if (!est.cena) { est.tokens = []; return Promise.resolve(); }
    return q(ctx.sb.from("tokens").select("*").eq("cena", est.cena.id)).then(function (l) { est.tokens = l || []; });
  }

  function assinar() {
    if (est.canal) { ctx.sb.removeChannel(est.canal); est.canal = null; }
    var c = ctx.atual.id, t = null;
    var recarregar = function () {
      clearTimeout(t);
      t = setTimeout(function () {
        carregarCenas().then(carregarTokens).then(function () { if (!arrasto) desenhar(); }).catch(function () {});
      }, 250);
    };
    est.canal = ctx.sb.channel("mapa-" + c)
      .on("postgres_changes", { event: "*", schema: "public", table: "tokens", filter: "campanha=eq." + c }, function (ev) {
        // aplica movimento na hora para ficar fluido; depois confirma recarregando
        if (ev.new && ev.new.id && token(ev.new.id) && !arrasto) { Object.assign(token(ev.new.id), ev.new); posicionarTokens(); }
        recarregar();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "cenas", filter: "campanha=eq." + c }, recarregar)
      .subscribe();
  }

  /* ---------- entrada ---------- */
  function render(el, tela) {
    raiz = el; modoTela = !!tela;
    document.body.classList.toggle("modo-tela", modoTela);
    raiz.innerHTML = (modoTela ? "" : '<header class="cap-cab"><span class="cap-num">Mesa</span><h2>Mapa</h2></header>') + '<p class="mesa-vazio">Carregando…</p>';
    if (!window.Mesa) return;
    window.Mesa.contexto().then(function (c) {
      ctx = c;
      if (!ctx.atual) {
        raiz.innerHTML = '<header class="cap-cab"><span class="cap-num">Mesa</span><h2>Mapa</h2></header><p class="mesa-vazio">Entre numa campanha na aba Campanha para ver o mapa.</p>';
        return;
      }
      return Promise.all([carregarBiblioteca(), carregarCenas().then(carregarTokens)]).then(function () {
        est.vista = null; assinar(); desenhar();
      });
    }).catch(function (e) {
      raiz.innerHTML = '<p class="mesa-vazio">' + esc(window.Mesa.msgErro(e)) + "</p>";
    });
  }

  /* ---------- desenho ---------- */
  function desenhar() {
    if (!raiz) return;
    var c = est.cena, h = "";
    if (!modoTela) {
      h += '<div class="mapa-topo">';
      if (souMestre()) {
        h += '<select data-mapa="escolher-cena" aria-label="Cena">' + (est.cenas.length ? "" : '<option value="">Nenhuma cena</option>') +
          est.cenas.map(function (x) { return '<option value="' + x.id + '"' + (c && x.id === c.id ? " selected" : "") + ">" + esc(x.nome) + (x.ativa ? " ●" : "") + "</option>"; }).join("") + "</select>" +
          '<button type="button" class="mesa-btn-sec" data-mapa="nova-cena">+ Cena</button>' +
          (c ? '<button type="button" class="mesa-btn-sec" data-mapa="editar-cena">Ajustar</button>' +
            (c.ativa ? "" : '<button type="button" class="mesa-btn" data-mapa="ativar">Mostrar aos jogadores</button>') : "");
      } else {
        h += '<span class="mapa-nome">' + esc(c ? c.nome : "") + "</span>";
      }
      h += "</div>";
    }
    if (!c) {
      h += '<p class="mesa-vazio">' + (souMestre() ? "Crie a primeira cena com “+ Cena”." : "O Mestre ainda não mostrou nenhum mapa.") + "</p>";
      raiz.innerHTML = h + painelHTML();
      return;
    }
    if (!modoTela) {
      h += '<div class="mapa-ferramentas" role="toolbar">' +
        botaoFerr("mover", "✥", "Mover") + botaoFerr("regua", "📏", "Régua") +
        (souMestre() ? botaoFerr("revelar", "◐", "Revelar") + botaoFerr("cobrir", "◑", "Cobrir") +
          '<button type="button" class="mapa-ferr" data-mapa="novo-token" title="Adicionar token"><span>＋</span>Token</button>' : "") +
        '<button type="button" class="mapa-ferr" data-mapa="centralizar" title="Enquadrar o mapa na tela"><span>⤢</span>Ver tudo</button>' +
        (souMestre() ? '<a class="mapa-ferr" href="#tela" target="_blank" rel="noopener" title="Abrir a tela da mesa"><span>🖵</span>Mesa</a>' : "") +
        "</div>";
    }
    h += '<div class="mapa-vp" id="mapa-vp"><div class="mapa-mundo" id="mapa-mundo" style="width:' + c.largura + "px;height:" + c.altura + 'px">' +
      (c.imagem ? '<img class="mapa-fundo" src="' + esc(urlImg(c.imagem)) + '" alt="" draggable="false" width="' + c.largura + '" height="' + c.altura + '">' : '<div class="mapa-fundo mapa-sem-img"></div>') +
      (c.grid_visivel ? gradeSVG(c) : "") +
      '<div id="mapa-tokens"></div>' +
      '<canvas id="mapa-nevoa" class="mapa-nevoa" width="' + c.largura + '" height="' + c.altura + '"></canvas>' +
      '<div id="mapa-meus"></div>' +
      '<svg id="mapa-regua" class="mapa-regua" width="' + c.largura + '" height="' + c.altura + '"></svg>' +
      "</div></div>";
    h += iniciativaHTML();
    raiz.innerHTML = h + painelHTML();
    desenharNevoa();
    posicionarTokens();
    ligarVisor();
  }

  function botaoFerr(id, icone, nome) {
    return '<button type="button" class="mapa-ferr" data-ferr="' + id + '" aria-pressed="' + (est.ferramenta === id) + '"><span>' + icone + "</span>" + nome + "</button>";
  }

  function gradeSVG(c) {
    var g = c.grid, ox = ((c.grid_x % g) + g) % g, oy = ((c.grid_y % g) + g) % g;
    return '<svg class="mapa-grade" width="' + c.largura + '" height="' + c.altura + '"><defs><pattern id="gp" width="' + g + '" height="' + g +
      '" patternUnits="userSpaceOnUse" x="' + ox + '" y="' + oy + '"><path d="M ' + g + " 0 L 0 0 0 " + g + '" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="1"/></pattern></defs>' +
      '<rect width="100%" height="100%" fill="url(#gp)"/></svg>';
  }

  // Tokens que a pessoa vê: Mestre vê tudo (ocultos esmaecidos); tela da mesa vê como jogador
  function tokensVisiveis() {
    return est.tokens.filter(function (t) { return t.visivel || souMestre() || (!modoTela && t.dono === meuPapel()); });
  }

  function htmlToken(t) {
    var c = est.cena, s = t.tamanho * c.grid;
    var meu = t.dono && t.dono === meuPapel() && !modoTela;
    var vez = c.em_combate && c.turno === t.id;
    var pv = t.pv_max ? Math.max(0, Math.min(1, (t.pv || 0) / t.pv_max)) : null;
    var mostrarNumero = souMestre() || meu || (t.dono && !modoTela);
    var cond = (t.condicoes || []).slice(0, 4).map(function (n) { return '<i title="' + esc(n) + '">' + esc(ABREV[n] || n.slice(0, 2)) + "</i>"; }).join("");
    return '<div class="mapa-token' + (t.visivel ? "" : " oculto") + (vez ? " vez" : "") + (meu ? " meu" : "") + '" data-token="' + t.id +
      '" style="width:' + s + "px;height:" + s + "px;--cor:" + esc(t.cor) + '">' +
      (t.imagem ? '<img src="' + esc(urlImg(t.imagem)) + '" alt="" draggable="false">' : '<span class="mapa-ini">' + esc((t.nome || "?").slice(0, 2)) + "</span>") +
      (pv !== null ? '<b class="mapa-pv"><b style="width:' + Math.round(pv * 100) + '%;background:' + (pv > .5 ? "#3B8A4A" : pv > .25 ? "#C08A1E" : "#B3362E") + '"></b></b>' : "") +
      (cond ? '<span class="mapa-cond">' + cond + "</span>" : "") +
      '<span class="mapa-rotulo">' + esc(t.nome) + (mostrarNumero && t.pv_max ? " · " + (t.pv || 0) + "/" + t.pv_max : "") + "</span></div>";
  }

  function posicionarTokens() {
    var cam = document.getElementById("mapa-tokens"), meus = document.getElementById("mapa-meus");
    if (!cam || !est.cena) return;
    var c = est.cena, vis = tokensVisiveis();
    var acima = vis.filter(function (t) { return (t.dono && t.dono === meuPapel() && !modoTela) || souMestre(); });
    var abaixo = vis.filter(function (t) { return acima.indexOf(t) < 0; });
    cam.innerHTML = abaixo.map(htmlToken).join("");
    meus.innerHTML = acima.map(htmlToken).join("");
    vis.forEach(function (t) {
      var el = raiz.querySelector('[data-token="' + t.id + '"]');
      if (el) { el.style.left = (c.grid_x + t.x * c.grid) + "px"; el.style.top = (c.grid_y + t.y * c.grid) + "px"; }
    });
    var ini = document.getElementById("mapa-iniciativa");
    if (ini) ini.outerHTML = iniciativaHTML();
  }

  function desenharNevoa() {
    var cv = document.getElementById("mapa-nevoa"), c = est.cena;
    if (!cv) return;
    var g = cv.getContext("2d");
    g.clearRect(0, 0, cv.width, cv.height);
    if (!c.nevoa_ligada) { cv.style.display = "none"; return; }
    cv.style.display = "";
    g.fillStyle = souMestre() ? "rgba(10,14,20,.55)" : "#0B1016";
    g.fillRect(0, 0, cv.width, cv.height);
    (c.nevoa || []).forEach(function (r) {
      var x = c.grid_x + r.x * c.grid, y = c.grid_y + r.y * c.grid, w = r.w * c.grid, h = r.h * c.grid;
      if (r.op === "+") g.clearRect(x, y, w, h); else g.fillRect(x, y, w, h);
    });
  }

  /* ----- Iniciativa ----- */
  function ordemIniciativa() {
    return est.tokens.filter(function (t) { return t.iniciativa !== null && t.iniciativa !== undefined; })
      .sort(function (a, b) { return b.iniciativa - a.iniciativa || String(a.nome).localeCompare(b.nome); });
  }

  function iniciativaHTML() {
    var c = est.cena;
    if (!c) return "";
    var ordem = ordemIniciativa();
    var vez = token(c.turno);
    var meuNaVez = vez && vez.dono === meuPapel() && !modoTela;
    var h = '<section class="mapa-iniciativa" id="mapa-iniciativa">';
    h += '<div class="mapa-ini-cab"><strong>' + (c.em_combate ? "Combate · rodada " + c.rodada : "Iniciativa") + "</strong>";
    if (!modoTela) {
      if (souMestre()) {
        h += c.em_combate
          ? '<button type="button" class="mesa-btn" data-mapa="proximo">Próximo turno</button><button type="button" class="mesa-btn-sec" data-mapa="encerrar">Encerrar</button>'
          : '<button type="button" class="mesa-btn" data-mapa="iniciar"' + (ordem.length ? "" : " disabled") + ">Iniciar combate</button>";
      } else if (meuNaVez) {
        h += '<button type="button" class="mesa-btn" data-mapa="passar">Encerrar meu turno</button>';
      }
    }
    h += "</div>";
    if (!ordem.length) {
      h += '<p class="mesa-ajuda">' + (souMestre() ? "Toque num token e preencha a iniciativa dele. Quem tiver iniciativa entra na ordem." : "Toque no seu token para informar a sua iniciativa.") + "</p>";
    } else {
      h += '<ol class="mapa-ordem">' + ordem.map(function (t) {
        var escondido = !t.visivel && !souMestre();
        return '<li class="' + (c.turno === t.id && c.em_combate ? "vez" : "") + '"' + (escondido ? "" : ' data-token-lista="' + t.id + '"') + ">" +
          '<span class="mapa-ordem-n">' + (Math.round(t.iniciativa * 10) / 10) + "</span>" +
          '<span class="mapa-ordem-cor" style="background:' + esc(t.cor) + '"></span>' +
          esc(escondido ? "???" : t.nome) + (t.visivel ? "" : souMestre() ? " (oculto)" : "") + "</li>";
      }).join("") + "</ol>";
    }
    if (c.em_combate && !modoTela && meuNaVez) h += '<p class="mapa-sua-vez">É a sua vez! Arraste o seu token e encerre o turno quando terminar.</p>';
    return h + "</section>";
  }

  /* ----- Painéis (folha inferior) ----- */
  function painelHTML() {
    var p = est.painel;
    if (!p || modoTela) return "";
    var corpo = "";
    if (p.tipo === "token") corpo = painelToken(token(p.id));
    else if (p.tipo === "novo-token") corpo = formToken(null);
    else if (p.tipo === "editar-token") corpo = formToken(token(p.id));
    else if (p.tipo === "nova-cena") corpo = formCena(null);
    else if (p.tipo === "cena") corpo = formCena(est.cena);
    if (!corpo) return "";
    return '<div class="mapa-folha" role="dialog" aria-modal="true"><div class="mapa-folha-corpo">' +
      '<button type="button" class="mapa-fechar" data-mapa="fechar" aria-label="Fechar">×</button>' + corpo + "</div></div>";
  }

  function painelToken(t) {
    if (!t) return "";
    var meu = t.dono && t.dono === meuPapel();
    var pode = souMestre() || meu;
    var h = '<h3><span class="mapa-ordem-cor" style="background:' + esc(t.cor) + '"></span>' + esc(t.nome || "Token") + "</h3>";
    h += '<p class="mesa-ajuda">' + (t.dono ? window.Mesa.nomePapel(t.dono) : "Controlado pelo Mestre") + (t.ca ? " · CA " + t.ca : "") + (t.visivel ? "" : " · oculto dos jogadores") + "</p>";
    if (t.pv_max && (pode || t.dono)) {
      h += '<div class="mapa-pv-linha"><strong>' + (t.pv || 0) + " / " + t.pv_max + " PV</strong>" + (t.pv_temp ? " + " + t.pv_temp + " temporários" : "") + "</div>";
    }
    if (pode && t.pv_max) {
      h += '<form class="mesa-form mapa-pv-form" data-mapa-form="pv" data-id="' + t.id + '">' +
        '<div class="mesa-linha2"><label>Valor<input name="valor" type="number" inputmode="numeric" min="0" value="1"></label>' +
        '<label>PV temporários<input name="temp" type="number" inputmode="numeric" min="0" value="' + (t.pv_temp || 0) + '"></label></div>' +
        '<div class="mesa-acoes"><button type="submit" class="mesa-btn-sec mesa-perigo" name="op" value="dano">− Dano</button>' +
        '<button type="submit" class="mesa-btn-sec" name="op" value="cura">+ Cura</button>' +
        '<button type="submit" class="mesa-btn-sec" name="op" value="temp">Salvar temporários</button></div></form>';
    }
    if (pode) {
      h += '<div class="mapa-conds">' + CONDICOES.map(function (n) {
        var on = (t.condicoes || []).indexOf(n) >= 0;
        return '<button type="button" class="chip" aria-pressed="' + on + '" data-mapa="cond" data-id="' + t.id + '" data-v="' + esc(n) + '">' + esc(n) + "</button>";
      }).join("") + "</div>";
      h += '<form class="mesa-form" data-mapa-form="ini" data-id="' + t.id + '"><label>Iniciativa<div class="mapa-ini-linha"><input name="ini" type="number" step="0.1" inputmode="decimal" value="' + (t.iniciativa !== null && t.iniciativa !== undefined ? t.iniciativa : "") + '"><button type="submit" class="mesa-btn-sec">Salvar</button>' +
        (souMestre() ? '<button type="button" class="mesa-btn-sec" data-mapa="tirar-ini" data-id="' + t.id + '">Tirar da ordem</button>' : "") + "</div></label></form>";
    } else if ((t.condicoes || []).length) {
      h += '<p>' + t.condicoes.map(esc).join(", ") + "</p>";
    }
    if (souMestre()) {
      h += '<div class="mesa-acoes">' +
        '<button type="button" class="mesa-btn-sec" data-mapa="editar-token" data-id="' + t.id + '">Editar</button>' +
        '<button type="button" class="mesa-btn-sec" data-mapa="alternar-token" data-id="' + t.id + '">' + (t.visivel ? "Ocultar" : "Revelar") + "</button>" +
        (est.cena.em_combate ? '<button type="button" class="mesa-btn-sec" data-mapa="dar-vez" data-id="' + t.id + '">Dar a vez</button>' : "") +
        '<button type="button" class="mesa-btn-sec mesa-perigo" data-mapa="apagar-token" data-id="' + t.id + '">Apagar</button></div>';
    }
    return h;
  }

  function opcoesVagas(sel) {
    return '<option value="">Mestre (NPC ou monstro)</option>' + ["jogador1", "jogador2", "jogador3", "jogador4", "jogador5", "jogador6", "jogador7", "jogador8"].map(function (v) {
      return '<option value="' + v + '"' + (sel === v ? " selected" : "") + ">" + window.Mesa.nomePapel(v) + "</option>";
    }).join("");
  }

  function formToken(t) {
    var lib = est.biblioteca.tokens;
    return '<form class="mesa-form" data-mapa-form="token" data-id="' + (t ? t.id : "") + '">' +
      "<h3>" + (t ? "Editar token" : "Novo token") + "</h3>" +
      '<label>Nome<input name="nome" required maxlength="60" value="' + esc(t ? t.nome : "") + '"></label>' +
      '<label>Quem controla<select name="dono">' + opcoesVagas(t ? t.dono : "") + "</select></label>" +
      '<div class="mesa-linha2"><label>PV máximos<input name="pv_max" type="number" min="0" inputmode="numeric" value="' + (t && t.pv_max != null ? t.pv_max : "") + '"></label>' +
      '<label>PV atuais<input name="pv" type="number" min="0" inputmode="numeric" value="' + (t && t.pv != null ? t.pv : "") + '"></label></div>' +
      '<div class="mesa-linha2"><label>CA<input name="ca" type="number" min="0" inputmode="numeric" value="' + (t && t.ca != null ? t.ca : "") + '"></label>' +
      '<label>Tamanho<select name="tamanho">' + [["0.5", "Minúsculo"], ["1", "Pequeno/Médio"], ["2", "Grande"], ["3", "Enorme"], ["4", "Imenso"]].map(function (o) {
        return '<option value="' + o[0] + '"' + (String(t ? t.tamanho : 1) === o[0] ? " selected" : "") + ">" + o[1] + "</option>";
      }).join("") + "</select></label></div>" +
      '<label>Cor<div class="mapa-cores">' + CORES.map(function (c, i) {
        var marcado = t ? t.cor.toLowerCase() === c.toLowerCase() : i === 0;
        return '<label class="mapa-cor" style="--c:' + c + '"><input type="radio" name="cor" value="' + c + '"' + (marcado ? " checked" : "") + '><span></span></label>';
      }).join("") + "</div></label>" +
      '<label>Imagem' + '<select name="imagem"><option value="">Sem imagem (iniciais)</option>' + lib.map(function (x) {
        return '<option value="' + esc(x.arquivo) + '"' + (t && t.imagem === x.arquivo ? " selected" : "") + ">" + esc(x.nome) + "</option>";
      }).join("") + (t && t.imagem && !lib.some(function (x) { return x.arquivo === t.imagem; }) ? '<option value="' + esc(t.imagem) + '" selected>Imagem atual</option>' : "") + "</select></label>" +
      '<label class="mesa-check"><input name="visivel" type="checkbox"' + (!t || t.visivel ? " checked" : "") + "> Visível para os jogadores</label>" +
      '<div class="mesa-acoes"><button type="submit" class="mesa-btn">Salvar</button><button type="button" class="mesa-btn-sec" data-mapa="fechar">Cancelar</button></div></form>';
  }

  function formCena(c) {
    var lib = est.biblioteca.mapas;
    return '<form class="mesa-form" data-mapa-form="cena" data-id="' + (c ? c.id : "") + '">' +
      "<h3>" + (c ? "Ajustar cena" : "Nova cena") + "</h3>" +
      '<label>Nome<input name="nome" maxlength="80" value="' + esc(c ? c.nome : "") + '" placeholder="Ex.: Esgotos de Sharn"></label>' +
      '<label>Mapa da biblioteca<select name="mapa"><option value="">' + (lib.length ? "Escolha um mapa…" : "Biblioteca vazia: mande os mapas na conversa") + "</option>" +
      lib.map(function (m) { return '<option value="' + esc(m.arquivo) + '"' + (c && c.imagem === m.arquivo ? " selected" : "") + ">" + esc(m.nome) + "</option>"; }).join("") + "</select></label>" +
      '<label>…ou link de uma imagem<input name="url" type="url" inputmode="url" value="' + esc(c && !lib.some(function (m) { return m.arquivo === c.imagem; }) ? c.imagem : "") + '" placeholder="https://…"></label>' +
      '<div class="mapa-estimar"><button type="button" class="mesa-btn-sec" data-mapa="estimar">Estimar grid automaticamente</button><span class="mesa-ajuda" id="mapa-estimativa"></span></div>' +
      '<label class="mapa-fino">Ajuste fino do quadrado<input name="grid_fino" type="range" min="10" max="300" step="1" value="' + (c ? c.grid : 70) + '"></label>' +
      (c ? '<p class="mesa-ajuda">Segure e arraste o ajuste fino: a janela fica transparente e você vê o grid e os tokens mudando no mapa. Um personagem Médio deve ocupar um quadrado, mais ou menos do tamanho de uma porta.</p>' : "") +
      '<div class="mesa-linha2"><label>Tamanho do quadrado (px)<input name="grid" type="number" min="10" max="500" value="' + (c ? c.grid : 70) + '"></label>' +
      '<label>Metros por quadrado<input name="metros" type="number" step="0.5" min="0.5" value="' + (c ? c.metros : 1.5) + '"></label></div>' +
      '<div class="mesa-linha2"><label>Deslocar grid X (px)<input name="grid_x" type="number" value="' + (c ? c.grid_x : 0) + '"></label>' +
      '<label>Deslocar grid Y (px)<input name="grid_y" type="number" value="' + (c ? c.grid_y : 0) + '"></label></div>' +
      '<label class="mesa-check"><input name="grid_visivel" type="checkbox"' + (!c || c.grid_visivel ? " checked" : "") + "> Mostrar o grid</label>" +
      '<label class="mesa-check"><input name="nevoa_ligada" type="checkbox"' + (c && c.nevoa_ligada ? " checked" : "") + "> Névoa de guerra (o mapa começa escondido e você revela)</label>" +
      '<details class="mesa-nota"><summary>Importar cena do Foundry</summary>' +
      '<p class="mesa-ajuda">No Foundry, clique com o botão direito na cena → <em>Export Data</em>. Escolha o arquivo .json aqui: o grid, o tamanho e os tokens vêm junto. A imagem do mapa precisa estar na biblioteca (mande na conversa).</p>' +
      '<input type="file" name="foundry" accept=".json,application/json"></details>' +
      '<div class="mesa-acoes"><button type="submit" class="mesa-btn">Salvar</button><button type="button" class="mesa-btn-sec" data-mapa="fechar">Cancelar</button>' +
      (c ? '<button type="button" class="mesa-btn-sec" data-mapa="limpar-nevoa">Reiniciar névoa</button><button type="button" class="mesa-btn-sec mesa-perigo" data-mapa="apagar-cena">Apagar cena</button>' : "") + "</div></form>";
  }

  /* ---------- visor: arrastar, zoom, tokens, régua e névoa ---------- */
  var ponteiros = {}, arrasto = null, pinca = null;

  function aplicarVista() {
    var m = document.getElementById("mapa-mundo");
    if (m && est.vista) m.style.transform = "translate(" + est.vista.x + "px," + est.vista.y + "px) scale(" + est.vista.z + ")";
  }

  // Enquadra o mapa inteiro; com névoa, quem não é Mestre vê só a área já revelada
  function enquadrar() {
    var vp = document.getElementById("mapa-vp"), c = est.cena;
    if (!vp || !c) return;
    var area = { x: 0, y: 0, w: c.largura, h: c.altura };
    if (c.nevoa_ligada && !souMestre()) {
      var rev = (c.nevoa || []).filter(function (r) { return r.op === "+"; });
      if (rev.length) {
        var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        rev.forEach(function (r) { x0 = Math.min(x0, r.x); y0 = Math.min(y0, r.y); x1 = Math.max(x1, r.x + r.w); y1 = Math.max(y1, r.y + r.h); });
        area = { x: c.grid_x + (x0 - 1) * c.grid, y: c.grid_y + (y0 - 1) * c.grid, w: (x1 - x0 + 2) * c.grid, h: (y1 - y0 + 2) * c.grid };
      }
    }
    var z = Math.min(vp.clientWidth / area.w, vp.clientHeight / area.h, 2.5);
    est.vista = { z: z, x: (vp.clientWidth - area.w * z) / 2 - area.x * z, y: (vp.clientHeight - area.h * z) / 2 - area.y * z };
    aplicarVista();
  }

  function ligarVisor() {
    var vp = document.getElementById("mapa-vp");
    if (!vp) return;
    if (!est.vista) enquadrar(); else aplicarVista();
    vp.addEventListener("pointerdown", aoApertar);
    vp.addEventListener("pointermove", aoMover);
    vp.addEventListener("pointerup", aoSoltar);
    vp.addEventListener("pointercancel", aoSoltar);
    vp.addEventListener("wheel", function (ev) {
      ev.preventDefault();
      zoomEm(ev.clientX, ev.clientY, ev.deltaY < 0 ? 1.15 : 1 / 1.15);
    }, { passive: false });
  }

  function zoomEm(cx, cy, f) {
    var vp = document.getElementById("mapa-vp"), r = vp.getBoundingClientRect(), v = est.vista;
    var nz = Math.max(0.1, Math.min(5, v.z * f)); f = nz / v.z;
    var px = cx - r.left, py = cy - r.top;
    v.x = px - (px - v.x) * f; v.y = py - (py - v.y) * f; v.z = nz;
    aplicarVista();
  }

  function paraMundo(cx, cy) {
    var r = document.getElementById("mapa-vp").getBoundingClientRect(), v = est.vista;
    return { x: (cx - r.left - v.x) / v.z, y: (cy - r.top - v.y) / v.z };
  }
  function paraCelula(p) {
    var c = est.cena;
    return { x: Math.floor((p.x - c.grid_x) / c.grid), y: Math.floor((p.y - c.grid_y) / c.grid) };
  }
  function distancia(a, b) {     // regra 2024: diagonal conta como 1 quadrado
    var q = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y));
    return { q: q, m: q * est.cena.metros };
  }
  function fmtM(m) { return (Math.round(m * 10) / 10).toString().replace(".", ",") + " m"; }

  function podeMover(t) {
    if (modoTela || !t) return false;
    if (souMestre()) return true;
    if (t.dono !== meuPapel()) return false;
    return !est.cena.em_combate || est.cena.turno === t.id;
  }

  function aoApertar(ev) {
    var vp = ev.currentTarget;
    ponteiros[ev.pointerId] = { x: ev.clientX, y: ev.clientY };
    vp.setPointerCapture(ev.pointerId);
    var ids = Object.keys(ponteiros);
    if (ids.length === 2) {         // pinça: cancela qualquer arrasto
      if (arrasto && arrasto.el) devolverToken();
      arrasto = null; limparRegua();
      var a = ponteiros[ids[0]], b = ponteiros[ids[1]];
      pinca = { d: Math.hypot(a.x - b.x, a.y - b.y), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
      return;
    }
    if (ids.length > 2) return;
    var elT = ev.target.closest("[data-token]");
    var p = paraMundo(ev.clientX, ev.clientY);
    if (elT && est.ferramenta === "mover") {
      var t = token(elT.getAttribute("data-token"));
      arrasto = { tipo: "token", t: t, el: elT, ini: { x: ev.clientX, y: ev.clientY }, origem: { x: t.x, y: t.y }, moveu: false, pode: podeMover(t) };
      return;
    }
    if (est.ferramenta === "regua") { arrasto = { tipo: "regua", a: p }; return; }
    if ((est.ferramenta === "revelar" || est.ferramenta === "cobrir") && souMestre()) { arrasto = { tipo: "nevoa", a: p }; return; }
    arrasto = { tipo: "pan", ini: { x: ev.clientX, y: ev.clientY }, v: { x: est.vista.x, y: est.vista.y } };
  }

  function aoMover(ev) {
    if (!ponteiros[ev.pointerId]) return;
    ponteiros[ev.pointerId] = { x: ev.clientX, y: ev.clientY };
    var ids = Object.keys(ponteiros);
    if (ids.length === 2 && pinca) {
      var a = ponteiros[ids[0]], b = ponteiros[ids[1]];
      var d = Math.hypot(a.x - b.x, a.y - b.y), cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
      est.vista.x += cx - pinca.cx; est.vista.y += cy - pinca.cy;
      zoomEm(cx, cy, d / pinca.d);
      pinca = { d: d, cx: cx, cy: cy };
      return;
    }
    if (!arrasto) return;
    var p = paraMundo(ev.clientX, ev.clientY), c = est.cena;
    if (arrasto.tipo === "pan") {
      est.vista.x = arrasto.v.x + ev.clientX - arrasto.ini.x; est.vista.y = arrasto.v.y + ev.clientY - arrasto.ini.y;
      aplicarVista();
    } else if (arrasto.tipo === "token") {
      if (Math.hypot(ev.clientX - arrasto.ini.x, ev.clientY - arrasto.ini.y) < 6 && !arrasto.moveu) return;
      if (!arrasto.pode) { arrasto.bloqueado = true; return; }
      arrasto.moveu = true;
      var t = arrasto.t, meio = t.tamanho * c.grid / 2;
      arrasto.el.style.left = (p.x - meio) + "px"; arrasto.el.style.top = (p.y - meio) + "px";
      arrasto.el.classList.add("arrastando");
      var dest = destinoToken(p, t);
      var dd = distancia(arrasto.origem, dest);
      desenharRegua(centroCelula(arrasto.origem, t), centroCelula(dest, t), fmtM(dd.m) + " · " + dd.q + (dd.q === 1 ? " quadrado" : " quadrados"));
    } else if (arrasto.tipo === "regua") {
      var ca = paraCelula(arrasto.a), cb = paraCelula(p), dr = distancia(ca, cb);
      desenharRegua(centroCelula(ca, null), centroCelula(cb, null), fmtM(dr.m));
    } else if (arrasto.tipo === "nevoa") {
      var r = retCelulas(arrasto.a, p);
      desenharRetNevoa(r);
    }
  }

  function aoSoltar(ev) {
    delete ponteiros[ev.pointerId];
    if (Object.keys(ponteiros).length < 2) pinca = null;
    if (!arrasto) return;
    var a = arrasto; arrasto = null;
    var p = paraMundo(ev.clientX, ev.clientY);
    if (a.tipo === "token") {
      limparRegua();
      if (!a.moveu) {
        if (a.bloqueado) G.avisar(a.t.dono === meuPapel() ? "Espere o seu turno para mover." : "Esse token não é seu.");
        else { est.painel = { tipo: "token", id: a.t.id }; redesenharPainel(); }
        return;
      }
      var dest = destinoToken(p, a.t);
      a.t.x = dest.x; a.t.y = dest.y; a.el.classList.remove("arrastando"); posicionarTokens();
      var pr = souMestre() ? q(ctx.sb.from("tokens").update({ x: dest.x, y: dest.y }).eq("id", a.t.id))
                           : rpc("mover_token", { p_token: a.t.id, p_x: dest.x, p_y: dest.y });
      pr.catch(function (e) { a.t.x = a.origem.x; a.t.y = a.origem.y; posicionarTokens(); erro(e); });
    } else if (a.tipo === "regua") {
      setTimeout(limparRegua, 1500);
    } else if (a.tipo === "nevoa") {
      var r = retCelulas(a.a, p);
      limparRegua();
      r.op = est.ferramenta === "revelar" ? "+" : "-";
      var nev = (est.cena.nevoa || []).concat([r]);
      est.cena.nevoa = nev; desenharNevoa();
      q(ctx.sb.from("cenas").update({ nevoa: nev }).eq("id", est.cena.id)).catch(erro);
    }
  }

  function devolverToken() { if (arrasto && arrasto.el) { arrasto.el.classList.remove("arrastando"); posicionarTokens(); } }

  function destinoToken(p, t) {
    var c = est.cena, meio = t.tamanho * c.grid / 2;
    var x = (p.x - meio - c.grid_x) / c.grid, y = (p.y - meio - c.grid_y) / c.grid;
    return { x: Math.round(x), y: Math.round(y) };
  }
  function centroCelula(cel, t) {
    var c = est.cena, s = t ? t.tamanho : 1;
    return { x: c.grid_x + (cel.x + s / 2) * c.grid, y: c.grid_y + (cel.y + s / 2) * c.grid };
  }
  function retCelulas(a, b) {
    var ca = paraCelula(a), cb = paraCelula(b);
    return { x: Math.min(ca.x, cb.x), y: Math.min(ca.y, cb.y), w: Math.abs(ca.x - cb.x) + 1, h: Math.abs(ca.y - cb.y) + 1 };
  }

  function desenharRegua(a, b, texto) {
    var s = document.getElementById("mapa-regua");
    if (!s) return;
    var z = est.vista.z, f = 14 / z;
    s.innerHTML = '<line x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '" stroke="#E2B85A" stroke-width="' + (4 / z) + '" stroke-linecap="round" stroke-dasharray="' + (10 / z) + " " + (6 / z) + '"/>' +
      '<circle cx="' + a.x + '" cy="' + a.y + '" r="' + (6 / z) + '" fill="#E2B85A"/>' +
      '<g transform="translate(' + b.x + "," + (b.y - 26 / z) + ')"><rect x="' + (-texto.length * f * 0.3 - 8 / z) + '" y="' + (-f) + '" width="' + (texto.length * f * 0.6 + 16 / z) + '" height="' + (f * 1.6) + '" rx="' + (6 / z) + '" fill="#17202B"/>' +
      '<text x="0" y="' + (f * 0.25) + '" text-anchor="middle" font-size="' + f + '" fill="#F7F0E1" font-family="sans-serif">' + esc(texto) + "</text></g>";
  }
  function desenharRetNevoa(r) {
    var s = document.getElementById("mapa-regua"), c = est.cena;
    s.innerHTML = '<rect x="' + (c.grid_x + r.x * c.grid) + '" y="' + (c.grid_y + r.y * c.grid) + '" width="' + (r.w * c.grid) + '" height="' + (r.h * c.grid) +
      '" fill="' + (est.ferramenta === "revelar" ? "rgba(226,184,90,.25)" : "rgba(0,0,0,.45)") + '" stroke="#E2B85A" stroke-width="' + (2 / est.vista.z) + '"/>';
  }
  function limparRegua() { var s = document.getElementById("mapa-regua"); if (s) s.innerHTML = ""; }

  function redesenharPainel() {
    var velho = raiz.querySelector(".mapa-folha");
    if (velho) velho.remove();
    raiz.insertAdjacentHTML("beforeend", painelHTML());
  }

  /* ---------- ações ---------- */
  function recarregarTudo(msg) {
    return carregarCenas().then(carregarTokens).then(function () { desenhar(); if (msg) G.avisar(msg); }).catch(erro);
  }

  function aoClicar(ev) {
    if (!raiz || !raiz.contains(ev.target)) return;
    var f = ev.target.closest("[data-ferr]");
    if (f) { est.ferramenta = f.getAttribute("data-ferr"); raiz.querySelectorAll("[data-ferr]").forEach(function (b) { b.setAttribute("aria-pressed", b === f); }); return; }
    var li = ev.target.closest("[data-token-lista]");
    if (li) { est.painel = { tipo: "token", id: li.getAttribute("data-token-lista") }; redesenharPainel(); return; }
    var b = ev.target.closest("[data-mapa]");
    if (!b || b.tagName === "SELECT") return;
    var a = b.getAttribute("data-mapa"), id = b.getAttribute("data-id"), c = est.cena;
    if (a === "fechar") { if (gridOriginal) { desfazerPrevia(); est.painel = null; desenhar(); return; } est.painel = null; redesenharPainel(); }
    else if (a === "centralizar") enquadrar();
    else if (a === "nova-cena") { est.painel = { tipo: "nova-cena" }; redesenharPainel(); }
    else if (a === "editar-cena") { est.painel = { tipo: "cena" }; redesenharPainel(); }
    else if (a === "novo-token") { est.painel = { tipo: "novo-token" }; redesenharPainel(); }
    else if (a === "editar-token") { est.painel = { tipo: "editar-token", id: id }; redesenharPainel(); }
    else if (a === "ativar") q(ctx.sb.from("cenas").update({ ativa: true }).eq("id", c.id)).then(function () { return recarregarTudo("Os jogadores agora veem esta cena."); }).catch(erro);
    else if (a === "iniciar") {
      var ordem = ordemIniciativa();
      q(ctx.sb.from("cenas").update({ em_combate: true, rodada: 1, turno: ordem[0].id }).eq("id", c.id)).then(function () { return recarregarTudo("Combate iniciado!"); }).catch(erro);
    }
    else if (a === "encerrar") q(ctx.sb.from("cenas").update({ em_combate: false, rodada: 0, turno: null }).eq("id", c.id)).then(function () { return recarregarTudo("Combate encerrado."); }).catch(erro);
    else if (a === "proximo" || a === "passar") rpc("passar_turno", { p_cena: c.id }).then(function () { return recarregarTudo(); }).catch(erro);
    else if (a === "dar-vez") q(ctx.sb.from("cenas").update({ turno: id }).eq("id", c.id)).then(function () { est.painel = null; return recarregarTudo(); }).catch(erro);
    else if (a === "alternar-token") { var t = token(id); q(ctx.sb.from("tokens").update({ visivel: !t.visivel }).eq("id", id)).then(function () { return recarregarTudo(t.visivel ? "Token oculto." : "Token revelado."); }).catch(erro); }
    else if (a === "apagar-token") { if (confirmar("Apagar este token?")) q(ctx.sb.from("tokens").delete().eq("id", id)).then(function () { est.painel = null; return recarregarTudo("Token apagado."); }).catch(erro); }
    else if (a === "tirar-ini") q(ctx.sb.from("tokens").update({ iniciativa: null }).eq("id", id)).then(function () { return recarregarTudo(); }).catch(erro);
    else if (a === "cond") {
      var tk = token(id), lista = (tk.condicoes || []).slice(), n = b.getAttribute("data-v"), i = lista.indexOf(n);
      if (i >= 0) lista.splice(i, 1); else lista.push(n);
      tk.condicoes = lista; b.setAttribute("aria-pressed", i < 0); posicionarTokens();
      salvarMeuToken(tk, { condicoes: lista });
    }
    else if (a === "estimar") {
      var form = b.closest("form"), u = String(form.url.value || "").trim() || form.mapa.value || (c && c.imagem);
      var saida = document.getElementById("mapa-estimativa");
      if (!u) { G.avisar("Escolha um mapa primeiro."); return; }
      saida.textContent = "Analisando o mapa…"; b.disabled = true;
      estimarGrid(u).then(function (r) {
        form.grid.value = r.grid; form.grid_fino.value = r.grid; form.grid_x.value = r.x; form.grid_y.value = r.y;
        saida.textContent = textoEstimativa(r);
        previa(form);
      }).catch(function (e) { saida.textContent = e.message; }).then(function () { b.disabled = false; });
    }
    else if (a === "limpar-nevoa") q(ctx.sb.from("cenas").update({ nevoa: [] }).eq("id", c.id)).then(function () { est.painel = null; return recarregarTudo("Névoa reiniciada: tudo escondido de novo."); }).catch(erro);
    else if (a === "apagar-cena") { if (confirmar("Apagar esta cena e todos os tokens dela?")) q(ctx.sb.from("cenas").delete().eq("id", c.id)).then(function () { est.painel = null; est.cena = null; return recarregarTudo("Cena apagada."); }).catch(erro); }
  }

  function salvarMeuToken(t, campos) {
    var p = souMestre()
      ? q(ctx.sb.from("tokens").update(campos).eq("id", t.id))
      : rpc("ajustar_meu_token", { p_token: t.id, p_pv: campos.pv !== undefined ? campos.pv : null, p_pv_temp: campos.pv_temp !== undefined ? campos.pv_temp : null, p_condicoes: campos.condicoes || null });
    return p.catch(erro);
  }

  function aoEnviar(ev) {
    var f = ev.target.closest("form[data-mapa-form]");
    if (!f || !raiz || !raiz.contains(f)) return;
    ev.preventDefault();
    var d = new FormData(f), tipo = f.getAttribute("data-mapa-form"), id = f.getAttribute("data-id");
    var num = function (k) { var v = d.get(k); return v === "" || v === null ? null : Number(v); };
    if (tipo === "pv") {
      var t = token(id), op = ev.submitter ? ev.submitter.value : "dano", v = Math.max(0, num("valor") || 0);
      var pv = t.pv || 0, temp = t.pv_temp || 0;
      if (op === "dano") { var abs = Math.min(temp, v); temp -= abs; pv = Math.max(0, pv - (v - abs)); }
      else if (op === "cura") pv = Math.min(t.pv_max || pv + v, pv + v);
      else temp = Math.max(0, num("temp") || 0);
      t.pv = pv; t.pv_temp = temp; posicionarTokens(); redesenharPainel();
      salvarMeuToken(t, { pv: pv, pv_temp: temp });
    } else if (tipo === "ini") {
      var valor = num("ini");
      var p = souMestre() ? q(ctx.sb.from("tokens").update({ iniciativa: valor }).eq("id", id)) : rpc("minha_iniciativa", { p_token: id, p_valor: valor });
      p.then(function () { return recarregarTudo("Iniciativa salva."); }).catch(erro);
    } else if (tipo === "token") {
      var tok = {
        nome: String(d.get("nome") || "").trim(), dono: d.get("dono") || null,
        pv_max: num("pv_max"), pv: num("pv") !== null ? num("pv") : num("pv_max"), ca: num("ca"),
        tamanho: Number(d.get("tamanho") || 1), cor: d.get("cor") || CORES[0], imagem: d.get("imagem") || "", visivel: !!d.get("visivel")
      };
      var pr;
      if (id) pr = q(ctx.sb.from("tokens").update(tok).eq("id", id));
      else {
        var vp = document.getElementById("mapa-vp"), r = vp.getBoundingClientRect();
        var centro = paraCelula(paraMundo(r.left + r.width / 2, r.top + r.height / 2));
        tok.cena = est.cena.id; tok.campanha = est.cena.campanha; tok.x = Math.max(0, centro.x); tok.y = Math.max(0, centro.y);
        pr = q(ctx.sb.from("tokens").insert(tok));
      }
      pr.then(function () { est.painel = null; return recarregarTudo(id ? "Token atualizado." : "Token criado no centro da tela. Arraste para posicionar."); }).catch(erro);
    } else if (tipo === "cena") {
      var arquivo = f.querySelector('input[name="foundry"]').files[0];
      (arquivo ? arquivo.text().then(function (txt) { return JSON.parse(txt); }) : Promise.resolve(null)).then(function (foundry) {
        return salvarCena(id, d, foundry);
      }).catch(function (e) { erro(e && e.name === "SyntaxError" ? "Esse arquivo não é um JSON de cena do Foundry." : e); });
    }
  }

  /* ----- Estimativa do grid a partir da imagem -----
     1) procura linhas de grid repetidas (autocorrelação das bordas nas duas direções);
     2) se não achar, usa tamanhos comuns de exportação que dividem bem a imagem. */
  var TAMANHOS_COMUNS = [50, 56, 60, 64, 70, 72, 75, 80, 90, 96, 100, 110, 112, 120, 128, 140, 144, 150, 160, 180, 200, 240, 256, 280, 300];

  function carregarImagem(u) {
    return new Promise(function (ok, falha) {
      var i = new Image(); i.crossOrigin = "anonymous";
      i.onload = function () { ok(i); }; i.onerror = function () { falha(new Error("Não consegui abrir a imagem do mapa.")); };
      i.src = urlImg(u);
    });
  }

  function perfil(cinza, w, h, horizontal) {
    // soma da diferença entre pixels vizinhos ao longo de cada coluna (ou linha)
    var n = horizontal ? w : h, p = new Float64Array(n);
    if (horizontal) { for (var y = 0; y < h; y++) for (var x = 1; x < w; x++) p[x] += Math.abs(cinza[y * w + x] - cinza[y * w + x - 1]); }
    else { for (var y2 = 1; y2 < h; y2++) for (var x2 = 0; x2 < w; x2++) p[y2] += Math.abs(cinza[y2 * w + x2] - cinza[(y2 - 1) * w + x2]); }
    // tira a tendência (média móvel) para sobrar só o que se repete
    var r = 6, out = new Float64Array(n);
    for (var i = 0; i < n; i++) {
      var a = Math.max(0, i - r), b = Math.min(n - 1, i + r), soma = 0;
      for (var k = a; k <= b; k++) soma += p[k];
      out[i] = Math.max(0, p[i] - soma / (b - a + 1));
    }
    return out;
  }

  function periodo(pf, min, max) {
    var n = pf.length, media = 0, i;
    for (i = 0; i < n; i++) media += pf[i]; media /= n;
    var c = new Float64Array(max + 1), var0 = 0;
    for (i = 0; i < n; i++) var0 += (pf[i] - media) * (pf[i] - media);
    if (!var0) return null;
    for (var L = min; L <= max; L++) {
      var s = 0;
      for (i = 0; i + L < n; i++) s += (pf[i] - media) * (pf[i + L] - media);
      c[L] = s / var0 * n / (n - L);
    }
    var melhor = min;
    for (L = min; L <= max; L++) if (c[L] > c[melhor]) melhor = L;
    if (c[melhor] < 0.12) return null;
    // o pico mais alto às vezes é 2 ou 3 quadrados; testa as frações e fica com a menor que ainda é um pico forte
    var base = melhor;
    for (var k = 6; k >= 2; k--) {
      var alvo = base / k;
      if (alvo < min) continue;
      var a0 = Math.max(min, Math.floor(alvo) - 2), a1 = Math.min(max, Math.ceil(alvo) + 2), pico = a0;
      for (var t = a0; t <= a1; t++) if (c[t] > c[pico]) pico = t;
      if (c[pico] >= 0.5 * c[base] && c[pico] >= (c[pico - 1] || 0) && c[pico] >= (c[pico + 1] || 0)) { melhor = pico; break; }
    }
    // refina com interpolação parabólica
    var y0 = c[melhor - 1] || 0, y1 = c[melhor], y2 = c[melhor + 1] || 0, d = y0 - 2 * y1 + y2;
    var fino = d ? melhor + 0.5 * (y0 - y2) / d : melhor;
    return { p: fino, forca: c[melhor] };
  }

  function fase(pf, P) {
    var bins = Math.max(1, Math.round(P)), acc = new Float64Array(bins);
    for (var i = 0; i < pf.length; i++) acc[Math.round(i % P) % bins] += pf[i];
    var m = 0; for (var k = 1; k < bins; k++) if (acc[k] > acc[m]) m = k;
    return m;
  }

  function estimarGrid(u) {
    return carregarImagem(u).then(function (img) {
      var W = img.naturalWidth, H = img.naturalHeight;
      var esc = Math.min(1, 1600 / Math.max(W, H)), w = Math.round(W * esc), h = Math.round(H * esc);
      var resultado = null;
      try {
        var cv = document.createElement("canvas"); cv.width = w; cv.height = h;
        var g = cv.getContext("2d"); g.drawImage(img, 0, 0, w, h);
        var dados = g.getImageData(0, 0, w, h).data, cinza = new Float32Array(w * h);
        for (var i = 0, j = 0; i < dados.length; i += 4, j++) cinza[j] = dados[i] * 0.3 + dados[i + 1] * 0.59 + dados[i + 2] * 0.11;
        var px = perfil(cinza, w, h, true), py = perfil(cinza, w, h, false);
        var min = Math.max(8, Math.round(20 * esc)), max = Math.min(Math.round(320 * esc), Math.floor(Math.min(w, h) / 3));
        var ax = periodo(px, min, max), ay = periodo(py, min, max);
        // se um eixo achou o dobro/triplo do outro, fica com o menor
        if (ax && ay) {
          var maior = Math.max(ax.p, ay.p), menor = Math.min(ax.p, ay.p), razao = maior / menor;
          if (razao > 1.5 && Math.abs(razao - Math.round(razao)) < 0.06) { if (ax.p > ay.p) ax.p = ay.p; else ay.p = ax.p; }
        }
        if (ax && ay && Math.abs(ax.p - ay.p) / Math.max(ax.p, ay.p) < 0.06) {
          var P = (ax.p + ay.p) / 2;
          resultado = { grid: Math.round(P / esc), x: Math.round(fase(px, P) / esc), y: Math.round(fase(py, P) / esc),
            metodo: "linhas", confianca: Math.min(ax.forca, ay.forca) > 0.3 ? "alta" : "média" };
        }
      } catch (e) { /* imagem de outro site sem permissão de leitura: cai na estimativa por tamanho */ }
      if (!resultado) {
        var melhor = null;
        TAMANHOS_COMUNS.forEach(function (t) {
          var cw = W / t, ch = H / t, resto = Math.abs(cw - Math.round(cw)) + Math.abs(ch - Math.round(ch));
          var maior = Math.max(cw, ch);
          if (maior < 8 || maior > 70) return;
          var nota = resto * 4 + Math.abs(maior - 28) / 28;          // divide certinho e dá um mapa de ~20 a 40 quadrados
          if (!melhor || nota < melhor.nota) melhor = { t: t, nota: nota, resto: resto };
        });
        var t = melhor ? melhor.t : Math.round(Math.max(W, H) / 30);
        resultado = { grid: t, x: 0, y: 0, metodo: "tamanho", confianca: melhor && melhor.resto < 0.02 ? "média" : "baixa" };
      }
      resultado.largura = W; resultado.altura = H;
      resultado.colunas = Math.round(W / resultado.grid); resultado.linhas = Math.round(H / resultado.grid);
      return resultado;
    });
  }

  function textoEstimativa(r) {
    var base = r.grid + " px por quadrado (" + r.colunas + " × " + r.linhas + " quadrados)";
    if (r.metodo === "linhas") return "Encontrei as linhas do grid no mapa: " + base + ". Confiança " + r.confianca + ".";
    return "O mapa não tem linhas de grid visíveis; pelo tamanho da imagem, o provável é " + base + ". Confira com o ajuste fino.";
  }

  function medirImagem(u) {
    return new Promise(function (ok) {
      if (!u) return ok(null);
      var i = new Image(); i.onload = function () { ok({ w: i.naturalWidth, h: i.naturalHeight }); }; i.onerror = function () { ok(null); }; i.src = urlImg(u);
    });
  }

  // Lê o JSON de cena do Foundry (v9 a v12)
  function lerFoundry(j) {
    var grid = typeof j.grid === "object" && j.grid ? (j.grid.size || 100) : (j.grid || 100);
    var w = j.width || 0, h = j.height || 0, pad = j.padding != null ? j.padding : 0.25;
    var px = Math.ceil(w * pad / grid) * grid, py = Math.ceil(h * pad / grid) * grid;
    var img = (j.background && j.background.src) || j.img || "";
    var offX = (j.background && j.background.offsetX) || j.shiftX || 0, offY = (j.background && j.background.offsetY) || j.shiftY || 0;
    var tokens = (j.tokens || []).map(function (t) {
      var src = (t.texture && t.texture.src) || t.img || "";
      return { nome: t.name || "Token", x: Math.round((t.x - px) / grid), y: Math.round((t.y - py) / grid),
        tamanho: t.width || 1, visivel: !t.hidden, cor: t.disposition === 1 ? "#3B6647" : t.disposition === -1 ? "#9C2F2A" : "#4B5966", arquivoOriginal: src };
    });
    return { nome: j.name, largura: w, altura: h, grid: grid, grid_x: (-offX % grid + grid) % grid, grid_y: (-offY % grid + grid) % grid, imagemOriginal: img, tokens: tokens };
  }

  function nomeArquivo(u) { return String(u || "").split("/").pop().split("?")[0].toLowerCase(); }

  function salvarCena(id, d, foundry) {
    gridOriginal = null;
    var imagem = String(d.get("url") || "").trim() || d.get("mapa") || "";
    var fd = foundry ? lerFoundry(foundry) : null;
    if (fd && !imagem) {
      var achado = est.biblioteca.mapas.filter(function (m) { return nomeArquivo(m.arquivo).replace(/\.[^.]+$/, "") === nomeArquivo(fd.imagemOriginal).replace(/\.[^.]+$/, ""); })[0];
      if (achado) imagem = achado.arquivo;
    }
    var lib = est.biblioteca.mapas.filter(function (m) { return m.arquivo === imagem; })[0];
    var cena = {
      nome: String(d.get("nome") || "").trim() || (fd && fd.nome) || "Cena",
      imagem: imagem,
      grid: fd ? fd.grid : Number(d.get("grid") || (lib && lib.grid) || 70),
      grid_x: fd ? fd.grid_x : Number(d.get("grid_x") || 0),
      grid_y: fd ? fd.grid_y : Number(d.get("grid_y") || 0),
      metros: Number(d.get("metros") || 1.5),
      grid_visivel: !!d.get("grid_visivel"),
      nevoa_ligada: !!d.get("nevoa_ligada")
    };
    if (lib && !fd && !id) { cena.grid = Number(d.get("grid")) || lib.grid || cena.grid; }
    return medirImagem(imagem).then(function (tam) {
      if (fd && fd.largura) { cena.largura = fd.largura; cena.altura = fd.altura; }
      else if (tam) { cena.largura = tam.w; cena.altura = tam.h; }
      else if (lib) { cena.largura = lib.largura; cena.altura = lib.altura; }
      if (fd && !imagem) G.avisar("Cena importada, mas a imagem “" + nomeArquivo(fd.imagemOriginal) + "” não está na biblioteca. Mande o mapa na conversa.");
      if (id) return q(ctx.sb.from("cenas").update(cena).eq("id", id).select());
      cena.campanha = ctx.atual.id;
      return q(ctx.sb.from("cenas").insert(cena).select());
    }).then(function (r) {
      var nova = r && r[0];
      est.cena = nova || est.cena; est.vista = null;
      if (fd && nova && fd.tokens.length) {
        var toks = fd.tokens.map(function (t) {
          var img = est.biblioteca.tokens.filter(function (x) { return nomeArquivo(x.arquivo) === nomeArquivo(t.arquivoOriginal); })[0];
          return { cena: nova.id, campanha: nova.campanha, nome: t.nome, x: t.x, y: t.y, tamanho: Math.max(0.5, Math.min(8, t.tamanho)), visivel: t.visivel, cor: t.cor, imagem: img ? img.arquivo : "" };
        });
        return q(ctx.sb.from("tokens").insert(toks)).then(function () { return nova; });
      }
      return nova;
    }).then(function () { est.painel = null; return recarregarTudo(foundry ? "Cena do Foundry importada." : "Cena salva."); });
  }

  // Pré-visualização: aplica o grid do formulário na cena aberta, sem salvar
  var gridOriginal = null;
  function previa(form) {
    var c = est.cena;
    if (!c || !form || form.getAttribute("data-id") !== c.id) return;
    if (!gridOriginal) gridOriginal = { grid: c.grid, grid_x: c.grid_x, grid_y: c.grid_y };
    c.grid = Math.max(10, Number(form.grid.value) || c.grid);
    c.grid_x = Number(form.grid_x.value) || 0; c.grid_y = Number(form.grid_y.value) || 0;
    var velha = raiz.querySelector(".mapa-grade");
    if (velha) velha.outerHTML = gradeSVG(c);
    posicionarTokens(); desenharNevoa();
  }
  function desfazerPrevia() {
    if (gridOriginal && est.cena) { Object.assign(est.cena, gridOriginal); }
    gridOriginal = null;
  }

  document.addEventListener("input", function (ev) {
    var t = ev.target, f = t.form;
    if (!f || !raiz || !raiz.contains(f) || f.getAttribute("data-mapa-form") !== "cena") return;
    if (t.name === "grid_fino") f.grid.value = t.value;
    if (t.name === "grid") f.grid_fino.value = t.value;
    if (["grid", "grid_fino", "grid_x", "grid_y"].indexOf(t.name) >= 0) previa(f);
  });

  // Enquanto arrasta o ajuste fino, a janela fica transparente para mostrar o mapa
  function espiar(ev, on) {
    var t = ev.target;
    if (!t || t.name !== "grid_fino" || !raiz || !raiz.contains(t)) return;
    var folha = t.closest(".mapa-folha"); if (folha) folha.classList.toggle("espiar", on);
  }
  document.addEventListener("pointerdown", function (ev) { espiar(ev, true); });
  ["pointerup", "pointercancel", "change"].forEach(function (n) {
    document.addEventListener(n, function () { var f = raiz && raiz.querySelector(".mapa-folha.espiar"); if (f) f.classList.remove("espiar"); });
  });

  function aoMudar(ev) {
    var t = ev.target;
    if (!raiz || !raiz.contains(t)) return;
    if (t.getAttribute("data-mapa") === "escolher-cena") {
      est.cena = est.cenas.filter(function (c) { return c.id === t.value; })[0] || null;
      est.vista = null; est.painel = null;
      carregarTokens().then(desenhar).catch(erro);
    } else if (t.name === "mapa" && t.form && t.form.getAttribute("data-mapa-form") === "cena") {
      var m = est.biblioteca.mapas.filter(function (x) { return x.arquivo === t.value; })[0];
      if (m && !m.grid) { var be = t.form.querySelector('[data-mapa="estimar"]'); if (be) be.click(); }
      if (m) {
        if (m.grid) { t.form.grid.value = m.grid; t.form.grid_fino.value = m.grid; }
        if (m.grid_x != null) t.form.grid_x.value = m.grid_x;
        if (m.grid_y != null) t.form.grid_y.value = m.grid_y;
        if (!t.form.nome.value) t.form.nome.value = m.nome;
      }
    }
  }

  var pendente = null;
  function confirmar(texto) {
    if (pendente === texto) { pendente = null; return true; }
    pendente = texto; G.avisar(texto + " Toque de novo para confirmar.");
    setTimeout(function () { if (pendente === texto) pendente = null; }, 5000);
    return false;
  }

  document.addEventListener("click", aoClicar);
  document.addEventListener("submit", aoEnviar);
  document.addEventListener("change", aoMudar);
  window.addEventListener("resize", function () { if (modoTela && est.cena) enquadrar(); });

  window.MapaMesa = { render: render, estimarGrid: estimarGrid };
})();
