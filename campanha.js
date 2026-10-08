/* Grimório de Mesa — abas Campanha e Missões.
   Fala com o Supabase (login por código + senha, sessões, missões).
   Precisa de config.js com SUPABASE_URL e SUPABASE_CHAVE (chave pública "anon"). */
(function () {
  "use strict";

  var G = window.Grimorio;              // formatar, avisar, esc (expostos pelo app.js)
  var esc = G.esc;
  var CFG = window.GRIMORIO_CONFIG || {};
  var SDK = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

  var sb = null;                         // cliente Supabase
  var carregandoSDK = null;
  var canal = null;                      // assinatura de tempo real
  var raiz = null;                       // elemento onde a aba é desenhada
  var abaAtual = "campanha";

  var est = {
    campanhas: [],                       // minhas_campanhas()
    atual: null,                         // { id, codigo, nome, papel, nome_vaga }
    sessoes: [], notasSessao: {},
    missoes: [], notasMissao: {},
    grupo: [],
    editando: null,                      // { tipo: "sessao"|"missao"|"vaga", id }
    entrada: { codigo: "", vagas: null },
    offline: false,
    erro: ""
  };

  function ler(k, padrao) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : padrao; } catch (e) { return padrao; } }
  function gravar(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  function nomePapel(p) { return p === "mestre" ? "Mestre" : "Jogador " + String(p).replace("jogador", ""); }
  function souMestre() { return est.atual && est.atual.papel === "mestre"; }
  function dataBR(d) { if (!d) return ""; var p = String(d).split("-"); return p.length === 3 ? p[2] + "/" + p[1] + "/" + p[0] : d; }
  function msgErro(e) {
    var m = (e && (e.message || e.error_description)) || String(e || "Erro desconhecido");
    if (/Failed to fetch|NetworkError|network/i.test(m)) return "Sem conexão com a internet.";
    if (/anonymous/i.test(m)) return "O login anônimo está desligado no Supabase (Authentication → Allow anonymous sign-ins).";
    return m;
  }

  /* ---------- conexão ---------- */
  function carregarSDK() {
    if (window.supabase && window.supabase.createClient) return Promise.resolve();
    if (carregandoSDK) return carregandoSDK;
    carregandoSDK = new Promise(function (ok, falha) {
      var s = document.createElement("script");
      s.src = SDK; s.onload = ok; s.onerror = function () { carregandoSDK = null; falha(new Error("Failed to fetch")); };
      document.head.appendChild(s);
    });
    return carregandoSDK;
  }

  function conectar() {
    if (sb) return Promise.resolve(sb);
    return carregarSDK().then(function () {
      sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_CHAVE, {
        auth: { persistSession: true, autoRefreshToken: true, storageKey: "grimorio-auth" }
      });
      return sb.auth.getSession();
    }).then(function (r) {
      if (r.data && r.data.session) return sb;
      return sb.auth.signInAnonymously().then(function (r2) { if (r2.error) throw r2.error; return sb; });
    });
  }

  function rpc(nome, args) {
    return sb.rpc(nome, args || {}).then(function (r) { if (r.error) throw r.error; return r.data; });
  }
  function q(promessa) { return promessa.then(function (r) { if (r.error) throw r.error; return r.data; }); }

  /* ---------- dados ---------- */
  function chaveCache() { return "grimorio:mesa:" + (est.atual ? est.atual.id : ""); }

  function carregarCampanhas() {
    return rpc("minhas_campanhas").then(function (lista) {
      est.campanhas = lista || [];
      var salva = ler("grimorio:campanha", null);
      est.atual = est.campanhas.filter(function (c) { return salva && c.id === salva; })[0] || est.campanhas[0] || null;
      if (est.atual) gravar("grimorio:campanha", est.atual.id);
    });
  }

  function carregarDados() {
    if (!est.atual) return Promise.resolve();
    var c = est.atual.id;
    var tarefas = [
      q(sb.from("sessoes").select("*").eq("campanha", c).order("numero", { ascending: false, nullsFirst: true }).order("criada_em", { ascending: false })),
      q(sb.from("missoes").select("*").eq("campanha", c).order("ordem").order("criada_em")),
      rpc("grupo_da_campanha", { p_campanha: c })
    ];
    if (souMestre()) {
      tarefas.push(q(sb.from("sessoes_notas").select("*").eq("campanha", c)));
      tarefas.push(q(sb.from("missoes_notas").select("*").eq("campanha", c)));
    }
    return Promise.all(tarefas).then(function (r) {
      est.sessoes = r[0] || []; est.missoes = r[1] || []; est.grupo = r[2] || [];
      est.notasSessao = {}; est.notasMissao = {};
      (r[3] || []).forEach(function (n) { est.notasSessao[n.sessao] = n.texto; });
      (r[4] || []).forEach(function (n) { est.notasMissao[n.missao] = n.texto; });
      est.offline = false;
      gravar(chaveCache(), { sessoes: est.sessoes, missoes: est.missoes, grupo: est.grupo, notasSessao: est.notasSessao, notasMissao: est.notasMissao, quando: Date.now() });
    });
  }

  function usarCache() {
    var salva = ler("grimorio:mesa:atual", null);
    if (salva) est.atual = salva;
    var c = ler(chaveCache(), null);
    if (!c) return false;
    est.sessoes = c.sessoes; est.missoes = c.missoes; est.grupo = c.grupo || [];
    est.notasSessao = c.notasSessao || {}; est.notasMissao = c.notasMissao || {};
    est.offline = true;
    return true;
  }

  function assinar() {
    if (!sb || !est.atual) return;
    if (canal) { sb.removeChannel(canal); canal = null; }
    var c = est.atual.id, t = null;
    var recarregar = function () { clearTimeout(t); t = setTimeout(function () { carregarDados().then(desenhar).catch(function () {}); }, 400); };
    canal = sb.channel("mesa-" + c)
      .on("postgres_changes", { event: "*", schema: "public", table: "sessoes", filter: "campanha=eq." + c }, recarregar)
      .on("postgres_changes", { event: "*", schema: "public", table: "missoes", filter: "campanha=eq." + c }, recarregar)
      .subscribe();
  }

  /* ---------- entrada pública ---------- */
  function render(el, aba) {
    raiz = el; abaAtual = aba;
    if (!CFG.SUPABASE_URL || !CFG.SUPABASE_CHAVE) {
      raiz.innerHTML = cabecalho() + '<p class="mesa-vazio">As campanhas ainda não foram ligadas a um servidor. Assim que o Mestre configurar, esta aba passa a funcionar.</p>';
      return;
    }
    raiz.innerHTML = cabecalho() + '<p class="mesa-vazio">Carregando…</p>';
    conectar()
      .then(carregarCampanhas)
      .then(function () { gravar("grimorio:mesa:atual", est.atual); return carregarDados(); })
      .then(function () { assinar(); desenhar(); })
      .catch(function (e) {
        est.erro = msgErro(e);
        if (usarCache()) desenhar();
        else raiz.innerHTML = cabecalho() + '<p class="mesa-vazio">' + esc(est.erro) + "</p>";
      });
  }

  function cabecalho() {
    return abaAtual === "missoes"
      ? '<header class="cap-cab"><span class="cap-num">Mesa</span><h2>Missões</h2></header>'
      : '<header class="cap-cab"><span class="cap-num">Mesa</span><h2>Campanha</h2></header>';
  }

  /* ---------- desenho ---------- */
  function desenhar() {
    if (!raiz) return;
    var h = cabecalho();
    if (est.offline) h += '<p class="mesa-aviso">Sem conexão: mostrando a última cópia salva. Edições ficam disponíveis quando a internet voltar.</p>';
    if (!est.atual) { raiz.innerHTML = h + telaEntrada(); return; }
    h += barraCampanha();
    h += abaAtual === "missoes" ? telaMissoes() : telaCampanha();
    raiz.innerHTML = h;
  }

  function telaEntrada() {
    var e = est.entrada;
    var vagas = e.vagas;
    return '<section class="mesa-cartao">' +
      "<h3>Entrar numa campanha</h3>" +
      '<p class="mesa-ajuda">Peça ao Mestre o código da campanha e a senha da sua vaga.</p>' +
      '<form data-form="buscar-vagas" class="mesa-form">' +
      '<label>Código da campanha<input name="codigo" required maxlength="8" autocapitalize="characters" autocomplete="off" value="' + esc(e.codigo) + '" placeholder="Ex.: 7NP9KW"></label>' +
      (vagas ? "" : '<button type="submit" class="mesa-btn">Continuar</button>') +
      "</form>" +
      (vagas ? (vagas.length
        ? '<form data-form="entrar" class="mesa-form">' +
          '<label>Sua vaga<select name="papel">' + vagas.map(function (v) {
            return '<option value="' + esc(v.papel) + '">' + esc(nomePapel(v.papel) + (v.nome && v.papel !== "mestre" ? " · " + v.nome : "")) + "</option>";
          }).join("") + "</select></label>" +
          '<label>Senha<input name="senha" type="password" required autocomplete="current-password"></label>' +
          '<div class="mesa-acoes"><button type="submit" class="mesa-btn">Entrar</button><button type="button" class="mesa-btn-sec" data-acao="trocar-codigo">Outro código</button></div>' +
          "</form>"
        : '<p class="mesa-erro">Nenhuma campanha com esse código.</p><button type="button" class="mesa-btn-sec" data-acao="trocar-codigo">Tentar outro código</button>') : "") +
      "</section>" +
      '<section class="mesa-cartao">' +
      "<h3>Sou o Mestre: criar campanha</h3>" +
      '<form data-form="criar" class="mesa-form">' +
      '<label>Nome da campanha<input name="nome" required maxlength="80" placeholder="Ex.: Sombras de Sharn"></label>' +
      '<label>Senha do Mestre<input name="senha" type="password" required minlength="4" autocomplete="new-password"></label>' +
      '<p class="mesa-ajuda">Depois de criar, você cadastra as vagas dos jogadores, cada uma com a sua senha.</p>' +
      '<button type="submit" class="mesa-btn">Criar campanha</button>' +
      "</form></section>";
  }

  function barraCampanha() {
    var a = est.atual;
    var outras = est.campanhas.length > 1
      ? '<select data-acao="trocar-campanha" aria-label="Trocar de campanha">' + est.campanhas.map(function (c) {
          return '<option value="' + c.id + '"' + (c.id === a.id ? " selected" : "") + ">" + esc(c.nome) + "</option>";
        }).join("") + "</select>"
      : "";
    return '<div class="mesa-barra">' +
      '<div><div class="mesa-campanha">' + esc(a.nome) + "</div>" +
      '<div class="mesa-papel">Você é ' + esc(nomePapel(a.papel)) + (a.nome_vaga && a.papel !== "mestre" ? " · " + esc(a.nome_vaga) : "") +
      (souMestre() ? ' · código <strong class="mesa-codigo">' + esc(a.codigo) + "</strong>" : "") + "</div></div>" +
      '<div class="mesa-barra-acoes">' + outras +
      '<button type="button" class="mesa-btn-sec" data-acao="nova-entrada">+ Campanha</button>' +
      '<button type="button" class="mesa-btn-sec" data-acao="sair">Sair</button></div></div>';
  }

  /* ----- Campanha: sessões e grupo ----- */
  function telaCampanha() {
    var h = "";
    if (souMestre() && !est.offline) {
      h += est.editando && est.editando.tipo === "sessao" && !est.editando.id ? formSessao(null)
        : '<button type="button" class="mesa-btn mesa-novo" data-acao="nova-sessao">+ Nova sessão</button>';
    }
    if (!est.sessoes.length) h += '<p class="mesa-vazio">' + (souMestre() ? "Nenhuma sessão registrada ainda. Use “Nova sessão” depois de cada jogo." : "O Mestre ainda não registrou nenhuma sessão.") + "</p>";
    h += '<ol class="mesa-linha">' + est.sessoes.map(function (s) {
      if (est.editando && est.editando.tipo === "sessao" && est.editando.id === s.id) return "<li>" + formSessao(s) + "</li>";
      var nota = est.notasSessao[s.id];
      return '<li class="mesa-sessao' + (s.visivel ? "" : " mesa-oculta") + '">' +
        '<div class="mesa-sessao-cab"><span class="mesa-num">' + (s.numero != null ? "Sessão " + s.numero : "Sessão") + (s.data ? " · " + dataBR(s.data) : "") + "</span>" +
        (s.visivel ? "" : '<span class="mesa-selo">Oculta</span>') + "</div>" +
        "<h3>" + esc(s.titulo || "Sem título") + "</h3>" +
        '<div class="corpo">' + G.formatar(s.resumo || "") + "</div>" +
        (souMestre() && nota ? '<details class="mesa-nota"><summary>Notas do Mestre</summary><div class="corpo">' + G.formatar(nota) + "</div></details>" : "") +
        (souMestre() && !est.offline ? '<div class="mesa-acoes">' +
          '<button type="button" class="mesa-btn-sec" data-acao="editar-sessao" data-id="' + s.id + '">Editar</button>' +
          '<button type="button" class="mesa-btn-sec" data-acao="alternar-sessao" data-id="' + s.id + '">' + (s.visivel ? "Ocultar" : "Mostrar aos jogadores") + "</button>" +
          '<button type="button" class="mesa-btn-sec mesa-perigo" data-acao="apagar-sessao" data-id="' + s.id + '">Apagar</button></div>' : "") +
        "</li>";
    }).join("") + "</ol>";
    h += telaGrupo();
    return h;
  }

  function formSessao(s) {
    var proximo = est.sessoes.reduce(function (m, x) { return Math.max(m, x.numero || 0); }, 0) + 1;
    var hoje = new Date(); var iso = hoje.getFullYear() + "-" + String(hoje.getMonth() + 1).padStart(2, "0") + "-" + String(hoje.getDate()).padStart(2, "0");
    return '<form data-form="sessao" data-id="' + (s ? s.id : "") + '" class="mesa-form mesa-cartao">' +
      "<h3>" + (s ? "Editar sessão" : "Nova sessão") + "</h3>" +
      '<div class="mesa-linha2"><label>Número<input name="numero" type="number" min="0" value="' + (s ? (s.numero != null ? s.numero : "") : proximo) + '"></label>' +
      '<label>Data<input name="data" type="date" value="' + (s ? (s.data || "") : iso) + '"></label></div>' +
      '<label>Título<input name="titulo" maxlength="120" value="' + esc(s ? s.titulo : "") + '" placeholder="Ex.: Fuga pelo trem relâmpago"></label>' +
      '<label>Resumo (os jogadores veem)<textarea name="resumo" rows="8" placeholder="O que aconteceu na sessão…">' + esc(s ? s.resumo : "") + "</textarea></label>" +
      '<label>Notas do Mestre (só você vê)<textarea name="nota" rows="4" placeholder="Segredos, ganchos, lembretes…">' + esc(s ? (est.notasSessao[s.id] || "") : "") + "</textarea></label>" +
      '<label class="mesa-check"><input name="visivel" type="checkbox"' + (!s || s.visivel ? " checked" : "") + "> Visível para os jogadores</label>" +
      '<p class="mesa-ajuda">Dica: linhas começando com “- ” viram lista; **negrito** e *itálico* funcionam.</p>' +
      '<div class="mesa-acoes"><button type="submit" class="mesa-btn">Salvar</button><button type="button" class="mesa-btn-sec" data-acao="cancelar">Cancelar</button></div>' +
      "</form>";
  }

  function telaGrupo() {
    var h = '<section class="secao"><h2 class="secao-titulo">Grupo<span class="n">' + est.grupo.length + "</span></h2>";
    h += '<ul class="mesa-grupo">' + est.grupo.map(function (g) {
      if (souMestre() && est.editando && est.editando.tipo === "vaga" && est.editando.id === g.papel) return "<li>" + formVaga(g) + "</li>";
      return '<li><span class="mesa-vaga">' + esc(nomePapel(g.papel)) + "</span> " + esc(g.papel === "mestre" ? "" : (g.nome || "")) +
        (souMestre() ? ' <span class="mesa-uso">' + (g.em_uso ? "em uso" : "livre") + "</span>" : "") +
        (souMestre() && !est.offline ? ' <button type="button" class="mesa-link" data-acao="editar-vaga" data-id="' + esc(g.papel) + '">editar</button>' +
          (g.papel !== "mestre" ? ' <button type="button" class="mesa-link mesa-perigo" data-acao="remover-vaga" data-id="' + esc(g.papel) + '">remover</button>' : "") : "") +
        "</li>";
    }).join("") + "</ul>";
    if (souMestre() && !est.offline) {
      h += est.editando && est.editando.tipo === "vaga" && est.editando.id === "nova" ? formVaga(null)
        : '<button type="button" class="mesa-btn-sec" data-acao="nova-vaga">+ Vaga de jogador</button>';
      h += '<p class="mesa-ajuda">Para um jogador entrar: passe o código <strong>' + esc(est.atual.codigo) + "</strong> e a senha da vaga dele. Se alguém esquecer a senha, edite a vaga e defina outra.</p>";
    }
    return h + "</section>";
  }

  function proximaVaga() {
    var n = 1;
    while (est.grupo.some(function (g) { return g.papel === "jogador" + n; })) n++;
    return "jogador" + n;
  }

  function formVaga(g) {
    var papel = g ? g.papel : proximaVaga();
    return '<form data-form="vaga" data-id="' + esc(papel) + '" data-nova="' + (g ? "" : "1") + '" class="mesa-form mesa-cartao">' +
      "<h3>" + esc(nomePapel(papel)) + "</h3>" +
      (papel === "mestre" ? "" : '<label>Nome (jogador ou personagem)<input name="nome" maxlength="60" value="' + esc(g ? (g.nome || "") : "") + '" placeholder="Ex.: Ana · Kael, Artífice"></label>') +
      '<label>' + (g ? "Nova senha (deixe em branco para manter)" : "Senha") + '<input name="senha" type="text" ' + (g ? "" : "required ") + 'minlength="4" autocomplete="off"></label>' +
      '<div class="mesa-acoes"><button type="submit" class="mesa-btn">Salvar</button><button type="button" class="mesa-btn-sec" data-acao="cancelar">Cancelar</button></div></form>';
  }

  /* ----- Missões ----- */
  var STATUS = { ativa: "Ativa", concluida: "Concluída", falhou: "Falhou" };
  function telaMissoes() {
    var h = "";
    if (souMestre() && !est.offline) {
      h += est.editando && est.editando.tipo === "missao" && !est.editando.id ? formMissao(null)
        : '<button type="button" class="mesa-btn mesa-novo" data-acao="nova-missao">+ Nova missão</button>';
    }
    var ativas = est.missoes.filter(function (m) { return m.status === "ativa"; });
    var grupos = [
      ["Missões principais", ativas.filter(function (m) { return m.tipo === "principal"; })],
      ["Missões secundárias", ativas.filter(function (m) { return m.tipo === "secundaria"; })],
      ["Concluídas", est.missoes.filter(function (m) { return m.status === "concluida"; })],
      ["Falharam", est.missoes.filter(function (m) { return m.status === "falhou"; })]
    ];
    if (!est.missoes.length) h += '<p class="mesa-vazio">' + (souMestre() ? "Nenhuma missão ainda. Crie a primeira com “Nova missão”." : "Nenhuma missão no diário do grupo ainda.") + "</p>";
    grupos.forEach(function (gr) {
      if (!gr[1].length) return;
      h += '<section class="secao"><h2 class="secao-titulo">' + gr[0] + '<span class="n">' + gr[1].length + "</span></h2>" +
        gr[1].map(cartaoMissao).join("") + "</section>";
    });
    return h;
  }

  function cartaoMissao(m) {
    if (est.editando && est.editando.tipo === "missao" && est.editando.id === m.id) return formMissao(m);
    var obj = Array.isArray(m.objetivos) ? m.objetivos : [];
    var feitos = obj.filter(function (o) { return o.feito; }).length;
    var nota = est.notasMissao[m.id];
    var podeMarcar = souMestre() && !est.offline;
    return '<article class="mesa-missao mesa-' + m.status + (m.visivel ? "" : " mesa-oculta") + '">' +
      '<div class="mesa-sessao-cab"><span class="mesa-num">' + (m.tipo === "principal" ? "Principal" : "Secundária") + (m.quem_deu ? " · " + esc(m.quem_deu) : "") + "</span>" +
      (m.status !== "ativa" ? '<span class="mesa-selo">' + STATUS[m.status] + "</span>" : "") +
      (m.visivel ? "" : '<span class="mesa-selo">Oculta</span>') + "</div>" +
      "<h3>" + esc(m.titulo) + "</h3>" +
      (m.descricao ? '<div class="corpo">' + G.formatar(m.descricao) + "</div>" : "") +
      (obj.length ? '<div class="mesa-obj-cab">Objetivos ' + feitos + "/" + obj.length + '</div><ul class="mesa-objetivos">' + obj.map(function (o, i) {
        return '<li class="' + (o.feito ? "feito" : "") + '">' +
          (podeMarcar ? '<label><input type="checkbox" data-acao="marcar" data-id="' + m.id + '" data-i="' + i + '"' + (o.feito ? " checked" : "") + "> " + esc(o.texto) + "</label>"
                      : '<span class="mesa-marca" aria-hidden="true">' + (o.feito ? "✓" : "○") + "</span> " + esc(o.texto)) + "</li>";
      }).join("") + "</ul>" : "") +
      (m.recompensa ? '<p class="mesa-recompensa"><strong>Recompensa:</strong> ' + esc(m.recompensa) + "</p>" : "") +
      (souMestre() && nota ? '<details class="mesa-nota"><summary>Notas do Mestre</summary><div class="corpo">' + G.formatar(nota) + "</div></details>" : "") +
      (souMestre() && !est.offline ? '<div class="mesa-acoes">' +
        '<button type="button" class="mesa-btn-sec" data-acao="editar-missao" data-id="' + m.id + '">Editar</button>' +
        (m.status !== "concluida" ? '<button type="button" class="mesa-btn-sec" data-acao="status" data-id="' + m.id + '" data-v="concluida">Concluir</button>' : "") +
        (m.status !== "ativa" ? '<button type="button" class="mesa-btn-sec" data-acao="status" data-id="' + m.id + '" data-v="ativa">Reabrir</button>' : "") +
        (m.status === "ativa" ? '<button type="button" class="mesa-btn-sec" data-acao="status" data-id="' + m.id + '" data-v="falhou">Falhou</button>' : "") +
        '<button type="button" class="mesa-btn-sec" data-acao="alternar-missao" data-id="' + m.id + '">' + (m.visivel ? "Ocultar" : "Revelar") + "</button>" +
        '<button type="button" class="mesa-btn-sec mesa-perigo" data-acao="apagar-missao" data-id="' + m.id + '">Apagar</button></div>' : "") +
      "</article>";
  }

  function formMissao(m) {
    var obj = m && Array.isArray(m.objetivos) ? m.objetivos : [];
    return '<form data-form="missao" data-id="' + (m ? m.id : "") + '" class="mesa-form mesa-cartao">' +
      "<h3>" + (m ? "Editar missão" : "Nova missão") + "</h3>" +
      '<label>Título<input name="titulo" required maxlength="120" value="' + esc(m ? m.titulo : "") + '"></label>' +
      '<div class="mesa-linha2"><label>Tipo<select name="tipo"><option value="principal"' + (!m || m.tipo === "principal" ? " selected" : "") + '>Principal</option><option value="secundaria"' + (m && m.tipo === "secundaria" ? " selected" : "") + ">Secundária</option></select></label>" +
      '<label>Quem deu<input name="quem_deu" maxlength="120" value="' + esc(m ? m.quem_deu : "") + '" placeholder="Ex.: Casa Cannith"></label></div>' +
      '<label>Descrição<textarea name="descricao" rows="5">' + esc(m ? m.descricao : "") + "</textarea></label>" +
      '<label>Objetivos (um por linha)<textarea name="objetivos" rows="4" placeholder="Encontrar o informante&#10;Recuperar o fragmento">' + esc(obj.map(function (o) { return o.texto; }).join("\n")) + "</textarea></label>" +
      '<label>Recompensa<input name="recompensa" maxlength="2000" value="' + esc(m ? m.recompensa : "") + '" placeholder="Ex.: 500 PO e um favor da Casa"></label>' +
      '<label>Notas do Mestre (só você vê)<textarea name="nota" rows="3">' + esc(m ? (est.notasMissao[m.id] || "") : "") + "</textarea></label>" +
      '<label class="mesa-check"><input name="visivel" type="checkbox"' + (!m || m.visivel ? " checked" : "") + "> Visível para os jogadores (desmarque para uma missão secreta)</label>" +
      '<div class="mesa-acoes"><button type="submit" class="mesa-btn">Salvar</button><button type="button" class="mesa-btn-sec" data-acao="cancelar">Cancelar</button></div>' +
      "</form>";
  }

  /* ---------- ações ---------- */
  function depois(promessa, mensagem) {
    return promessa.then(function () { est.editando = null; return carregarDados(); })
      .then(function () { desenhar(); if (mensagem) G.avisar(mensagem); })
      .catch(function (e) { G.avisar(msgErro(e)); });
  }

  function salvarNota(tabela, chave, id, texto) {
    var linha = { campanha: est.atual.id, texto: texto || "" }; linha[chave] = id;
    if (!texto) return q(sb.from(tabela).delete().eq(chave, id));
    return q(sb.from(tabela).upsert(linha));
  }

  function aoEnviar(ev) {
    var f = ev.target.closest("form[data-form]");
    if (!f || !raiz.contains(f)) return;
    ev.preventDefault();
    var d = new FormData(f), tipo = f.getAttribute("data-form"), id = f.getAttribute("data-id");
    var botao = f.querySelector('[type="submit"]'); if (botao) botao.disabled = true;

    if (tipo === "buscar-vagas") {
      est.entrada.codigo = String(d.get("codigo") || "").toUpperCase().trim();
      rpc("vagas_da_campanha", { p_codigo: est.entrada.codigo })
        .then(function (v) { est.entrada.vagas = v || []; desenhar(); })
        .catch(function (e) { G.avisar(msgErro(e)); desenhar(); });
    } else if (tipo === "entrar") {
      rpc("entrar_campanha", { p_codigo: est.entrada.codigo, p_papel: d.get("papel"), p_senha: d.get("senha") })
        .then(function (r) { var c = r && r[0]; if (c) gravar("grimorio:campanha", c.id); est.entrada = { codigo: "", vagas: null }; return reiniciar(); })
        .then(function () { G.avisar("Bem-vindo à campanha!"); })
        .catch(function (e) { G.avisar(msgErro(e)); if (botao) botao.disabled = false; });
    } else if (tipo === "criar") {
      rpc("criar_campanha", { p_nome: d.get("nome"), p_senha_mestre: d.get("senha") })
        .then(function (r) { var c = r && r[0]; if (c) gravar("grimorio:campanha", c.id); return reiniciar(); })
        .then(function () { G.avisar("Campanha criada. Agora cadastre as vagas dos jogadores."); })
        .catch(function (e) { G.avisar(msgErro(e)); if (botao) botao.disabled = false; });
    } else if (tipo === "sessao") {
      var linha = {
        campanha: est.atual.id,
        numero: d.get("numero") === "" ? null : parseInt(d.get("numero"), 10),
        data: d.get("data") || null,
        titulo: String(d.get("titulo") || "").trim(),
        resumo: String(d.get("resumo") || ""),
        visivel: !!d.get("visivel")
      };
      var nota = String(d.get("nota") || "").trim();
      var p = id ? q(sb.from("sessoes").update(linha).eq("id", id).select()) : q(sb.from("sessoes").insert(linha).select());
      depois(p.then(function (r) { return salvarNota("sessoes_notas", "sessao", (r && r[0] ? r[0].id : id), nota); }), "Sessão salva.");
    } else if (tipo === "missao") {
      var antigos = id ? (est.missoes.filter(function (m) { return m.id === id; })[0] || {}).objetivos || [] : [];
      var objetivos = String(d.get("objetivos") || "").split("\n").map(function (s) { return s.trim(); }).filter(Boolean).map(function (t) {
        var velho = antigos.filter(function (o) { return o.texto === t; })[0];
        return { texto: t, feito: !!(velho && velho.feito) };
      });
      var m = {
        campanha: est.atual.id,
        titulo: String(d.get("titulo") || "").trim(),
        tipo: d.get("tipo"),
        quem_deu: String(d.get("quem_deu") || "").trim(),
        descricao: String(d.get("descricao") || ""),
        objetivos: objetivos,
        recompensa: String(d.get("recompensa") || "").trim(),
        visivel: !!d.get("visivel")
      };
      var notaM = String(d.get("nota") || "").trim();
      var pm = id ? q(sb.from("missoes").update(m).eq("id", id).select()) : q(sb.from("missoes").insert(m).select());
      depois(pm.then(function (r) { return salvarNota("missoes_notas", "missao", (r && r[0] ? r[0].id : id), notaM); }), "Missão salva.");
    } else if (tipo === "vaga") {
      var senha = String(d.get("senha") || "");
      depois(rpc("definir_vaga", { p_campanha: est.atual.id, p_papel: id, p_nome: d.get("nome") || null, p_senha: senha ? senha : null }),
        f.getAttribute("data-nova") ? "Vaga criada. Passe o código e a senha ao jogador." : "Vaga atualizada.");
    }
  }

  function reiniciar() {
    return carregarCampanhas().then(function () { gravar("grimorio:mesa:atual", est.atual); return carregarDados(); }).then(function () { assinar(); desenhar(); });
  }

  function aoClicar(ev) {
    var b = ev.target.closest("[data-acao]");
    if (!b || !raiz || !raiz.contains(b) || b.tagName === "SELECT") return;
    var a = b.getAttribute("data-acao"), id = b.getAttribute("data-id");
    var achar = function (lista) { return lista.filter(function (x) { return x.id === id; })[0]; };

    if (a === "trocar-codigo") { est.entrada = { codigo: "", vagas: null }; desenhar(); }
    else if (a === "nova-sessao") { est.editando = { tipo: "sessao", id: null }; desenhar(); }
    else if (a === "editar-sessao") { est.editando = { tipo: "sessao", id: id }; desenhar(); }
    else if (a === "nova-missao") { est.editando = { tipo: "missao", id: null }; desenhar(); }
    else if (a === "editar-missao") { est.editando = { tipo: "missao", id: id }; desenhar(); }
    else if (a === "nova-vaga") { est.editando = { tipo: "vaga", id: "nova" }; desenhar(); }
    else if (a === "editar-vaga") { est.editando = { tipo: "vaga", id: id }; desenhar(); }
    else if (a === "cancelar") { est.editando = null; desenhar(); }
    else if (a === "alternar-sessao") { var s = achar(est.sessoes); depois(q(sb.from("sessoes").update({ visivel: !s.visivel }).eq("id", id)), s.visivel ? "Sessão oculta dos jogadores." : "Sessão visível para os jogadores."); }
    else if (a === "apagar-sessao") { if (confirmar("Apagar esta sessão?")) depois(q(sb.from("sessoes").delete().eq("id", id)), "Sessão apagada."); }
    else if (a === "alternar-missao") { var m = achar(est.missoes); depois(q(sb.from("missoes").update({ visivel: !m.visivel }).eq("id", id)), m.visivel ? "Missão oculta." : "Missão revelada aos jogadores."); }
    else if (a === "apagar-missao") { if (confirmar("Apagar esta missão?")) depois(q(sb.from("missoes").delete().eq("id", id)), "Missão apagada."); }
    else if (a === "status") { depois(q(sb.from("missoes").update({ status: b.getAttribute("data-v") }).eq("id", id)), "Missão atualizada."); }
    else if (a === "remover-vaga") { if (confirmar("Remover esta vaga? Quem estiver nela sai da campanha.")) depois(rpc("remover_vaga", { p_campanha: est.atual.id, p_papel: id }), "Vaga removida."); }
    else if (a === "nova-entrada") { est.atual = null; est.entrada = { codigo: "", vagas: null }; desenhar(); }
    else if (a === "sair") {
      if (!confirmar("Sair desta campanha neste aparelho? Para voltar, use o código e a senha de novo.")) return;
      rpc("sair_da_campanha", { p_campanha: est.atual.id }).then(function () { gravar("grimorio:campanha", null); return reiniciar(); })
        .catch(function (e) { G.avisar(msgErro(e)); });
    }
  }

  // Marcar objetivo e trocar de campanha (change)
  function aoMudar(ev) {
    var t = ev.target;
    if (!raiz || !raiz.contains(t)) return;
    if (t.getAttribute("data-acao") === "trocar-campanha") {
      gravar("grimorio:campanha", t.value);
      est.atual = est.campanhas.filter(function (c) { return c.id === t.value; })[0];
      gravar("grimorio:mesa:atual", est.atual);
      raiz.innerHTML = cabecalho() + '<p class="mesa-vazio">Carregando…</p>';
      carregarDados().then(function () { assinar(); desenhar(); }).catch(function (e) { G.avisar(msgErro(e)); });
    } else if (t.getAttribute("data-acao") === "marcar") {
      var m = est.missoes.filter(function (x) { return x.id === t.getAttribute("data-id"); })[0];
      var obj = (m.objetivos || []).map(function (o) { return { texto: o.texto, feito: o.feito }; });
      obj[+t.getAttribute("data-i")].feito = t.checked;
      depois(q(sb.from("missoes").update({ objetivos: obj }).eq("id", m.id)));
    }
  }

  // Confirmação simples sem janela do navegador (o app evita alert/confirm)
  var pendente = null;
  function confirmar(texto) {
    if (pendente === texto) { pendente = null; return true; }
    pendente = texto;
    G.avisar(texto + " Toque de novo para confirmar.");
    setTimeout(function () { if (pendente === texto) pendente = null; }, 5000);
    return false;
  }

  document.addEventListener("submit", aoEnviar);
  document.addEventListener("click", aoClicar);
  document.addEventListener("change", aoMudar);

  // Usado pelo mapa (mapa.js): conexão e campanha atual
  function contexto() {
    return conectar().then(function () { return est.atual ? null : carregarCampanhas(); })
      .then(function () { return { sb: sb, atual: est.atual, rpc: rpc, q: q }; });
  }

  window.Mesa = { render: render, contexto: contexto, msgErro: msgErro, nomePapel: nomePapel };
})();
