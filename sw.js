/* Service worker do Grimório de Mesa.
   - O app (HTML, JS, ícones) fica guardado para abrir offline.
   - O conteúdo (arquivos .json) sempre tenta a internet primeiro; sem internet, usa a última cópia.
   Ao mudar index.html ou app.js, aumente VERSAO_APP para os celulares baixarem o app novo. */
var VERSAO_APP = "2.3.1";
var CACHE_APP = "grimorio-app-" + VERSAO_APP;
var CACHE_DADOS = "grimorio-dados";
var CACHE_FONTES = "grimorio-fontes";

var ARQUIVOS_APP = [
  "./",
  "index.html",
  "app.js",
  "config.js",
  "campanha.js",
  "mapa.js",
  "manifest.webmanifest",
  "icon-192.png",
  "icon-512.png",
  "apple-touch-icon.png"
];

self.addEventListener("install", function (ev) {
  ev.waitUntil(caches.open(CACHE_APP).then(function (c) {
    // cache: "reload" ignora o cache HTTP do navegador, para nunca guardar um app.js antigo
    return c.addAll(ARQUIVOS_APP.map(function (u) { return new Request(u, { cache: "reload" }); }));
  }));
});

self.addEventListener("activate", function (ev) {
  ev.waitUntil(
    caches.keys().then(function (nomes) {
      return Promise.all(nomes.map(function (n) {
        if (n.indexOf("grimorio-app-") === 0 && n !== CACHE_APP) return caches.delete(n);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("message", function (ev) {
  if (ev.data === "pular-espera") self.skipWaiting();
});

self.addEventListener("fetch", function (ev) {
  var req = ev.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);

  // Fontes do Google: guarda a primeira cópia e reutiliza
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    ev.respondWith(caches.open(CACHE_FONTES).then(function (c) {
      return c.match(req).then(function (salvo) {
        return salvo || fetch(req).then(function (r) { c.put(req, r.clone()); return r; });
      });
    }));
    return;
  }

  if (url.origin !== self.location.origin) return;

  // Conteúdo: internet primeiro, cópia salva se estiver offline
  if (/\.json$/.test(url.pathname)) {
    ev.respondWith(
      fetch(req, { cache: "no-cache" }).then(function (r) {
        if (r.ok) { var copia = r.clone(); caches.open(CACHE_DADOS).then(function (c) { c.put(url.pathname, copia); }); }
        return r;
      }).catch(function () {
        return caches.open(CACHE_DADOS).then(function (c) { return c.match(url.pathname); });
      })
    );
    return;
  }

  // Páginas: abrir sempre o index.html guardado
  if (req.mode === "navigate") {
    ev.respondWith(
      caches.match("index.html").then(function (salvo) { return salvo || fetch(req); })
    );
    return;
  }

  // Demais arquivos do app: cópia guardada, ou internet
  ev.respondWith(
    caches.match(req, { ignoreSearch: true }).then(function (salvo) { return salvo || fetch(req); })
  );
});
