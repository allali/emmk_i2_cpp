/* Widget « code-morph » : rejoue pas à pas l'évolution d'un code réparti en plusieurs fichiers.
 *
 *   H.widget('code-morph', {
 *     cols: '41fr 52fr 40fr',                         // largeurs des colonnes (une par fichier)
 *     versions: [ { note: 'Point de départ…', files: [{ name, code }, …] }, … ]
 *   })
 *
 * Pour chaque passage de la version k à la version k+1, deux étapes (flèche →) :
 *   1. ce qui va changer est encadré en rouge (lignes supprimées ou modifiées, point d'insertion) ;
 *   2. morphing : les anciennes lignes se replient, les nouvelles se déplient (surlignées).
 * La phrase au-dessus du code décrit l'opération en cours (note de la version k+1).
 */
(function () {
  Widgets.css(`
    .w-code-morph { display: grid; gap: 12px; }
    .w-code-morph .cm-head { display: flex; align-items: baseline; gap: 12px; min-height: 2.6em; }
    .w-code-morph .cm-step { flex: none; font-weight: 800; font-size: 14px; color: #fff; background: var(--ch, var(--accent));
      border-radius: 6px; padding: 2px 10px; }
    .w-code-morph .cm-note { line-height: 1.3; }
    .w-code-morph .cm-files { display: grid; gap: 14px; align-items: start; }
    .w-code-morph .ln { white-space: pre; }
    .w-code-morph .ln.cm-del { background: var(--code-err-bg); box-shadow: inset 2px 0 var(--code-err), inset -2px 0 var(--code-err); }
    .w-code-morph .ln.cm-del.cm-top { box-shadow: inset 2px 0 var(--code-err), inset -2px 0 var(--code-err), inset 0 2px var(--code-err); }
    .w-code-morph .ln.cm-del.cm-bot { box-shadow: inset 2px 0 var(--code-err), inset -2px 0 var(--code-err), inset 0 -2px var(--code-err); }
    .w-code-morph .ln.cm-del.cm-top.cm-bot { box-shadow: inset 0 0 0 2px var(--code-err); }
    .w-code-morph .cm-ins { display: block; height: 0; border-top: 3px dashed var(--code-err); margin: -1.5px 6px; }
    .w-code-morph .ln.cm-anim { transition: height .7s ease, opacity .7s ease; height: 1lh; overflow: hidden; }
    .w-code-morph .ln.cm-anim.cm-zero { height: 0; opacity: 0; }
    .w-code-morph .code-title .term-title { transition: color .4s; }
    .w-code-morph .code-title.cm-renamed .term-title { color: var(--code-err); }
  `);

  /* diff ligne à ligne (plus longue sous-suite commune) : [{t:'same'|'del'|'add', s}] */
  function diff(a, b) {
    const n = a.length, m = b.length;
    const L = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
    for (let i = n - 1; i >= 0; i--)
      for (let j = m - 1; j >= 0; j--)
        L[i][j] = a[i] === b[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    const out = [];
    let i = 0, j = 0;
    while (i < n || j < m) {
      if (i < n && j < m && a[i] === b[j]) { out.push({ t: 'same', s: a[i] }); i++; j++; }
      else if (j < m && (i === n || L[i][j + 1] > L[i + 1][j])) out.push({ t: 'add', s: b[j++] });
      else out.push({ t: 'del', s: a[i++] });
    }
    // ligne commune isolée au milieu de changements (ex. « delete[] values; » rapprochée d'une autre fonction) :
    // on la traite comme supprimée puis ajoutée, sinon elle « glisse » d'une fonction à l'autre
    for (let k = 1; k < out.length - 1; k++)
      if (out[k].t === 'same' && out[k - 1].t !== 'same' && out[k + 1].t !== 'same' && !/^\s*[{}]?\s*$/.test(out[k].s))
        out.splice(k, 1, { t: 'del', s: out[k].s }, { t: 'add', s: out[k].s });
    // dans un bloc modifié, les suppressions avant les ajouts
    for (let k = 0; k < out.length; k++) {
      if (out[k].t !== 'add') continue;
      let e = k;
      while (e < out.length && out[e].t !== 'same') e++;
      const blk = out.slice(k, e);
      out.splice(k, e - k, ...blk.filter(x => x.t === 'del'), ...blk.filter(x => x.t === 'add'));
      k = e - 1;
    }
    return out;
  }

  const lines = src => src.replace(/\n+$/, '').split('\n');
  const hlLine = s => (s ? window.CppHighlight.highlight(s) : ' ');
  const span = (s, cls) => '<span class="ln' + (cls ? ' ' + cls : '') + '">' + hlLine(s) + '</span>';

  Widgets.register('code-morph', {
    keep: true,
    mount(el, cfg) {
      const V = cfg.versions || [];
      const T = V.length - 1;                 // nombre de transitions
      const nf = V[0].files.length;
      const maxLines = V[0].files.map((f, k) => Math.max(...V.map(v => lines(v.files[k].code).length)));
      const D = [];                           // D[k][f] : diff entre la version k et k+1 du fichier f
      for (let k = 0; k < T; k++) D.push(V[k].files.map((f, i) => diff(lines(f.code), lines(V[k + 1].files[i].code))));

      el.innerHTML = '<div class="cm-head"><span class="cm-step"></span><span class="cm-note"></span></div>' +
        '<div class="cm-files" style="grid-template-columns:' + (cfg.cols || 'repeat(' + nf + ', minmax(0, 1fr))') + '">' +
        V[0].files.map((f, i) => H.code(' ', { title: f.name, small: true })).join('') + '</div>';
      const figs = [...el.querySelectorAll('figure.code')];
      figs.forEach((fg, i) => {
        const b = fg.querySelector('.copy-btn'); if (b) b.remove();
        fg.querySelector('pre code').style.minHeight = maxLines[i] + 'lh';
      });
      const codeEl = i => figs[i].querySelector('pre code');
      const setName = (i, name, renamed) => {
        const t = figs[i].querySelector('.term-title'); if (t) t.textContent = name;
        figs[i].querySelector('.code-title').classList.toggle('cm-renamed', !!renamed);
      };

      let s = 0, timer = null;
      /* état s : pair = version s/2 au repos ; impair = version (s-1)/2 avec ce qui va changer encadré */
      function head(k, pending) {
        el.querySelector('.cm-step').textContent = k === 0 && !pending ? 'C' : 'Étape ' + (pending ? k + 1 : k) + ' / ' + T;
        el.querySelector('.cm-note').innerHTML = V[pending ? k + 1 : k].note || '';
      }
      function render() {
        clearTimeout(timer);
        if (s % 2 === 0) {
          const k = s / 2;
          head(k, false);
          V[k].files.forEach((f, i) => {
            const added = k > 0 ? D[k - 1][i] : null;
            codeEl(i).innerHTML = added
              ? added.filter(x => x.t !== 'del').map(x => span(x.s, x.t === 'add' ? 'hl' : '')).join('')
              : lines(f.code).map(l => span(l)).join('');
            setName(i, f.name, k > 0 && V[k - 1].files[i].name !== f.name);
          });
        } else {
          const k = (s - 1) / 2;
          head(k, true);
          V[k].files.forEach((f, i) => {
            const d = D[k][i];
            let h = '';
            d.forEach((x, j) => {
              if (x.t === 'same') h += span(x.s);
              else if (x.t === 'del') {
                const top = j === 0 || d[j - 1].t !== 'del', bot = j === d.length - 1 || d[j + 1].t !== 'del';
                h += span(x.s, 'cm-del' + (top ? ' cm-top' : '') + (bot ? ' cm-bot' : ''));
              } else if (j === 0 || d[j - 1].t === 'same') h += '<span class="cm-ins"></span>';   // insertion pure
            });
            codeEl(i).innerHTML = h;
            setName(i, f.name, f.name !== V[k + 1].files[i].name);
          });
        }
      }
      function morph() {
        const k = s / 2 - 1;                  // transition k → k+1
        head(k + 1, false);
        V[k + 1].files.forEach((f, i) => {
          const d = D[k][i];
          codeEl(i).innerHTML = d.map(x => span(x.s, x.t === 'same' ? '' : 'cm-anim ' + (x.t === 'del' ? 'cm-del cm-top cm-bot' : 'hl cm-zero'))).join('');
          setName(i, f.name, V[k].files[i].name !== f.name);
        });
        void el.offsetHeight;                 // force le calcul avant de lancer les transitions
        el.querySelectorAll('.ln.cm-anim').forEach(l => l.classList.toggle('cm-zero'));
        timer = setTimeout(render, 800);
      }
      render();
      return {
        next() { if (s >= 2 * T) return false; s++; if (s % 2 === 0) morph(); else render(); return true; },
        prev() { if (s <= 0) return false; s--; render(); return true; },
        reset(toEnd) { s = toEnd ? 2 * T : 0; render(); }
      };
    }
  });
})();
