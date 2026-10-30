/* Moteur de présentation : navigation, sommaire, étapes, interactions. */
(function () {
  const slides = Course.flatten();
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const viewport = $('#viewport');
  const BASE_TITLE = document.title;

  // stockage propre à chaque cours (<html data-course-id="…">) ; clé historique pour le cours C++
  const CID = document.documentElement.dataset.courseId || 'cours';
  const PREFIX = CID === 'cpp' ? 'cpp-cours:' : 'cours:' + CID + ':';
  const store = {
    get(k) { try { return localStorage.getItem(PREFIX + k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(PREFIX + k, v); } catch (e) { /* ignore */ } }
  };
  // réglages communs à tous les cours (et au catalogue)
  const global = {
    get(k) { try { return localStorage.getItem('cours:' + k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem('cours:' + k, v); } catch (e) { /* ignore */ } }
  };

  let cur = -1;
  let steppers = [];

  /* ---------- Modifications proposées : ancienne / nouvelle version d'une diapo ----------
   * Une diapo modifiée garde son ancienne version dans le source, pour comparaison :
   *   { title, section, html: `nouvelle version`,
   *     rev: { id: 'identifiant-unique', note: 'ce qui change', old: { html: `ancienne version` } } }
   * (`old` peut aussi redéfinir title, layout…). Diapo ajoutée : `old: { absent: true }` (sautée tant que la
   * modification n'est pas acceptée ; plusieurs diapos peuvent partager le même `id` : une seule décision).
   * Mode révision (site servi par ./serve.sh, ou « ?review » dans l'URL) : bandeau Ancienne / Nouvelle (V),
   * boutons Accepter / Rejeter (décisions dans retours/<cours>-revisions.json) et bouton
   * « Suivant (modif) » (N) qui saute à la prochaine diapo modifiée non traitée.
   * Hors mode révision, une modification non acceptée n'est pas publiée : l'ancienne version est affichée.
   */
  const revIdx = slides.map((s, i) => (s.rev ? i : -1)).filter(i => i >= 0);
  let reviewMode = false, revServer = false;
  let decisions = {};
  try { decisions = JSON.parse(store.get('revisions')) || {}; } catch (e) { decisions = {}; }
  const revShow = {};   // id → 'old' | 'new' : version choisie pendant cette session
  const plain = x => String(x || '').replace(/<[^>]+>/g, '');
  const decided = s => (decisions[s.rev.id] || {}).status;
  function shownSlide(i) {
    const s = slides[i];
    if (!s || !s.rev) return s;
    const st = decided(s);
    const which = reviewMode ? (revShow[s.rev.id] || (st === 'rejetée' ? 'old' : 'new')) : (st === 'acceptée' ? 'new' : 'old');
    return which === 'old' ? Object.assign({}, s, s.rev.old || {}, { revShown: 'old' }) : Object.assign({}, s, { revShown: 'new' });
  }

  /* ---------- Thème ---------- */
  function applyTheme(t) {
    if (t) document.documentElement.dataset.theme = t;
    else delete document.documentElement.dataset.theme;
  }
  applyTheme(global.get('theme') || store.get('theme'));
  function toggleTheme() {
    const isDark = document.documentElement.dataset.theme
      ? document.documentElement.dataset.theme === 'dark'
      : matchMedia('(prefers-color-scheme: dark)').matches;
    const t = isDark ? 'light' : 'dark';
    applyTheme(t); global.set('theme', t);
  }

  /* ---------- Questionnaires interactifs : affichés ou masqués ---------- */
  const quizOff = () => document.body.classList.contains('quiz-off');
  const simOff = () => document.body.classList.contains('sim-off');
  /* Une diapo devient vide si, une fois retirés les QCM (masqués) et/ou les simulateurs (masqués),
   * il ne reste rien à montrer : elle est alors sautée. */
  const emptyCache = {};
  const clearEmptyCache = () => Object.keys(emptyCache).forEach(k => delete emptyCache[k]);
  function emptyWithout(i, noQuiz, noSim) {
    const key = i + ':' + (noQuiz ? 1 : 0) + (noSim ? 1 : 0);
    if (key in emptyCache) return emptyCache[key];
    const s = shownSlide(i);
    let res = false;
    const html = s && s.html || '';
    const has = (noQuiz && html.indexOf('class="quiz') >= 0) || (noSim && html.indexOf('w-sim') >= 0);
    if (s && !s.cover && !s.custom && has) {
      const box = document.createElement('div');
      box.innerHTML = html;
      if (noQuiz) box.querySelectorAll('.quiz').forEach(q => q.remove());
      if (noSim) box.querySelectorAll('.widget.w-sim').forEach(w => w.remove());
      const media = box.querySelector('img, video, figure, table, svg, .diagram, .widget, .cards, .callout, .variants');
      // une diapo de simulateur n'a souvent qu'une phrase d'introduction : sans le simulateur, elle n'a plus d'intérêt
      const limit = noSim && html.indexOf('w-sim') >= 0 ? 250 : 40;
      res = !media && box.textContent.replace(/\s+/g, '').length < limit;
      // diapo dédiée à un simulateur (« ▶ À vous… », « Simulateur : … ») : toujours sautée
      if (noSim && html.indexOf('w-sim') >= 0 && /^\s*(▶|Simulateur)/.test(String(s.title).replace(/<[^>]+>/g, ''))) res = true;
    }
    return (emptyCache[key] = res);
  }
  const quizOnly = i => emptyWithout(i, true, false);
  // `quiz: true` sur une diapo ou un chapitre : n'apparaît que lorsque les questionnaires sont affichés
  const quizPart = i => !!(slides[i] && (slides[i].quiz || slides[i].chapter.quiz));
  const hidden = i => (!reviewMode && !!(shownSlide(i) || {}).absent) ||
    (quizOff() && quizPart(i)) || ((quizOff() || simOff()) && emptyWithout(i, quizOff(), simOff()));
  function applyQuiz(off) {
    document.body.classList.toggle('quiz-off', off);
    const b = $('#btn-quiz');
    if (b) {
      b.classList.toggle('off', off);
      b.setAttribute('aria-pressed', String(!off));
      b.title = 'Questionnaires interactifs : ' + (off ? 'masqués' : 'affichés') + ' (Q)';
    }
  }
  function toggleQuiz() {
    const off = !quizOff();
    applyQuiz(off);
    global.set('quizOff', off ? '1' : '0');
    refreshTocVisibility();
    if (cur >= 0) {
      if (hidden(cur)) go(cur + 1 < slides.length ? cur + 1 : cur - 1);
      else { updateNav(); refit(); }
    }
  }
  applyQuiz(global.get('quizOff') === '1');

  /* ---------- Simulateurs pour les élèves : affichés ou masqués (présentation en cours) ---------- */
  const hasSims = slides.some(s => (s.html || '').indexOf('w-sim') >= 0);
  function applySim(off) {
    document.body.classList.toggle('sim-off', off);
    const b = $('#btn-sim');
    if (b) {
      b.hidden = !hasSims;
      b.classList.toggle('off', off);
      b.setAttribute('aria-pressed', String(!off));
      b.title = 'Simulateurs pour les élèves : ' + (off ? 'masqués' : 'affichés') + ' (S)';
    }
  }
  function toggleSim() {
    if (!hasSims) return;
    const off = !simOff();
    applySim(off);
    global.set('simOff', off ? '1' : '0');
    refreshTocVisibility();
    if (cur >= 0) {
      if (hidden(cur)) go(cur + 1 < slides.length ? cur + 1 : cur - 1);
      else go(cur);
    }
  }
  applySim(global.get('simOff') === '1');

  /* ---------- Sommaire ---------- */
  function buildToc() {
    const toc = $('#toc');
    let html = '';
    Course.chapters.forEach((ch, ci) => {
      const first = slides.findIndex(s => s.ci === ci);
      html += '<div class="toc-ch' + (ch.quiz ? ' quiz-ch' : '') + '" data-ci="' + ci + '" style="--ch:' + (ch.color || 'var(--accent)') + '">' +
        '<button class="toc-ch-btn" data-go="' + first + '"><span class="toc-num">' + (ch.num != null ? ch.num : '') + '</span>' +
        '<span class="toc-icon">' + (ch.icon || '') + '</span><span class="toc-name">' + ch.title + '</span></button>';
      const secs = ch.sections || [];
      if (secs.length) {
        html += '<div class="toc-secs">' + secs.map(sec => {
          const idx = slides.findIndex(s => s.ci === ci && s.section === sec);
          return idx < 0 ? '' : '<button class="toc-sec" data-go="' + idx + '" data-sec="' + sec + '">' + sec + '</button>';
        }).join('') + '</div>';
      }
      html += '</div>';
    });
    toc.innerHTML = html;
    refreshTocVisibility();
  }

  /* Sommaire : masque les sections / chapitres dont toutes les diapos sont cachées */
  function refreshTocVisibility() {
    $$('.toc-ch').forEach(chEl => {
      const ci = +chEl.dataset.ci;
      const idx = slides.map((s, i) => i).filter(i => slides[i].ci === ci);
      chEl.classList.toggle('all-hidden', idx.length > 0 && idx.every(hidden));
      $$('.toc-sec', chEl).forEach(b => {
        const sec = idx.filter(i => slides[i].section === b.dataset.sec);
        b.hidden = sec.length > 0 && sec.every(hidden);
      });
    });
  }

  function updateToc() {
    const s = slides[cur];
    $$('.toc-ch').forEach(el => el.classList.toggle('active', +el.dataset.ci === s.ci));
    $$('.toc-sec').forEach(el => el.classList.toggle('active',
      +el.closest('.toc-ch').dataset.ci === s.ci && el.dataset.sec === s.section));
    const act = $('.toc-sec.active') || $('.toc-ch.active .toc-ch-btn');
    const toc = $('#toc');
    if (act) {
      const r = act.getBoundingClientRect(), tr = toc.getBoundingClientRect();
      if (r.top < tr.top || r.bottom > tr.bottom) toc.scrollTop += r.top - tr.top - tr.height / 3;
    }
  }

  /* ---------- Rendu d'une diapo ---------- */
  function renderCover(s) {
    const ch = s.chapter;
    const secs = (ch.sections || []).map(sec => {
      const idx = slides.findIndex(x => x.ci === s.ci && x.section === sec);
      return idx < 0 ? '' : '<button class="chip" data-go="' + idx + '">' + sec + '</button>';
    }).join('');
    const count = slides.filter(x => x.ci === s.ci && !x.cover).length;
    return '<article class="slide cover" style="--ch:' + (ch.color || 'var(--accent)') + '">' +
      '<div class="cover-inner">' +
      '<div class="cover-num">' + (ch.num != null ? 'Chapitre ' + ch.num : '') + '</div>' +
      '<div class="cover-icon">' + (ch.icon || '') + '</div>' +
      '<h1 class="cover-title">' + ch.title + '</h1>' +
      (ch.intro ? '<p class="cover-intro">' + ch.intro + '</p>' : '') +
      (secs ? '<div class="chips">' + secs + '</div>' : '') +
      '<div class="cover-meta">' + count + ' diapos</div>' +
      '</div></article>';
  }

  function renderSlide(s) {
    if (s.cover) return renderCover(s);
    if (s.absent) s = Object.assign({}, s, { layout: 'center', html: '<p class="lead">Cette diapo n’existe pas dans l’ancienne version (diapo ajoutée).</p>' });
    if (s.custom) return '<article class="slide custom ' + (s.layout || '') + '">' + s.html + '</article>';
    return '<article class="slide ' + (s.layout || '') + '" style="--ch:' + (s.chapter.color || 'var(--accent)') + '">' +
      '<header class="slide-head">' +
      (s.section ? '<div class="slide-sec">' + s.chapter.title + ' · ' + s.section + '</div>' : '<div class="slide-sec">' + s.chapter.title + '</div>') +
      '<h1 class="slide-title">' + s.title + '</h1></header>' +
      '<div class="slide-body">' + (s.html || '') + '</div></article>';
  }

  /* Ajuste la diapo à la place disponible : jamais de barre de défilement, et une diapo courte est
   * agrandie (jusqu'à MAX_ZOOM) pour occuper l'écran — lisibilité en amphi. En agrandissant, le texte se
   * replie mais pas les lignes de code : on vérifie qu'aucun bloc ne déborde plus en largeur qu'au zoom 1
   * et qu'aucune ligne de code n'est repliée en plus. */
  const MAX_ZOOM = 1.5;
  function fit() {
    const art = viewport.firstElementChild;
    if (!art) return;
    // --z : le zoom courant, pour les hauteurs en vh qui ne doivent pas être agrandies (diapos centrées)
    const zoom = z => { art.style.zoom = z; art.style.setProperty('--z', z); };
    zoom(1);
    // mesure sans barre de défilement : son apparition changerait la largeur, donc la hauteur du texte
    viewport.classList.add('fitted');
    // débordement horizontal : lignes de code (défilement interne) et blocs qui dépassent le bord de la diapo
    // (comparaison de bords : insensible à l'animation d'entrée, qui décale la diapo)
    const pres = $$('pre', art), all = $$('*', art);
    const overX = () => {
      const right = art.getBoundingClientRect().right;
      return pres.reduce((n, el) => n + Math.max(0, el.scrollWidth - el.clientWidth), 0) +
        all.reduce((m, el) => Math.max(m, el.getBoundingClientRect().right - right), 0);
    };
    const fitsY = () => viewport.scrollHeight <= viewport.clientHeight + 1;
    // lignes de code repliées (white-space: pre-wrap) : nombre de lignes visuelles en trop
    const lns = $$('.ln', art).filter(el => el.textContent.trim());
    const wraps = () => {
      const hs = lns.map(el => el.getBoundingClientRect().height).filter(h => h > 0);   // lignes masquées (onglets…) : 0
      if (!hs.length) return 0;
      const one = Math.min(...hs);
      return hs.reduce((n, h) => n + Math.round(h / one) - 1, 0);
    };
    if (!fitsY()) {
      let lo = 0.4, hi = 1;
      for (let k = 0; k < 8; k++) {
        const m = (lo + hi) / 2;
        zoom(m);
        if (fitsY()) lo = m; else hi = m;
      }
      zoom(lo);
      for (let k = 0; k < 10 && !fitsY() && lo > 0.3; k++) { lo -= 0.02; zoom(lo); }
    } else if (!art.classList.contains('cover')) {
      const base = overX(), baseWraps = lns.length ? wraps() : 0;
      const fits = () => fitsY() && overX() <= base + 2 && (!lns.length || wraps() <= baseWraps);
      let lo = 1, hi = MAX_ZOOM;
      zoom(hi);
      if (fits()) lo = hi;
      else for (let k = 0; k < 7; k++) {
        const m = (lo + hi) / 2;
        zoom(m);
        if (fits()) lo = m; else hi = m;
      }
      zoom(lo);
    }
    viewport.classList.toggle('fitted', fitsY());
  }
  let fitTimer = null;
  function refit() { clearTimeout(fitTimer); fitTimer = setTimeout(fit, 30); }

  // un fragment et ceux qui le suivent avec la classe `with-prev` (H.frag(…, {withPrev: true})) forment une seule étape
  function fragGroup(el) {
    const all = $$('.frag', viewport);
    let k = all.indexOf(el);
    while (k > 0 && all[k].classList.contains('with-prev')) k--;
    const g = [all[k]];
    for (let j = k + 1; j < all.length && all[j].classList.contains('with-prev'); j++) g.push(all[j]);
    return g;
  }
  function fragStepper(el) {
    const g = fragGroup(el);
    const set = on => g.forEach(f => f.classList.toggle('shown', on));
    return {
      el,
      next() { if (!el.classList.contains('shown')) { set(true); return true; } return false; },
      prev() { if (el.classList.contains('shown')) { set(false); return true; } return false; },
      reset(toEnd) { set(!!toEnd); }
    };
  }

  /* Diapo visible suivante / précédente (les diapos « questionnaire seul » sont sautées si masquées). */
  function nextVisible(i, dir) {
    let j = i + dir;
    while (j >= 0 && j < slides.length && hidden(j)) j += dir;
    return j >= 0 && j < slides.length ? j : -1;
  }
  function updateNav() {
    $('#btn-prev').disabled = nextVisible(cur, -1) < 0;
    $('#btn-next').disabled = nextVisible(cur, 1) < 0;
    updateNextLabel();
  }

  function go(i, opts = {}) {
    i = Math.max(0, Math.min(slides.length - 1, i));
    const dir = i >= cur ? 1 : -1;
    if (hidden(i) && !opts.force) {   // force : diapo masquée affichée quand même (navigation entre modifications)
      let j = nextVisible(i - dir, dir);
      if (j < 0) j = nextVisible(i + dir, -dir);
      if (j >= 0) i = j;
    }
    const s = slides[i];
    const shown = shownSlide(i);
    viewport.innerHTML = renderSlide(shown);
    const art = viewport.firstElementChild;
    art.classList.add(dir > 0 ? 'enter-right' : 'enter-left');
    if (reviewMode && s.rev) {
      art.dataset.rev = shown.revShown === 'old' ? 'ANCIENNE' : 'NOUVELLE';
      const other = shown.revShown === 'old' ? Object.assign({}, s, { revShown: 'new' }) : Object.assign({}, s, s.rev.old || {}, { revShown: 'old' });
      if (!shown.absent && !other.absent) try { markRevDiff(art, other); } catch (e) { /* mise en évidence facultative */ }
    }
    if (s.group) groupNav(art, i);
    if (hidden(i)) art.classList.add('forced');   // diapo masquée ouverte depuis « Suivant (modif) » : on montre tout
    $$('.diagram', art).forEach(Diagram.mount);
    if (window.Widgets) $$('.widget', art).forEach(el => { if (!(simOff() && el.classList.contains('w-sim'))) Widgets.mount(el); });
    // les médias changent la hauteur une fois chargés : on réajuste
    $$('img', art).forEach(im => { if (!im.complete) im.addEventListener('load', refit, { once: true }); });
    $$('video', art).forEach(v => v.addEventListener('loadedmetadata', refit, { once: true }));
    steppers = $$('.frag:not(.with-prev), .diagram, .widget', art)
      .filter(el => el.classList.contains('frag') || (el.classList.contains('widget') ? !!el._stepper && !(simOff() && el.classList.contains('w-sim')) : $$('.dg-dots i', el).length > 1))
      .map(el => el.classList.contains('frag') ? fragStepper(el) : el.classList.contains('widget') ? el._stepper : Diagram.stepper(el));
    if (opts.toEnd) steppers.forEach(st => st.reset(true));
    cur = i;
    viewport.scrollTop = 0;
    store.set('slide', i);
    if (location.hash.split('.')[0] !== '#' + (i + 1)) history.replaceState(null, '', '#' + (i + 1));
    $('#counter').innerHTML = '<b>' + (i + 1) + '</b> / ' + slides.length;
    $('#progress-bar').style.width = ((i + 1) / slides.length * 100) + '%';
    $('#crumb').innerHTML = '<span class="crumb-ch" style="--ch:' + (s.chapter.color || 'var(--accent)') + '">' +
      (s.chapter.icon || '') + ' ' + s.chapter.title + '</span>' + (s.section ? '<span class="crumb-sep">›</span><span>' + s.section + '</span>' : '');
    document.title = (s.cover ? s.chapter.title : plain(shown.title)) + ' — ' + BASE_TITLE;
    updateToc();
    updateNav();
    updateReviewUi();
    fit();
    if (window.innerWidth < 900) document.body.classList.remove('toc-open');
  }

  /* Diapos d'une même série (slide.group, ex. un exemple fil rouge) : boutons pour sauter de l'une à l'autre. */
  function groupNav(art, i) {
    const g = slides[i].group;
    const idx = slides.map((x, j) => j).filter(j => slides[j].group === g && (j === i || !hidden(j)));
    const k = idx.indexOf(i), head = $('.slide-head', art);
    if (!head) return;
    const btn = (j, label) => '<button class="grp-btn"' + (j === undefined ? ' disabled' : ' data-go="' + j + '"') + '>' + label + '</button>';
    head.insertAdjacentHTML('afterbegin', '<nav class="grp-nav">' + btn(idx[k - 1], '← précédent') +
      '<span>' + (k + 1) + ' / ' + idx.length + '</span>' + btn(idx[k + 1], 'suivant →') + '</nav>');
  }

  /* Indique sur le bouton « Suivant » s'il reste des étapes dans la diapo. */
  function updateNextLabel() {
    const pendingFrags = $$('.frag:not(.shown):not(.with-prev)', viewport).length;
    const pendingDg = $$('.diagram', viewport).reduce((n, d) => n + $$('.dg-dots i:not(.on)', d).length, 0);
    const pending = pendingFrags + pendingDg;
    const b = $('#btn-next');
    b.textContent = pending ? 'Étape suivante (' + pending + ') →' : 'Suivant →';
    b.classList.toggle('pending', pending > 0);
    if (pending) b.disabled = false;
  }
  function next(skip) {
    if (!skip) for (const st of steppers) if (st.next()) { refit(); return updateNextLabel(); }
    const j = nextVisible(cur, 1);
    if (j >= 0) go(j);
  }
  function prev(skip) {
    if (!skip) for (const st of steppers.slice().reverse()) if (st.prev()) { refit(); return updateNextLabel(); }
    const j = nextVisible(cur, -1);
    if (j >= 0) go(j, { toEnd: !skip });
  }

  /* ---------- Vue d'ensemble ---------- */
  function openOverview() {
    const grid = $('#ov-grid');
    let html = '';
    let lastCi = -1;
    slides.forEach((s0, i) => {
      const s = shownSlide(i);
      if (s.absent && !reviewMode) return;
      if (s.ci !== lastCi) {
        html += '<h3 class="ov-ch" style="--ch:' + (s.chapter.color || 'var(--accent)') + '">' + (s.chapter.icon || '') + ' ' + s.chapter.title + '</h3>';
        lastCi = s.ci;
      }
      const text = (s.title + ' ' + (s.section || '') + ' ' + (s.html || '')).replace(/<[^>]+>/g, ' ').toLowerCase();
      html += '<button class="ov-card' + (i === cur ? ' current' : '') + (s.cover ? ' is-cover' : '') + (quizOnly(i) || quizPart(i) ? ' quiz-only' : '') + (emptyWithout(i, false, true) ? ' sim-only' : '') +
        (reviewMode && s0.rev ? ' has-rev' + (decided(s0) ? ' rev-done' : '') : '') +
        '" data-go="' + i + '" data-text="' + H.esc(text).replace(/"/g, '&quot;') + '" style="--ch:' + (s.chapter.color || 'var(--accent)') + '">' +
        '<span class="ov-n">' + (i + 1) + '</span><span class="ov-t">' + (s.cover ? 'Chapitre : ' + s.chapter.title : s.title) + '</span>' +
        (s.section ? '<span class="ov-s">' + s.section + '</span>' : '') + '</button>';
    });
    grid.innerHTML = html;
    openModal('#overview');
    const inp = $('#ov-search');
    inp.value = '';
    setTimeout(() => inp.focus(), 30);
    const curCard = $('.ov-card.current', grid);
    if (curCard) { const box = $('#overview .modal-inner'); box.scrollTop = curCard.offsetTop - box.clientHeight / 2; }
  }
  $('#ov-search').addEventListener('input', e => {
    const q = e.target.value.trim().toLowerCase();
    $$('.ov-card').forEach(c => { c.hidden = q && !c.dataset.text.includes(q); });
    $$('.ov-ch').forEach(h => {
      let el = h.nextElementSibling, any = false;
      while (el && !el.classList.contains('ov-ch')) { if (!el.hidden) any = true; el = el.nextElementSibling; }
      h.hidden = !any;
    });
  });

  function openModal(sel) { $(sel).hidden = false; document.body.classList.add('modal-open'); }
  function closeModals() { $$('.modal').forEach(m => { m.hidden = true; }); document.body.classList.remove('modal-open'); }

  /* ---------- Interactions (délégation) ---------- */
  // un widget a changé de taille / de contenu : on réajuste la diapo
  document.addEventListener('widget:resize', () => refit());
  document.addEventListener('input', e => { if (e.target.closest && e.target.closest('.widget')) refit(); });

  document.addEventListener('click', e => {
    const t = e.target;
    if (t.closest('.widget')) setTimeout(refit, 0);
    const goEl = t.closest('[data-go]');
    if (goEl) { const i = +goEl.dataset.go; if (i >= 0) { closeModals(); go(i); } return; }
    if (t.closest('[data-close]') || t.classList.contains('modal')) { closeModals(); return; }

    // QCM
    const opt = t.closest('.quiz-opt');
    if (opt) {
      const q = opt.closest('.quiz');
      if (q.dataset.poll === 'true') { $$('.quiz-opt', q).forEach(o => o.classList.toggle('picked', o === opt && !o.classList.contains('picked'))); return; }
      if (q.classList.contains('done')) return;
      if (q.dataset.multi === 'true') { opt.classList.toggle('picked'); return; }
      finishQuiz(q, [+opt.dataset.k]);
      return;
    }
    const val = t.closest('.quiz-validate');
    if (val) {
      const q = val.closest('.quiz');
      finishQuiz(q, $$('.quiz-opt.picked', q).map(o => +o.dataset.k));
      return;
    }
    // chrono de QCM
    const tb = t.closest('.quiz-timer');
    if (tb) {
      if (tb.timer) { clearInterval(tb.timer); tb.timer = null; tb.textContent = '⏱ ' + tb.dataset.s + ' s'; tb.classList.remove('running', 'over'); return; }
      let left = +tb.dataset.s;
      tb.classList.add('running');
      tb.textContent = '⏱ ' + left + ' s';
      tb.timer = setInterval(() => {
        left--;
        tb.textContent = left > 0 ? '⏱ ' + left + ' s' : '⏰ Temps écoulé';
        if (left <= 0) { clearInterval(tb.timer); tb.timer = null; tb.classList.remove('running'); tb.classList.add('over'); }
      }, 1000);
      return;
    }
    // agrandir une image
    const zi = t.closest('img[data-zoom]');
    if (zi) {
      const lb = document.createElement('div');
      lb.className = 'lightbox';
      lb.innerHTML = '<img src="' + zi.getAttribute('src') + '" alt="">';
      lb.addEventListener('click', () => lb.remove());
      document.body.appendChild(lb);
      return;
    }
    // réponse cachée
    const rb = t.closest('.reveal-btn');
    if (rb) {
      const body = rb.nextElementSibling;
      body.hidden = !body.hidden;
      rb.classList.toggle('open', !body.hidden);
      refit();
      return;
    }
    // onglets de variantes
    const tab = t.closest('.var-tab');
    if (tab) {
      const v = tab.closest('.variants');
      $$('.var-tab', v).forEach(b => b.classList.toggle('active', b === tab));
      $$('.var-panel', v).forEach(p => p.classList.toggle('active', p.dataset.k === tab.dataset.k));
      refit();
      return;
    }
    // diagrammes
    const dgb = t.closest('.dg-prev, .dg-next, .dg-dots i');
    if (dgb) {
      const d = dgb.closest('.diagram');
      const k = +d.dataset.step;
      if (dgb.classList.contains('dg-prev')) Diagram.show(d, k - 1, k);
      else if (dgb.classList.contains('dg-next')) Diagram.show(d, k + 1, k);
      else Diagram.show(d, +dgb.dataset.k, k);
      updateNextLabel();
      refit();
      return;
    }
    // copier le code
    const cb = t.closest('.copy-btn');
    if (cb) {
      const txt = $$('.ln', cb.parentElement).map(l => l.textContent.replace(/ /g, ' ')).join('\n');
      const done = () => { cb.textContent = '✓'; setTimeout(() => { cb.textContent = '⧉'; }, 1200); };
      if (navigator.clipboard) navigator.clipboard.writeText(txt).then(done, () => {}); else done();
      return;
    }
    // fragment cliquable
    const fr = t.closest('.frag:not(.shown)');
    if (fr) { fragGroup(fr).forEach(f => f.classList.add('shown')); updateNextLabel(); }
  });

  function finishQuiz(q, picked) {
    const ans = q.dataset.answer.split(',').map(Number);
    const ok = picked.length === ans.length && picked.every(k => ans.includes(k));
    q.classList.add('done', ok ? 'right' : 'wrong');
    $$('.quiz-opt', q).forEach(o => {
      const k = +o.dataset.k;
      if (ans.includes(k)) o.classList.add('correct');
      else if (picked.includes(k)) o.classList.add('incorrect');
    });
    const ex = $('.quiz-explain', q);
    ex.innerHTML = '<div class="verdict">' + (ok ? '🎉 Bonne réponse !' : '❌ Pas tout à fait…') + '</div>' + ex.innerHTML;
    ex.hidden = false;
    refit();
  }

  $('#btn-next').addEventListener('click', () => next());
  $('#btn-prev').addEventListener('click', () => prev());
  $('#btn-menu').addEventListener('click', () => {
    document.body.classList.toggle('toc-open');
    document.body.classList.toggle('toc-closed', !document.body.classList.contains('toc-open') && window.innerWidth >= 900);
  });
  // fermer le sommaire (mobile) : croix, fond assombri, Échap
  const closeToc = () => document.body.classList.remove('toc-open');
  if ($('#btn-toc-close')) $('#btn-toc-close').addEventListener('click', closeToc);
  if ($('#sb-backdrop')) $('#sb-backdrop').addEventListener('click', closeToc);
  $('#btn-theme').addEventListener('click', toggleTheme);
  if ($('#btn-quiz')) $('#btn-quiz').addEventListener('click', toggleQuiz);
  if ($('#btn-sim')) $('#btn-sim').addEventListener('click', toggleSim);
  $('#btn-overview').addEventListener('click', openOverview);
  $('#btn-help').addEventListener('click', () => openModal('#help'));
  function toggleFull() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
    else document.exitFullscreen && document.exitFullscreen();
  }
  $('#btn-full').addEventListener('click', toggleFull);

  /* Plein écran (API ou F11) : pleine largeur, sans sommaire. */
  function syncFullscreen() {
    // F11 n'est détectable que par la taille de la fenêtre : seulement sur ordinateur (sur mobile, fenêtre = écran)
    const f11 = window.innerWidth >= 900 && !matchMedia('(pointer: coarse)').matches &&
      window.innerHeight >= screen.height - 2 && window.innerWidth >= screen.width - 2;
    const full = !!document.fullscreenElement || f11;
    const was = document.body.classList.contains('fullscreen');
    document.body.classList.toggle('fullscreen', full);
    if (!full) document.body.classList.remove('top-shown');
    if (full && !was) document.body.classList.remove('toc-open');   // en plein écran : sommaire fermé (M pour le rouvrir)
    refit();
  }
  document.addEventListener('fullscreenchange', syncFullscreen);
  // plein écran : en-tête masqué, affiché quand la souris (ou un doigt) arrive tout en haut, caché quand elle s'en éloigne
  function topReveal(y) {
    const b = document.body;
    if (!b.classList.contains('fullscreen')) { b.classList.remove('top-shown'); return; }
    const shown = b.classList.contains('top-shown');
    b.classList.toggle('top-shown', y <= 6 || (shown && y <= $('#topbar').offsetHeight + 12));
  }
  document.addEventListener('mousemove', e => topReveal(e.clientY));
  document.addEventListener('touchstart', e => { if (e.touches[0]) topReveal(e.touches[0].clientY < 30 ? 0 : 1e6); }, { passive: true });
  document.documentElement.addEventListener('mouseleave', e => { if (e.clientY <= 0) topReveal(0); });
  window.addEventListener('resize', syncFullscreen);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refit);
  // polices web (display=swap) arrivées après coup : elles changent la largeur du texte et du code
  if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', refit);
  // la zone de diapo change de largeur sans redimensionner la fenêtre (sommaire ouvert / fermé, plein écran)
  if (window.ResizeObserver) { let vw = 0; new ResizeObserver(() => { if (viewport.clientWidth !== vw) { vw = viewport.clientWidth; refit(); } }).observe(viewport); }
  { const sb = document.getElementById('sidebar'); if (sb) sb.addEventListener('transitionend', e => { if (e.target === sb) refit(); }); }

  document.addEventListener('keydown', e => {
    if (e.target.matches && e.target.matches('input, textarea, select')) { if (e.key === 'Escape') closeModals(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const modal = document.body.classList.contains('modal-open');
    if (e.key === 'Escape') {
      $$('.lightbox').forEach(l => l.remove()); closeModals();
      if (window.innerWidth < 900) document.body.classList.remove('toc-open');
      return;
    }
    if (modal) return;
    switch (e.key) {
      case 'ArrowRight': case 'PageDown': case ' ': e.preventDefault(); next(e.shiftKey); break;
      case 'ArrowLeft': case 'PageUp': e.preventDefault(); prev(e.shiftKey); break;
      case 'Home': e.preventDefault(); go(0); break;
      case 'End': e.preventDefault(); go(slides.length - 1); break;
      case 'm': case 'M': $('#btn-menu').click(); break;
      case 'o': case 'O': openOverview(); break;
      case 't': case 'T': toggleTheme(); break;
      case 'q': case 'Q': toggleQuiz(); break;
      case 's': case 'S': toggleSim(); break;
      case 'f': case 'F': toggleFull(); break;
      case 'n': case 'N': if (reviewMode) nextRev(); break;
      case 'v': case 'V': if (reviewMode && slides[cur].rev) showVersion(shownSlide(cur).revShown === 'old' ? 'new' : 'old'); break;
      case '?': openModal('#help'); break;
    }
  });

  // balayage tactile
  let tx = null, ty = null;
  viewport.addEventListener('touchstart', e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
  viewport.addEventListener('touchend', e => {
    if (tx == null) return;
    const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
    if (Math.abs(dx) > 60 && Math.abs(dx) > 2 * Math.abs(dy)) (dx < 0 ? next : prev)();
    tx = null;
  });

  window.addEventListener('hashchange', () => {
    const n = parseInt(location.hash.slice(1).split('.')[0], 10);
    if (n && n - 1 !== cur) go(n - 1);
  });

  /* ---------- Mode révision : interface ---------- */
  function saveDecisions() {
    store.set('revisions', JSON.stringify(decisions));
    if (!revServer) return;
    fetch('api/revisions', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ format: 'cours-revisions/1', version: CID, updated: new Date().toISOString(), revisions: decisions }, null, 2)
    }).catch(() => {});
  }
  function rerender() { clearEmptyCache(); refreshTocVisibility(); go(cur); }
  function decide(status) {
    const s = slides[cur];
    if (!s || !s.rev) return;
    const id = s.rev.id;
    if (!status || decided(s) === status) delete decisions[id];   // re-cliquer sur la décision prise l'annule
    else decisions[id] = { status, updated: new Date().toISOString(), title: plain(s.title), file: s.src || '', note: s.rev.note || '' };
    delete revShow[id];
    saveDecisions();
    // décision prise : on enchaîne sur la prochaine modification à valider (s'il en reste)
    if (decisions[id] && revIdx.some(i => !decided(slides[i]))) { clearEmptyCache(); refreshTocVisibility(); nextRev(); }
    else rerender();
  }
  /* Encadre en rouge ce qui diffère entre la version affichée et l'autre version : on découpe chaque
   * version en « unités » (lignes de code, blocs de texte feuilles) et on garde celles qui ne font pas
   * partie de la plus longue sous-suite commune. */
  const DIFF_BLOCK = /^(P|LI|H[1-6]|TD|TH|DT|DD|FIGCAPTION|BLOCKQUOTE|DIV|PRE|BUTTON|FIGURE|TABLE|TR|UL|OL|HEADER|ARTICLE)$/;
  function diffUnits(root) {
    const units = [];
    const isBlock = el => el.classList.contains('ln') || DIFF_BLOCK.test(el.tagName);
    const norm = h => h.replace(/\s(id|data-k|style)="[^"]*"/g, '').replace(/\s+/g, ' ').trim();
    (function walk(el) {
      if (el.tagName === 'svg' || el.tagName === 'SVG' || el.classList.contains('copy-btn')) return;
      const kids = [...el.children];
      if (el !== root && isBlock(el) && (el.classList.contains('ln') || ![...el.querySelectorAll('*')].some(isBlock))) {
        units.push({ el, key: norm(el.innerHTML) });
        return;
      }
      // bloc mixte : texte directement dans le bloc, à côté de sous-blocs (ex. corps d'un encadré)
      const own = [...el.childNodes].filter(n => n.nodeType === 3 ? n.textContent.trim() : !isBlock(n) && n.tagName !== 'svg');
      if (el !== root && isBlock(el) && own.length) units.push({ el, key: norm(own.map(n => n.nodeType === 3 ? n.textContent : n.outerHTML).join('')), mixed: true });
      kids.forEach(walk);
    })(root);
    return units;
  }
  function markRevDiff(art, other) {
    const tmp = document.createElement('div');
    tmp.innerHTML = renderSlide(other);
    const a = diffUnits(art), b = diffUnits(tmp.firstElementChild || tmp);
    // plus longue sous-suite commune (tailles modestes : O(n·m) suffit)
    const n = a.length, m = b.length, L = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--)
      L[i][j] = a[i].key === b[j].key ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    const changed = [];
    for (let i = 0, j = 0; i < n;) {
      if (j < m && a[i].key === b[j].key) { i++; j++; }
      else if (j < m && L[i][j + 1] >= L[i + 1][j]) j++;
      else changed.push(a[i++]);
    }
    let removedOnly = !changed.length && m > n;   // rien d'ajouté ici mais des unités retirées : on le signale
    changed.forEach(u => {
      const el = u.el;
      el.classList.add(el.classList.contains('ln') ? 'rev-diff-ln' : 'rev-diff');
      // unité dans un contenu caché (onglet inactif, réponse repliée) : on signale aussi le bouton qui l'ouvre
      const panel = el.closest('.var-panel');
      if (panel && !panel.classList.contains('active')) {
        const tab = panel.parentNode.querySelector('.var-tab[data-k="' + panel.dataset.k + '"]');
        if (tab) tab.classList.add('rev-diff');
      }
      const rv = el.closest('.reveal');
      if (rv) rv.querySelector('.reveal-btn').classList.add('rev-diff');
    });
    // lignes de code modifiées consécutives : un seul rectangle
    $$('.rev-diff-ln', art).forEach(l => {
      if (!(l.previousElementSibling && l.previousElementSibling.classList.contains('rev-diff-ln'))) l.classList.add('rd-top');
      if (!(l.nextElementSibling && l.nextElementSibling.classList.contains('rev-diff-ln'))) l.classList.add('rd-bot');
    });
    if (removedOnly) art.classList.add('rev-removed');
  }
  function showVersion(v) {
    const s = slides[cur];
    if (!s || !s.rev) return;
    revShow[s.rev.id] = v;
    rerender();
  }
  function nextRev() {
    const pending = revIdx.filter(i => !decided(slides[i]));
    const pool = pending.length ? pending : revIdx;
    if (!pool.length) return;
    const j = pool.find(i => i > cur);
    closeModals();
    go(j != null ? j : pool[0], { force: true });
  }
  function updateReviewUi() {
    if (!reviewMode) return;
    const pending = revIdx.filter(i => !decided(slides[i])).length;
    const nb = $('#btn-nextrev');
    nb.innerHTML = 'Suivant (modif) ⇥ <span class="rev-count' + (pending ? '' : ' done') + '">' + (pending || '✓') + '</span>';
    nb.title = pending ? pending + ' modification(s) à valider sur ' + revIdx.length + ' — aller à la suivante (N)' : 'Toutes les modifications ont été traitées (N : les parcourir)';
    const bar = $('#rev-bar');
    const s = slides[cur];
    if (!s || !s.rev) { bar.hidden = true; return; }
    const v = shownSlide(cur).revShown, st = decided(s);
    const n = revIdx.indexOf(cur) + 1;
    bar.hidden = false;
    bar.innerHTML = '<span class="rev-label">✎ Modification ' + n + '/' + revIdx.length + '</span>' +
      '<span class="rev-note">' + (s.rev.note || '') + '</span>' +
      '<span class="rev-switch" title="Basculer entre les deux versions (V)">' +
      '<button data-rev="old" class="' + (v === 'old' ? 'active' : '') + '">Ancienne</button>' +
      '<button data-rev="new" class="' + (v === 'new' ? 'active' : '') + '">Nouvelle</button></span>' +
      '<button data-rev="accept" class="rev-btn ok' + (st === 'acceptée' ? ' active' : '') + '" title="Garder la nouvelle version">✔ ' + (st === 'acceptée' ? 'Acceptée' : 'Accepter') + '</button>' +
      '<button data-rev="reject" class="rev-btn no' + (st === 'rejetée' ? ' active' : '') + '" title="Garder l’ancienne version">✘ ' + (st === 'rejetée' ? 'Rejetée' : 'Rejeter') + '</button>';
  }
  function enableReview() {
    if (!revIdx.length || reviewMode) return;
    reviewMode = true;
    document.body.classList.add('review');
    const bar = document.createElement('div');
    bar.id = 'rev-bar';
    bar.hidden = true;
    viewport.parentNode.insertBefore(bar, viewport);
    bar.addEventListener('click', e => {
      const b = e.target.closest('[data-rev]');
      if (!b) return;
      const a = b.dataset.rev;
      if (a === 'old' || a === 'new') showVersion(a);
      else decide(a === 'accept' ? 'acceptée' : 'rejetée');
    });
    const group = document.createElement('div');
    group.className = 'nav-group';
    const next = $('#btn-next');
    next.parentNode.insertBefore(group, next);
    const nb = document.createElement('button');
    nb.className = 'nav-btn rev-next';
    nb.id = 'btn-nextrev';
    nb.addEventListener('click', nextRev);
    group.append(nb, next);
    const keys = $('#help table.keys');
    if (keys) keys.insertAdjacentHTML('beforeend',
      '<tr><td><kbd>N</kbd></td><td>Mode révision : diapo modifiée suivante</td></tr>' +
      '<tr><td><kbd>V</kbd></td><td>Mode révision : ancienne / nouvelle version</td></tr>');
    clearEmptyCache();
    refreshTocVisibility();
    if (cur >= 0) { if (slides[cur].rev) go(cur); else updateReviewUi(); }
  }
  function initReview() {
    if (!revIdx.length) return;
    const forced = /[?&]review\b/.test(location.search);
    if (location.protocol === 'file:') { if (forced) enableReview(); return; }
    fetch('api/revisions', { cache: 'no-store' }).then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        revServer = true;
        decisions = (data && data.revisions) || {};
        store.set('revisions', JSON.stringify(decisions));
        enableReview();
      })
      .catch(() => { if (forced) enableReview(); });
  }

  /* API minimale pour les modules annexes (demandes de modification…) */
  window.App = {
    current() {
      const s = slides[cur];
      const step = $$('.frag.shown:not(.with-prev)', viewport).length +
        $$('.diagram', viewport).reduce((n, d) => n + (+d.dataset.step || 0), 0);
      return {
        index: cur + 1, total: slides.length, step,
        title: s.cover ? 'Chapitre : ' + s.chapter.title : plain(shownSlide(cur).title),
        chapter: s.chapter.title, section: s.origSection || s.section || '', annex: !!s.annex,
        file: s.src || '', hash: '#' + (cur + 1) + (step ? '.' + step : '')
      };
    },
    go: i => go(i),
    isModalOpen: () => document.body.classList.contains('modal-open'),
    openModal, closeModals
  };

  buildToc();
  initReview();
  // sommaire ouvert d'emblée, sans animation : la largeur de la diapo est connue dès le premier ajustement
  if (window.innerWidth >= 900) {
    document.body.classList.add('no-anim', 'toc-open');
    requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.remove('no-anim')));
  }
  // #12 : diapo 12 ; #12.3 : diapo 12 après 3 étapes
  const [hs, hk] = location.hash.slice(1).split('.').map(x => parseInt(x, 10));
  const saved = parseInt(store.get('slide'), 10);
  go(hs ? hs - 1 : (saved >= 0 ? saved : 0));
  for (let k = 0; k < (hk || 0); k++) next();
})();
