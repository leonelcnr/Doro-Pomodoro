// Aplica el tema y el acento guardados antes del primer pintado, para que la
// página no aparezca un instante en claro o en violeta. Es un archivo aparte (no
// un <script> en línea) porque la CSP de vercel.json solo permite scripts propios.
// Claves: "theme" (next-themes, App.tsx) y "doro-acento" (src/lib/acento.ts).
(function () {
  var raiz = document.documentElement;
  try {
    var tema = localStorage.getItem("theme");
    if (tema === "dark" || tema === "negro") raiz.classList.add(tema);
    var acento = localStorage.getItem("doro-acento");
    if (acento && acento !== "violeta" && /^[a-z]+$/.test(acento)) raiz.setAttribute("data-acento", acento);
  } catch (e) {
    // Sin almacenamiento: queda el tema claro y el violeta
  }
})();
