Course.chapter({
  id: 'intro',
  num: 1,
  title: 'Introduction',
  icon: '🚀',
  color: '#3b6ff5',
  intro: 'D’où vient le C++, ce qu’il ajoute au C, et la trame du cours.',
  sections: ['Historique', 'Du C au C++', 'Venir de Java', 'Trame du cours'],
  slides: [
    {
      title: 'Historique',
      section: 'Historique',
      html: `
        ${H.cols(
          `<p class="lead">Dans les années 80, <strong>Bjarne Stroustrup</strong> (AT&amp;T Bell Labs) crée le
           <em class="term">« C with classes »</em>, qui ajoute au C :</p>
           ${H.list(['les <strong>classes</strong>', 'les <strong>fonctions virtuelles</strong>', 'la <strong>surcharge d’opérateurs</strong>', 'l’<strong>héritage multiple</strong>', '…'])}`,
          `${H.info('Le C++ est normalisé par l’ISO (International Organization for Standardization) et l’ANSI. Une nouvelle version sort désormais tous les 3 ans.', 'Normalisation')}`
        )}
        <div class="timeline">
          ${[['1998', 'C++98 · ISO/CEI 14882:1998'], ['2003', 'C++03'], ['2011', 'C++11 · auto, {} …'], ['2014', 'C++14'], ['2017', 'C++17'], ['2020', 'C++20'], ['2023', 'C++23']]
            .map(([y, d]) => `<div class="tl-item"><div class="tl-y">${y}</div><div class="tl-d">${d}</div></div>`).join('')}
        </div>`
    },
    {
      title: 'C(++) : ce que le C++ ajoute',
      section: 'Du C au C++',
      html: `
        <p class="lead">Le C++ est un langage <strong>impératif</strong> et <strong>orienté objets</strong> :
        il ajoute au C les fonctionnalités permettant de mettre en œuvre les concepts objets.</p>
        <div class="cards">
          <div class="card"><div class="ci">📦</div><h4>L’objet</h4><p>attributs (données internes) + méthodes (comportements), <b>encapsulation</b>.</p></div>
          <div class="card"><div class="ci">🏷️</div><h4>Typage des objets</h4><p>chaque objet a un type connu du compilateur.</p></div>
          <div class="card"><div class="ci">🎭</div><h4>Polymorphisme</h4><p>un objet peut avoir <b>plus d’un type</b>.</p></div>
          <div class="card"><div class="ci">✏️</div><h4>Redéfinition</h4><p>une classe dérivée peut redéfinir un comportement.</p></div>
          <div class="card"><div class="ci">🏭</div><h4>Classe</h4><p>description et génération des objets.</p></div>
        </div>
        ${H.key('Le C++ permet aussi la <strong>programmation générique</strong> : écrire des fonctions (et des objets) indépendantes du type de leurs arguments. C’est l’idée du <em>« code à trous »</em>.', 'Et en plus…')}`
    },
    {
      title: 'Vous venez de Java : ce qui change',
      section: 'Venir de Java',
      html: `
        <p class="lead">Vous connaissez déjà la POO. Voici les différences de C++ qui surprennent le plus quand on vient de Java — une carte, chaque point sera revu dans son chapitre.</p>
        ${H.table(['', 'Java', 'C++', 'Chapitre'], [
          ['A a;', 'une référence (null)', '<b>un objet est construit</b>', 'Classes'],
          ['A b = a;', 'même objet partagé', '<b>une copie</b> de l’objet', 'Classes'],
          ['mémoire', 'ramasse-miettes', 'libérée par vous : <b>delete</b>, destructeur', 'Allocation'],
          ['méthodes', 'toutes virtuelles', '<b>non virtuelles</b> par défaut', 'Héritage'],
          ['constance', 'final', '<b>const</b> (variables, références, méthodes)', 'Classes'],
          ['généricité', 'List&lt;T&gt; (génériques)', '<b>templates</b> : code généré par type', 'Templates'],
          ['fichiers', 'un .java par classe', '<b>.hpp</b> (déclaration) + <b>.cpp</b> (code)', 'Classes']
        ], { cls: 'left' })}`
    },
    {
      title: 'Objectifs du cours',
      section: 'Venir de Java',
      html: `
        <p class="lead">À la fin du cours, vous saurez :</p>
        ${H.list([
          '<b>dire où vit chaque objet</b> — pile ou tas — et combien de temps ;',
          '<b>maîtriser la copie et la libération</b> : constructeur par recopie, destructeur, opérateur d’affectation ;',
          '<b>mettre en œuvre le polymorphisme</b> en C++ : <code class="inline">virtual</code>, vtable, classes abstraites ;',
          '<b>écrire du code générique</b> avec les templates.'
        ], { ordered: true })}
        ${H.key('Le fil rouge : <strong>la gestion de la mémoire</strong>. En C++, c’est vous qui en êtes responsable.')}`
    },
    {
      title: 'Incompatibilités entre le C et le C++',
      section: 'Du C au C++',
      html: `
        <p>Un source C valide peut <strong>ne pas compiler</strong> en C++ dans (au moins) deux cas :</p>
        ${H.cols(
          `<h3>1. Nouveaux mots-clés</h3>
           <p>Le source utilise un des nouveaux mots-clés du C++ comme identifiant.</p>
           ${H.code(`
             int new = 1;      // ok en C, erreur en C++
             char *class;      // ok en C, erreur en C++
             int this, delete; // idem
           `)}`,
          `<h3>2. Conversion de <code class="inline">void *</code></h3>
           <p>Le C autorise la conversion <strong>implicite</strong> de <code class="inline">void *</code> vers n’importe quel autre type de pointeur ; pas le C++.</p>
           ${H.code(`
             int *i = malloc(4);          // ok en C, erreur en C++
             int *j = (int *) malloc(4);  // ok : conversion explicite
             int *k = new int;            // la façon C++
           `)}`
        )}`
    },
    {
      title: 'Trame du cours',
      section: 'Trame du cours',
      html: `
        <p class="lead">Le cours suit une progression : on part de la mémoire, on construit la notion de classe,
        on contrôle la copie, puis on ouvre vers l’héritage, le polymorphisme et la généricité.</p>
        <div class="roadmap">
          ${[
            ['🧠', 'Allocation', '#0ea5e9', ['automatique', 'dynamique', 'variables', 'instances']],
            ['🧱', 'Classes', '#8b5cf6', ['définition', 'visibilité', 'attributs', 'this', 'constructeur', 'destructeur', 'copie ?', 'références', 'const']],
            ['➕', 'Opérateurs', '#f59e0b', ['a = b', 'a + b', 'a < b', 'affectation ?', '…']],
            ['🧬', 'Héritage', '#ec4899', ['polymorphisme ?', 'virtual', 'vtable', 'héritage multiple']],
            ['🧩', 'Templates', '#10b981', ['généricité', 'spécialisation', 'STL', 'métaprog']],
          ].map(([i, t, c, tags]) => `<div class="rm-card" style="--ch:${c}"><div class="rm-h"><span class="rm-i">${i}</span>${t}</div>
              <div class="rm-tags">${tags.map(x => `<span>${x}</span>`).join('')}</div></div>`).join('')}
        </div>
        ${H.tip('Utilisez le sommaire (<kbd>M</kbd>) ou la vue d’ensemble (<kbd>O</kbd>) pour sauter directement à une notion.')}`
    }
  ]
});
