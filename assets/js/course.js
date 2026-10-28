/*
 * Registre du cours.
 *
 * Course.chapter({
 *   id: 'classes', num: 3, title: 'Classes', icon: '🧱', color: '#...',
 *   intro: 'phrase d\'accroche', sections: ['Définition', ...],
 *   slides: [{ title, section, html, layout }]
 * })
 * Un même id peut être appelé plusieurs fois : les diapos sont ajoutées à la suite.
 * Une diapo « chapitre » (page de garde) est générée automatiquement.
 */
(function () {
  const chapters = [];
  const byId = {};

  function chapter(def) {
    // fichier source de la diapo (utile pour les demandes de modification)
    const cs = typeof document !== 'undefined' && document.currentScript;
    const src = cs ? (cs.getAttribute('src') || '') : '';
    (def.slides || []).forEach(s => { if (!s.src) s.src = src; });
    let ch = byId[def.id];
    if (!ch) {
      ch = Object.assign({ slides: [], sections: [] }, def, { slides: [] });
      byId[def.id] = ch;
      chapters.push(ch);
    } else {
      Object.keys(def).forEach(k => { if (k !== 'slides' && k !== 'sections' && ch[k] == null) ch[k] = def[k]; });
      if (def.sections) def.sections.forEach(s => { if (!ch.sections.includes(s)) ch.sections.push(s); });
    }
    (def.slides || []).forEach(s => ch.slides.push(s));
  }

  /*
   * Finalisation (appelée une fois, avant l'affichage) :
   *  - dans chaque chapitre, les diapos sont triées (tri stable) selon l'ordre de `sections` ;
   *  - les diapos marquées `annex: true` sont déplacées dans un chapitre « Annexes » final,
   *    rangées par chapitre d'origine.
   */
  let finalized = false;
  function finalize() {
    if (finalized) return;
    finalized = true;
    const annex = { id: 'annexes', num: 'A', title: 'Annexes', icon: '📎', color: '#64748b',
      intro: 'Pour aller plus loin : notions avancées, hors du parcours principal.', sections: [], slides: [] };
    chapters.forEach(ch => {
      if (ch.sections && ch.sections.length) {
        let last = 0;
        const keyed = ch.slides.map((s, i) => {
          const k = ch.sections.indexOf(s.section);
          if (k >= 0) last = k;
          return { s, i, k: k >= 0 ? k : last };
        });
        keyed.sort((a, b) => a.k - b.k || a.i - b.i);
        ch.slides = keyed.map(x => x.s);
      }
      const moved = ch.slides.filter(s => s.annex);
      if (moved.length) {
        ch.slides = ch.slides.filter(s => !s.annex);
        if (!annex.sections.includes(ch.title)) annex.sections.push(ch.title);
        moved.forEach(s => annex.slides.push(Object.assign({}, s, { origSection: s.section, section: ch.title })));
      }
    });
    if (annex.slides.length) chapters.push(annex);
  }

  /* Liste à plat de toutes les diapos, avec page de garde de chaque chapitre. */
  function flatten() {
    finalize();
    const out = [];
    chapters.forEach((ch, ci) => {
      if (!ch.noCover) out.push({ chapter: ch, ci, cover: true, title: ch.title });
      ch.slides.forEach(s => out.push(Object.assign({ chapter: ch, ci }, s)));
    });
    return out;
  }

  window.Course = { chapter, chapters, flatten, finalize };
})();
