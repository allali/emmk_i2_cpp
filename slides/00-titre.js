Course.chapter({
  id: 'titre',
  title: 'Accueil',
  icon: '🏠',
  color: '#3b6ff5',
  noCover: true,
  slides: [
    {
      title: 'Programmation C++',
      custom: true,
      html: `
        <div class="hero">
          <div>
            <span class="hero-badge">2ème année Informatique</span>
            <h1>Programmation C++</h1>
            <div class="sub">Classes, opérateurs, héritage, polymorphisme &amp; templates</div>
            <div class="author">J. Allali</div>
            <div class="school">ENSEIRB-MATMECA</div>
            <button class="start" data-go="1">Commencer le cours →</button>
            <div class="hint">Naviguez avec <kbd>←</kbd> <kbd>→</kbd> · <kbd>O</kbd> pour la vue d'ensemble · <kbd>?</kbd> pour l'aide</div>
          </div>
        </div>`
    }
  ]
});
