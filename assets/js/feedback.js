/*
 * Demandes de modification sur la diapo courante.
 *   - Taper « !!! » (ou le bouton ✎) ouvre le formulaire pour la diapo affichée.
 *   - Fonction réservée au travail en local : active seulement si le site est servi par ./serve.sh
 *     (le serveur répond à GET <cours>/api/modifs). En ligne (GitHub Pages…) ou en file://, le bouton,
 *     le raccourci et la ligne de l'aide sont absents (body.fb-on non posé).
 *   - Les demandes sont stockées dans le navigateur (localStorage) et sur disque :
 *     retours/<id-du-cours>.json (GET/PUT <cours>/api/modifs).
 *   - L'identifiant du cours vient de <html data-course-id="…"> (ex. cpp, prog2).
 *   - Export JSON / copie possibles depuis le formulaire.
 */
(function () {
  const VERSION = document.documentElement.dataset.courseId || 'cours';
  // clé historique conservée pour le cours C++ v2
  const KEY = VERSION === 'cpp' ? 'cpp-cours:modifs:v2' : 'cours:' + VERSION + ':modifs';
  const TOMB = KEY + ':deleted';
  const API = 'api/modifs';
  const TYPES = ['Texte', 'Code', 'Schéma', 'Mise en page', 'Ajouter', 'Supprimer', 'Autre'];
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  let items = [];
  let server = false;      // le serveur local accepte-t-il l'enregistrement sur disque ?
  let editing = null;      // id en cours d'édition
  let type = TYPES[0];
  let view = 'slide';      // 'slide' | 'all'

  /* ---------- stockage ---------- */
  function readLocal(k, def) { try { return JSON.parse(localStorage.getItem(k)) || def; } catch (e) { return def; } }
  function writeLocal(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function payload() {
    return { format: 'cours-modifs/1', version: VERSION, updated: new Date().toISOString(), modifs: items };
  }
  function save() {
    writeLocal(KEY, items);
    updateBadge();
    if (!server) { setStatus(); return; }
    fetch(API, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload(), null, 2) })
      .then(r => { server = r.ok; setStatus(); })
      .catch(() => { server = false; setStatus(); });
  }
  function load() {
    if (location.protocol === 'file:') return;
    fetch(API, { cache: 'no-store' }).then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        server = true;
        document.body.classList.add('fb-on');   // serveur local : la fonctionnalité devient disponible
        items = readLocal(KEY, []);
        const dead = new Set(readLocal(TOMB, []));
        const byId = {};
        (data.modifs || []).forEach(m => { if (!dead.has(m.id)) byId[m.id] = m; });
        items.forEach(m => { if (!byId[m.id] || (m.updated || '') > (byId[m.id].updated || '')) byId[m.id] = m; });
        items = Object.values(byId).sort((a, b) => a.slide.index - b.slide.index || a.created.localeCompare(b.created));
        save();
      })
      .catch(() => {});   // pas de serveur local : fonctionnalité désactivée
  }

  /* ---------- interface ---------- */
  const modal = document.createElement('div');
  modal.id = 'feedback';
  modal.className = 'modal';
  modal.hidden = true;
  modal.innerHTML = '<div class="modal-inner fb-inner"><div class="fb-body"></div></div>';
  document.body.appendChild(modal);

  function setStatus() {
    const el = $('.fb-status', modal);
    if (!el) return;
    el.innerHTML = server
      ? '💾 Enregistré sur disque : <code>retours/' + VERSION + '.json</code>'
      : '🌐 Enregistré dans ce navigateur uniquement — pensez à <b>exporter</b> (ou lancez le site avec <code>./serve.sh</code>).';
  }

  function updateBadge() {
    const b = $('#btn-feedback .fb-count');
    const n = items.filter(m => m.status !== 'fait').length;
    if (b) { b.textContent = n; b.hidden = !n; }
  }

  function itemHtml(m, withSlide) {
    return '<li class="fb-item' + (m.status === 'fait' ? ' done' : '') + '" data-id="' + m.id + '">' +
      '<div class="fb-item-head"><span class="fb-type">' + esc(m.type) + '</span>' +
      (withSlide ? '<button class="fb-link" data-goto="' + m.slide.index + '">#' + m.slide.index + ' · ' + esc(m.slide.title) + '</button>' : '') +
      '<span class="fb-date">' + new Date(m.updated).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) + '</span>' +
      '<span class="fb-actions"><button data-act="edit" title="Modifier">✎</button>' +
      '<button data-act="toggle" title="Marquer fait / à faire">' + (m.status === 'fait' ? '↺' : '✓') + '</button>' +
      '<button data-act="del" title="Supprimer">🗑</button></span></div>' +
      '<div class="fb-text">' + esc(m.text).replace(/\n/g, '<br>') + '</div></li>';
  }

  function render() {
    const cur = window.App.current();
    const body = $('.fb-body', modal);
    const mine = items.filter(m => m.slide.index === cur.index && m.slide.title === cur.title);
    const edit = editing ? items.find(m => m.id === editing) : null;
    if (edit) type = edit.type;
    let html = '<div class="modal-head"><h2>✎ Demande de modification</h2>' +
      '<div class="fb-tabs"><button data-view="slide" class="' + (view === 'slide' ? 'active' : '') + '">Cette diapo</button>' +
      '<button data-view="all" class="' + (view === 'all' ? 'active' : '') + '">Toutes (' + items.length + ')</button></div>' +
      '<button class="icon-btn" data-close aria-label="Fermer">✕</button></div>';
    if (view === 'slide') {
      html += '<div class="fb-ctx"><b>Diapo ' + cur.index + ' — ' + esc(cur.title) + '</b><br>' +
        esc(cur.chapter) + (cur.section ? ' › ' + esc(cur.section) : '') +
        (cur.step ? ' · étape ' + cur.step : '') + (cur.file ? ' · <code>' + esc(cur.file) + '</code>' : '') + '</div>' +
        '<div class="fb-types">' + TYPES.map(t => '<button class="fb-chip' + (t === type ? ' active' : '') + '" data-type="' + t + '">' + t + '</button>').join('') + '</div>' +
        '<textarea class="fb-input" rows="5" placeholder="Décrivez la modification souhaitée sur cette diapo…">' + (edit ? esc(edit.text) : '') + '</textarea>' +
        '<div class="fb-row"><span class="muted fb-hint"><kbd>Ctrl</kbd>+<kbd>Entrée</kbd> pour enregistrer · <kbd>Échap</kbd> pour fermer</span>' +
        (edit ? '<button class="fb-btn ghost" data-act="cancel">Annuler</button>' : '') +
        '<button class="fb-btn primary" data-act="save">' + (edit ? 'Mettre à jour' : 'Enregistrer') + '</button></div>' +
        (mine.length ? '<h3 class="fb-h3">Déjà demandé sur cette diapo</h3><ul class="fb-list">' + mine.map(m => itemHtml(m, false)).join('') + '</ul>' : '');
    } else {
      html += items.length
        ? '<ul class="fb-list">' + items.map(m => itemHtml(m, true)).join('') + '</ul>'
        : '<p class="muted">Aucune demande pour l’instant. Tapez <kbd>!</kbd><kbd>!</kbd><kbd>!</kbd> sur une diapo.</p>';
    }
    html += '<div class="fb-foot"><span class="fb-status"></span>' +
      '<button class="fb-btn ghost" data-act="copy">Copier (JSON)</button>' +
      '<button class="fb-btn ghost" data-act="export">Exporter .json</button></div>';
    body.innerHTML = html;
    setStatus();
    const ta = $('.fb-input', body);
    if (ta) setTimeout(() => { ta.focus(); ta.selectionStart = ta.value.length; }, 20);
  }

  function open() {
    if (!server) return;
    if (window.App.isModalOpen() && modal.hidden) window.App.closeModals();
    editing = null; view = 'slide'; type = TYPES[0];
    render();
    window.App.openModal('#feedback');
  }

  function submit() {
    const ta = $('.fb-input', modal);
    const text = ta.value.trim();
    if (!text) { ta.focus(); return; }
    const now = new Date().toISOString();
    if (editing) {
      const m = items.find(x => x.id === editing);
      Object.assign(m, { text, type, updated: now });
    } else {
      const c = window.App.current();
      items.push({
        id: 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        created: now, updated: now, status: 'à faire', type, text,
        slide: { index: c.index, hash: c.hash, title: c.title, chapter: c.chapter, section: c.section, file: c.file, step: c.step }
      });
    }
    editing = null;
    save();
    render();
    const f = $('.fb-foot', modal);
    if (f) { f.classList.add('flash'); setTimeout(() => f.classList.remove('flash'), 900); }
  }

  modal.addEventListener('click', e => {
    const t = e.target;
    const chip = t.closest('[data-type]');
    if (chip) { type = chip.dataset.type; modal.querySelectorAll('.fb-chip').forEach(c => c.classList.toggle('active', c === chip)); return; }
    const v = t.closest('[data-view]');
    if (v) { view = v.dataset.view; editing = null; render(); return; }
    const g = t.closest('[data-goto]');
    if (g) { window.App.closeModals(); window.App.go(+g.dataset.goto - 1); return; }
    const a = t.closest('[data-act]');
    if (!a) return;
    const li = a.closest('.fb-item');
    const m = li && items.find(x => x.id === li.dataset.id);
    switch (a.dataset.act) {
      case 'save': submit(); break;
      case 'cancel': editing = null; render(); break;
      case 'edit':
        if (view === 'all') { window.App.closeModals(); window.App.go(m.slide.index - 1); window.App.openModal('#feedback'); view = 'slide'; }
        editing = m.id; render(); break;
      case 'toggle': m.status = m.status === 'fait' ? 'à faire' : 'fait'; m.updated = new Date().toISOString(); save(); render(); break;
      case 'del':
        items = items.filter(x => x !== m);
        writeLocal(TOMB, readLocal(TOMB, []).concat(m.id));
        save(); render(); break;
      case 'copy': {
        const txt = JSON.stringify(payload(), null, 2);
        const done = () => { a.textContent = 'Copié ✓'; setTimeout(() => { a.textContent = 'Copier (JSON)'; }, 1200); };
        if (navigator.clipboard) navigator.clipboard.writeText(txt).then(done, done); else done();
        break;
      }
      case 'export': {
        const blob = new Blob([JSON.stringify(payload(), null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url; link.download = 'modifs-' + VERSION + '.json';
        document.body.appendChild(link); link.click(); link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        break;
      }
    }
  });
  modal.addEventListener('keydown', e => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && e.target.classList.contains('fb-input')) { e.preventDefault(); submit(); }
  });

  /* ---------- déclencheur « !!! » ---------- */
  let bangs = [];
  document.addEventListener('keydown', e => {
    if (!server || e.key !== '!' || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.matches && e.target.matches('input, textarea, select')) return;
    const now = Date.now();
    bangs = bangs.filter(t => now - t < 1500).concat(now);
    if (bangs.length >= 3) { bangs = []; e.preventDefault(); open(); }
  }, true);

  const btn = document.getElementById('btn-feedback');
  if (btn) btn.addEventListener('click', () => { if (server) open(); });

  load();
  window.Feedback = { open, all: () => items };
})();
