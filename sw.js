/* オフライン用キャッシュ。サーバー(https)に置いたときだけ働きます。
   ファイルを更新したら、下の CACHE の数字を1つ増やしてください。 */
var CACHE = "qlists-v4";
var FILES = [
  "./",
  "./index.html",
  "./lib/pdf.min.js",
  "./lib/pdf.worker.min.js",
  "./apple-touch-icon.png",
  /* ↓ 日本語PDF用の文字コード対応表（CMap）。
     これが無いと、日本語フォントのPDFで文字が1つも出ない。
     2026-07-27 その7 に追加。減らさないこと。 */
  "./lib/cmaps/90ms-RKSJ-H.bcmap",
  "./lib/cmaps/90ms-RKSJ-V.bcmap",
  "./lib/cmaps/90msp-RKSJ-H.bcmap",
  "./lib/cmaps/90msp-RKSJ-V.bcmap",
  "./lib/cmaps/90pv-RKSJ-H.bcmap",
  "./lib/cmaps/Adobe-Japan1-UCS2.bcmap",
  "./lib/cmaps/EUC-H.bcmap",
  "./lib/cmaps/EUC-V.bcmap",
  "./lib/cmaps/UniJIS-UCS2-H.bcmap",
  "./lib/cmaps/UniJIS-UCS2-HW-H.bcmap",
  "./lib/cmaps/UniJIS-UCS2-HW-V.bcmap",
  "./lib/cmaps/UniJIS-UCS2-V.bcmap",
  "./lib/cmaps/UniJIS-UTF16-H.bcmap",
  "./lib/cmaps/UniJIS-UTF16-V.bcmap"
];

/* ★ cache:"reload" が要。これが無いと、ブラウザが持っている
   古い一時ファイルをそのまま保存してしまい、更新しても反映されない。
   （2026-07-27 その5 に実際に踏んだ。消さないこと） */
self.addEventListener("install", function (e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return Promise.all(FILES.map(function (u) {
        return fetch(new Request(u, { cache: "reload" })).then(function (res) {
          if (res && res.ok) return c.put(u, res);
        }).catch(function () {});
      }));
    })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (ks) {
      return Promise.all(ks.map(function (k) { return k === CACHE ? null : caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then(function (hit) {
      return hit || fetch(e.request).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); }).catch(function () {});
        return res;
      }).catch(function () { return caches.match("./index.html"); });
    })
  );
});
