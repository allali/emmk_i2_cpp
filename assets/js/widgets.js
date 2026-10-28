/*
 * Widgets interactifs (simulateurs pédagogiques) intégrés aux diapos.
 *
 *   Dans une diapo :   ${H.widget('nom', { ...config })}
 *   Définition     :   Widgets.register('nom', { mount(el, cfg) { ... ; return stepper? } })
 *   Styles         :   Widgets.css(`...`)   (injecté au premier affichage, utilise les variables du thème)
 *
 * mount(el, cfg) construit le contenu dans `el` à chaque affichage de la diapo. Il peut renvoyer
 * { next(), prev(), reset(toEnd) } : les flèches du clavier font alors d'abord avancer le widget
 * (next/prev renvoient true tant qu'ils ont consommé l'étape).
 * Après un changement de taille, appeler Widgets.resized(el) pour réajuster la diapo à l'écran.
 */
(function () {
  const reg = {};
  const cfgs = {};
  const styles = [];
  let injected = 0;
  let uid = 0;

  function register(name, def) { reg[name] = def; }
  function css(text) { styles.push(text); }
  function inject() {
    if (typeof document === 'undefined') return;
    while (injected < styles.length) {
      const st = document.createElement('style');
      st.textContent = styles[injected++];
      document.head.appendChild(st);
    }
  }
  function html(name, cfg) {
    const id = 'w' + (++uid);
    cfgs[id] = cfg || {};
    // keep : fait partie du contenu du cours (toujours affiché) ; sinon : simulateur pour les élèves
    const keep = reg[name] && reg[name].keep;
    return '<div class="widget w-' + name + (keep ? ' w-keep' : ' w-sim') + '" data-widget="' + name + '" data-wid="' + id + '"></div>';
  }
  function mount(el) {
    inject();
    const def = reg[el.dataset.widget];
    if (!def) { el.textContent = 'Widget inconnu : ' + el.dataset.widget; return null; }
    try {
      const st = def.mount(el, cfgs[el.dataset.wid] || {});
      el._stepper = st && typeof st.next === 'function' ? st : null;
      return el._stepper;
    } catch (e) {
      console.error(e);
      el.textContent = 'Erreur du widget ' + el.dataset.widget + ' : ' + e.message;
      return null;
    }
  }
  function resized(el) {
    if (typeof document !== 'undefined') (el || document).dispatchEvent(new CustomEvent('widget:resize', { bubbles: true }));
  }

  window.Widgets = { register, css, html, mount, resized };
  if (window.H) window.H.widget = html;
})();
