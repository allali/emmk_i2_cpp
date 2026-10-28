/*
 * Diagrammes mémoire / classes animés étape par étape.
 *
 * H.diagram({
 *   w: 600, h: 300,                      // viewBox SVG
 *   code: `...`,                          // (optionnel) code affiché à côté, ligne courante surlignée
 *   codeTitle: 'main.cpp',
 *   common: { boxes, arrows, texts },     // éléments présents à toutes les étapes
 *   steps: [{ boxes, arrows, texts, line, note }]
 * })
 *
 * box   : { id, x, y, w, h, label, kind, tag, tagPos, fs, dx }
 *         kind: obj | dead | heap | int | leak | err | plain | zone | cell | empty | ghost | cls | note | blue
 *         tag : étiquette (nom de variable) affichée à gauche (tagPos:'left'|'top'|'right')
 * arrow : { from, to, kind: 'ptr'|'bad'|'inherit'|'line'|'dash', bend, label }
 * text  : { x, y, text, fs, anchor, cls }
 * Un élément d'une étape de même id qu'un élément de `common` le remplace.
 */
(function () {
  const esc = window.CppHighlight.esc;
  const registry = {};
  let uid = 0;

  function merge(common = [], local = []) {
    const ids = new Set(local.filter(e => e.id).map(e => e.id));
    return common.filter(e => !e.id || !ids.has(e.id)).concat(local);
  }

  function stepState(spec, k) {
    const s = spec.steps[k] || {};
    const c = spec.common || {};
    const hide = new Set(s.hide || []);
    return {
      boxes: merge(c.boxes, s.boxes).filter(b => !hide.has(b.id)),
      arrows: merge(c.arrows, s.arrows).filter(a => !hide.has(a.from) && !hide.has(a.to) && !hide.has(a.id)),
      texts: merge(c.texts, s.texts),
      line: s.line, note: s.note
    };
  }

  function edgePoint(b, tx, ty) {
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    const dx = tx - cx, dy = ty - cy;
    if (!dx && !dy) return [cx, cy];
    const sx = dx ? (b.w / 2) / Math.abs(dx) : Infinity;
    const sy = dy ? (b.h / 2) / Math.abs(dy) : Infinity;
    const s = Math.min(sx, sy);
    return [cx + dx * s, cy + dy * s];
  }

  function renderSVG(spec, st, prev) {
    const byId = {};
    st.boxes.forEach(b => { byId[b.id] = b; });
    const prevIds = new Set(prev ? prev.boxes.map(b => b.id + ':' + (b.kind || '') + ':' + (b.label || '')) : []);
    let s = '<svg viewBox="0 0 ' + spec.w + ' ' + spec.h + '" class="dg-svg" role="img">' +
      '<defs>' +
      '<marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="mk-ptr"/></marker>' +
      '<marker id="ahb" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="mk-bad"/></marker>' +
      '<marker id="ahi" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="12" markerHeight="12" orient="auto-start-reverse"><path d="M1,1 L11,6 L1,11 z" class="mk-inh"/></marker>' +
      '</defs>';

    // boîtes (les zones d'abord)
    const order = st.boxes.slice().sort((a, b) => (a.kind === 'zone' || a.kind === 'cls' ? -1 : 0) - (b.kind === 'zone' || b.kind === 'cls' ? -1 : 0));
    order.forEach(b => {
      const k = b.kind || 'plain';
      const isNew = prev && !prevIds.has(b.id + ':' + (b.kind || '') + ':' + (b.label || ''));
      s += '<g class="dg-box k-' + k + (isNew ? ' is-new' : '') + '">';
      s += '<rect x="' + b.x + '" y="' + b.y + '" width="' + b.w + '" height="' + b.h + '" rx="' + (b.rx != null ? b.rx : (k === 'zone' || k === 'cls' ? 8 : 5)) + '"/>';
      if (b.label != null) {
        const fs = b.fs || 14;
        const lines = String(b.label).split('\n');
        const top = k === 'zone' || k === 'cls';
        lines.forEach((ln, i) => {
          const y = top ? b.y + fs + 4 + i * fs * 1.2 : b.y + b.h / 2 + (i - (lines.length - 1) / 2) * fs * 1.2;
          const x = top ? b.x + 8 : b.x + b.w / 2 + (b.dx || 0);
          s += '<text x="' + x + '" y="' + y + '" font-size="' + fs + '" text-anchor="' + (top ? 'start' : 'middle') + '" dominant-baseline="' + (top ? 'auto' : 'central') + '">' + esc(ln) + '</text>';
        });
      }
      if (b.tag) {
        const pos = b.tagPos || 'left';
        const fs = b.tagFs || 14;
        let x = b.x - 8, y = b.y + b.h / 2, a = 'end', base = 'central';
        if (pos === 'top') { x = b.x + b.w / 2; y = b.y - 6; a = 'middle'; base = 'auto'; }
        if (pos === 'right') { x = b.x + b.w + 8; a = 'start'; }
        s += '<text class="dg-tag" x="' + x + '" y="' + y + '" font-size="' + fs + '" text-anchor="' + a + '" dominant-baseline="' + base + '">' + esc(b.tag) + '</text>';
      }
      s += '</g>';
    });

    // flèches
    st.arrows.forEach(a => {
      const A = byId[a.from], B = byId[a.to];
      if (!A || !B) return;
      const bc = [B.x + B.w / 2, B.y + B.h / 2], ac = [A.x + A.w / 2, A.y + A.h / 2];
      let p1, p2;
      const bend = a.bend || 0;
      if (a.fromPt) p1 = [A.x + A.w * a.fromPt[0], A.y + A.h * a.fromPt[1]]; else p1 = edgePoint(A, bc[0], bc[1]);
      if (a.toPt) p2 = [B.x + B.w * a.toPt[0], B.y + B.h * a.toPt[1]]; else p2 = edgePoint(B, ac[0], ac[1]);
      const k = a.kind || 'ptr';
      const marker = k === 'inherit' ? 'ahi' : k === 'bad' ? 'ahb' : k === 'line' ? '' : 'ah';
      let d;
      if (bend) {
        const mx = (p1[0] + p2[0]) / 2, my = (p1[1] + p2[1]) / 2;
        const dx = p2[0] - p1[0], dy = p2[1] - p1[1];
        const len = Math.hypot(dx, dy) || 1;
        const cx = mx - dy / len * bend, cy = my + dx / len * bend;
        d = 'M' + p1.join(',') + ' Q' + cx + ',' + cy + ' ' + p2.join(',');
      } else d = 'M' + p1.join(',') + ' L' + p2.join(',');
      s += '<path class="dg-arrow a-' + k + '" d="' + d + '"' + (marker ? ' marker-end="url(#' + marker + ')"' : '') + '/>';
      if (a.label) {
        s += '<text class="dg-alabel" x="' + ((p1[0] + p2[0]) / 2) + '" y="' + ((p1[1] + p2[1]) / 2 - 6) + '" font-size="12" text-anchor="middle">' + esc(a.label) + '</text>';
      }
    });

    st.texts.forEach(t => {
      s += '<text class="dg-text ' + (t.cls || '') + '" x="' + t.x + '" y="' + t.y + '" font-size="' + (t.fs || 14) + '" text-anchor="' + (t.anchor || 'start') + '">' + esc(t.text) + '</text>';
    });
    return s + '</svg>';
  }

  function diagram(spec) {
    const id = 'dg-' + (++uid);
    spec.w = spec.w || 600; spec.h = spec.h || 300;
    spec.steps = spec.steps && spec.steps.length ? spec.steps : [{}];
    registry[id] = spec;
    const n = spec.steps.length;
    const codePart = spec.code ? window.H.code(spec.code, { title: spec.codeTitle, small: true, cls: 'dg-code' }) : '';
    return '<div class="diagram' + (spec.code ? ' with-code' : '') + (spec.cls ? ' ' + spec.cls : '') + '" data-dg="' + id + '" data-step="0">' +
      '<div class="dg-main">' + codePart + '<div class="dg-canvas" style="--ar:' + spec.w + '/' + spec.h + (spec.maxw ? ';max-width:' + spec.maxw + 'px' : '') + '"></div></div>' +
      (n > 1 ? '<div class="dg-ctrl"><button class="dg-prev" aria-label="Étape précédente">◀</button>' +
        '<div class="dg-dots">' + spec.steps.map((_, k) => '<i data-k="' + k + '"></i>').join('') + '</div>' +
        '<button class="dg-next" aria-label="Étape suivante">▶</button><div class="dg-note"></div></div>' :
        '<div class="dg-note solo"></div>') +
      '</div>';
  }

  function show(el, k, prevK) {
    const spec = registry[el.dataset.dg];
    if (!spec) return;
    k = Math.max(0, Math.min(spec.steps.length - 1, k));
    el.dataset.step = k;
    const st = stepState(spec, k);
    const prev = prevK != null && prevK !== k ? stepState(spec, prevK) : null;
    el.querySelector('.dg-canvas').innerHTML = renderSVG(spec, st, prev);
    // toutes les notes sont superposées et seule celle de l'étape courante est visible : la zone garde la
    // hauteur de la plus longue, la diapo ne change pas de taille d'une étape à l'autre (zoom stable)
    const note = el.querySelector('.dg-note');
    if (note) note.innerHTML = spec.steps.some(s => s.note)
      ? spec.steps.map((s, j) => '<div class="dg-n' + (j === k ? ' on' : '') + '">' + (s.note || '') + '</div>').join('') : '';
    el.querySelectorAll('.dg-dots i').forEach((d, j) => d.classList.toggle('on', j <= k));
    const pb = el.querySelector('.dg-prev'), nb = el.querySelector('.dg-next');
    if (pb) pb.disabled = k === 0;
    if (nb) nb.disabled = k === spec.steps.length - 1;
    el.querySelectorAll('.dg-code .ln').forEach(l => {
      const lines = Array.isArray(st.line) ? st.line : [st.line];
      l.classList.toggle('cur', lines.includes(+l.dataset.line));
    });
  }

  function mount(el) {
    show(el, +el.dataset.step || 0);
  }

  /* API « stepper » utilisée par app.js pour la navigation clavier */
  function stepper(el) {
    const spec = registry[el.dataset.dg];
    const count = spec ? spec.steps.length : 1;
    return {
      el,
      next() { const k = +el.dataset.step; if (k < count - 1) { show(el, k + 1, k); return true; } return false; },
      prev() { const k = +el.dataset.step; if (k > 0) { show(el, k - 1, k); return true; } return false; },
      reset(toEnd) { show(el, toEnd ? count - 1 : 0); }
    };
  }

  window.Diagram = { registry, mount, show, stepper };
  window.H.diagram = diagram;
})();
