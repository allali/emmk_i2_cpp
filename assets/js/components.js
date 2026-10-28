/*
 * Composants réutilisables pour écrire les diapos.
 * Chaque fonction renvoie une chaîne HTML. L'interactivité est branchée
 * par app.js (délégation d'événements) une fois la diapo affichée.
 *
 *   H.code(src, opts)        bloc de code C++ coloré
 *   H.files([...], opts)     plusieurs fichiers côte à côte
 *   H.cmd(text)              terminal
 *   H.rule/warn/tip/info/key callouts
 *   H.quiz({...})            QCM interactif
 *   H.reveal(label, html)    réponse cachée
 *   H.variants([...])        onglets de variantes de code
 *   H.table(head, rows, {frag})  tableau (oui/non -> badges) ; frag : lignes révélées une à une
 *   H.cols(a, b, ...)        colonnes
 *   H.frag(html)             fragment révélé étape par étape
 *   H.frag(html, {withPrev: true})  … révélé en même temps que le fragment précédent
 */
(function () {
  const { highlight, highlightLang, dedent, esc } = window.CppHighlight;
  let uid = 0;
  const nextId = (p) => p + '-' + (++uid);

  /* opts: { title, hl: [numéros de lignes], mark: {ligne: 'ok'|'err'|'warn'}, small | tiny | large, lang } */
  function code(src, opts = {}) {
    const text = dedent(src, opts.lang === 'make' || opts.lang === 'makefile');
    const hl = new Set(opts.hl || []);
    const mark = opts.mark || {};
    const body = highlightLang(text, opts.lang)
      .split('\n')
      .map((l, k) => {
        const n = k + 1;
        const cls = ['ln'];
        if (hl.has(n)) cls.push('hl');
        if (mark[n]) cls.push('mk-' + mark[n]);
        return '<span class="' + cls.join(' ') + '" data-line="' + n + '">' + (l || ' ') + '</span>';
      }).join('');
    // blocs « terminal » (shell, gdb, sorties…) : rendus comme une fenêtre de terminal Linux
    const isTerm = opts.term != null ? opts.term : (/^(sh|bash|shell)$/.test(opts.lang || '') || /^(terminal|shell|console|bash|sh|gdb|sortie|output)\b/i.test(opts.title || ''));
    const title = opts.title ? termBar(opts.title, !isTerm) : '';
    return '<figure class="code' + (isTerm ? ' is-term' : '') + (opts.small ? ' small' : '') + (opts.tiny ? ' tiny' : '') + (opts.large ? ' large' : '') + (opts.cls ? ' ' + opts.cls : '') + '">' + title +
      '<button class="copy-btn" title="Copier" aria-label="Copier le code">⧉</button>' +
      '<pre><code>' + body + '</code></pre></figure>';
  }

  /* Barre de titre de terminal Linux (GNOME / Ubuntu) : titre centré, boutons – ▢ ✕ à droite. */
  function termBar(t, isFile) {
    const label = !isFile && (!t || /^terminal$/i.test(t)) ? 'user@linux: ~' : t;
    return '<div class="code-title term-bar' + (isFile ? ' file-bar' : '') + '"><span class="term-ico">' + (isFile ? '▤' : '&gt;_') + '</span><span class="term-title">' + esc(label) + '</span>' +
      '<span class="win-btns" aria-hidden="true"><i>–</i><i>▢</i><i class="close">✕</i></span></div>';
  }

  /* files: [{ name, code, hl, mark }] */
  function files(list, opts = {}) {
    return '<div class="files' + (opts.stack ? ' stack' : '') + '" style="--n:' + list.length + '">' +
      list.map(f => code(f.code, { title: f.name, hl: f.hl, mark: f.mark, small: opts.small !== false, tiny: opts.tiny })).join('') +
      '</div>';
  }

  /* Encadré « En Java… » : point d'appui sur ce que les élèves connaissent déjà. */

  /* Java et C++ côte à côte. */
  function javaCpp(javaSrc, cppSrc, opts = {}) {
    return '<div class="files java-cpp">' +
      code(javaSrc, { title: opts.javaTitle || 'Java', small: true, cls: 'lang-java' }) +
      code(cppSrc, { title: opts.cppTitle || 'C++', small: true, hl: opts.hl, mark: opts.mark }) + '</div>';
  }

  function cmd(text, opts = {}) {
    const src = dedent(text);
    const CH = window.CppHighlight;
    if (CH.isGdb(src) || CH.isVg(src)) {
      return '<figure class="term' + (opts.cls ? ' ' + opts.cls : '') + '">' + termBar(opts.title) + '<pre>' + CH.highlightDebug(src, CH.isGdb(src) ? 'gdb' : 'vg') + '</pre></figure>';
    }
    const lines = src.split('\n').map(l =>
      l.startsWith('$') ? '<span class="prompt">$</span>' + esc(l.slice(1)) : '<span class="out">' + esc(l) + '</span>'
    ).join('\n');
    return '<figure class="term' + (opts.cls ? ' ' + opts.cls : '') + '">' + termBar(opts.title) + '<pre>' + lines + '</pre></figure>';
  }

  const callout = (kind, icon, label) => (html, title) =>
    '<div class="callout ' + kind + '"><div class="co-icon">' + icon + '</div><div class="co-body"><div class="co-label">' +
    (title || label) + '</div>' + html + '</div></div>';

  const rule = callout('rule', '📏', 'Règle');
  const warn = callout('warn', '⚠️', 'Attention');
  const tip = callout('tip', '💡', 'Astuce');
  const info = callout('info', 'ℹ️', 'Remarque');
  const key = callout('key', '🎯', 'À retenir');
  const java = callout('java', '☕', 'En Java…');

  /*
   * { q, options: [...], answer: index | [indices], explain, timer }
   * answer absent (null) => sondage : pas de bonne réponse, on marque simplement le choix.
   * timer : durée en secondes d'un chrono à lancer en classe.
   */
  function quiz(o) {
    const poll = o.answer == null;
    const answers = poll ? [] : Array.isArray(o.answer) ? o.answer : [o.answer];
    const id = nextId('quiz');
    const letters = 'ABCDEFGH';
    const timer = o.timer ? '<button class="quiz-timer" data-s="' + o.timer + '" title="Lancer le chrono">⏱ ' + o.timer + ' s</button>' : '';
    return '<div class="quiz' + (poll ? ' poll' : '') + '" id="' + id + '" data-answer="' + answers.join(',') + '" data-multi="' + (answers.length > 1) + '" data-poll="' + poll + '">' +
      '<div class="quiz-q"><span class="quiz-badge">' + (poll ? 'Sondage' : 'Question') + '</span>' + timer + o.q + '</div>' +
      (answers.length > 1 ? '<div class="quiz-hint">Plusieurs réponses possibles — cochez puis validez.</div>' : '') +
      '<div class="quiz-opts">' + o.options.map((t, k) =>
        '<button class="quiz-opt" data-k="' + k + '"><span class="letter">' + letters[k] + '</span><span>' + t + '</span></button>'
      ).join('') + '</div>' +
      (answers.length > 1 ? '<button class="quiz-validate">Valider</button>' : '') +
      '<div class="quiz-explain" hidden>' + (o.explain || '') + '</div></div>';
  }

  /* Image (cliquable pour l'agrandir). opts: { caption, maxh (en vh), w (largeur css), cls } */
  function img(src, opts = {}) {
    const style = (opts.maxh ? 'max-height:' + opts.maxh + 'vh;' : '') + (opts.w ? 'width:' + opts.w + ';' : '');
    return '<figure class="img' + (opts.cls ? ' ' + opts.cls : '') + '"><img src="' + src + '" alt="' + esc(opts.alt || opts.caption || '') +
      '" style="' + style + '" data-zoom>' + (opts.caption ? '<figcaption>' + opts.caption + '</figcaption>' : '') + '</figure>';
  }

  /* Vidéo locale. opts: { caption, poster, maxh } */
  function video(src, opts = {}) {
    return '<figure class="video"><video controls preload="metadata"' + (opts.poster ? ' poster="' + opts.poster + '"' : '') +
      (opts.maxh ? ' style="max-height:' + opts.maxh + 'vh"' : '') + '><source src="' + src + '" type="video/mp4"></video>' +
      (opts.caption ? '<figcaption>' + opts.caption + '</figcaption>' : '') + '</figure>';
  }

  function reveal(label, html) {
    return '<div class="reveal"><button class="reveal-btn">' + (label || 'Voir la réponse') +
      '</button><div class="reveal-body" hidden>' + html + '</div></div>';
  }

  /* list: [{ label, code, note, hl, mark }] */
  function variants(list, opts = {}) {
    const id = nextId('var');
    return '<div class="variants" id="' + id + '">' +
      '<div class="var-tabs" role="tablist">' + list.map((v, k) =>
        '<button class="var-tab' + (k ? '' : ' active') + '" data-k="' + k + '">' + v.label + '</button>').join('') + '</div>' +
      list.map((v, k) =>
        '<div class="var-panel' + (k ? '' : ' active') + '" data-k="' + k + '">' +
        (v.code ? code(v.code, { hl: v.hl, mark: v.mark, small: opts.small, large: opts.large, title: v.title }) : '') +
        (v.html || '') + (v.note ? '<div class="var-note">' + v.note + '</div>' : '') + '</div>'
      ).join('') + '</div>';
  }

  function badge(v) {
    const t = String(v).trim().toLowerCase();
    if (t === 'oui') return '<span class="yes">✔ oui</span>';
    if (t === 'non') return '<span class="no">✘ non</span>';
    return v;
  }

  function table(head, rows, opts = {}) {
    return '<table class="tbl' + (opts.cls ? ' ' + opts.cls : '') + '"><thead><tr>' + head.map(h => '<th>' + h + '</th>').join('') +
      '</tr></thead><tbody>' + rows.map(r => '<tr' + (opts.frag ? ' class="frag"' : '') + '>' + r.map((c, k) =>
        (k === 0 ? '<th>' + c + '</th>' : '<td>' + badge(c) + '</td>')).join('') + '</tr>').join('') + '</tbody></table>';
  }

  function cols(...parts) {
    return '<div class="cols" style="--n:' + parts.length + '">' + parts.map(p => '<div class="col">' + p + '</div>').join('') + '</div>';
  }

  function frag(html, tag) {
    const o = tag && typeof tag === 'object' ? tag : { tag };
    const t = o.tag || 'div';
    return '<' + t + ' class="frag' + (o.withPrev ? ' with-prev' : '') + '">' + html + '</' + t + '>';
  }

  function list(items, opts = {}) {
    const t = opts.ordered ? 'ol' : 'ul';
    return '<' + t + ' class="bullets' + (opts.frag ? ' frag-list' : '') + '">' +
      items.map(i => '<li' + (opts.frag ? ' class="frag"' : '') + '>' + i + '</li>').join('') + '</' + t + '>';
  }

  /* code en ligne : H.c('new int') */
  function c(s) { return '<code class="inline">' + highlight(s) + '</code>'; }

  /* Sortie réelle d'AddressSanitizer / valgrind : les lignes clés sont colorées. */
  function asan(text, opts = {}) {
    const lines = window.CppHighlight.highlightDebug(dedent(text), 'vg');
    return '<figure class="term asan">' + termBar(opts.title || 'g++ -g -fsanitize=address') + '<pre>' + lines + '</pre></figure>';
  }

  window.H = { img, video, code, files, cmd, asan, java, javaCpp, rule, warn, tip, info, key, quiz, reveal, variants, table, cols, frag, list, c, esc };
})();
