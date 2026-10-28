Course.chapter({
  id: 'synthese',
  num: 7,
  title: 'Synthèse',
  icon: '🎓',
  color: '#6366f1',
  intro: 'Ce qu’il faut retenir pour programmer efficacement en C++.',
  sections: ['Concepts', 'Code lisible', 'Performance', 'Pièges venant de Java', 'Règles d’or'],
  slides: [
    {
      title: 'Les concepts du langage',
      section: 'Concepts',
      html: `
        <p class="lead">Le langage C++ dispose de nombreux concepts :</p>
        <div class="cards">
          <div class="card"><div class="ci">🔐</div><h4>Encapsulation</h4><p>visibilité <code class="inline">public</code> / <code class="inline">protected</code> / <code class="inline">private</code></p></div>
          <div class="card"><div class="ci">🔗</div><h4>Références</h4><p>des alias sûrs, jamais nuls</p></div>
          <div class="card"><div class="ci">➕</div><h4>Opérateurs</h4><p>donner aux objets le comportement des types primitifs</p></div>
          <div class="card"><div class="ci">🧬</div><h4>Héritage</h4><p>simple et multiple</p></div>
          <div class="card"><div class="ci">🎭</div><h4>Fonctions virtuelles</h4><p>le polymorphisme via la vtable</p></div>
          <div class="card"><div class="ci">🧩</div><h4>Programmation générique</h4><p>templates, STL, métaprogrammation</p></div>
        </div>
        ${H.warn('Le C++ laisse également au programmeur <strong>la gestion de la mémoire</strong>.')}`
    },
    {
      title: 'Programmer efficacement en C++',
      section: 'Concepts',
      layout: 'center',
      html: `
        <p class="lead">Programmer efficacement en C++, c’est répondre à <strong>deux exigences</strong> :</p>
        ${H.cols(
          `<div class="card"><div class="ci">📖</div><h4>Lisibilité</h4><p>Écrire du code lisible, dont le fonctionnement est clair.</p></div>`,
          `<div class="card"><div class="ci">⚡</div><h4>Performance</h4><p>Viser la performance : en temps et en mémoire.</p></div>`
        )}`
    },
    {
      title: 'Écrire du code lisible',
      section: 'Code lisible',
      html: `
        <p>Écrire du code lisible, dont le fonctionnement est clair, implique de :</p>
        ${H.list([
          'Ne pas utiliser les opérateurs n’importe comment.',
          'Ne pas détourner les opérateurs au-delà de leur sens premier.',
          'Limiter l’usage de la programmation générique à des parties de code isolées.',
          'Pas de <strong>surcharge</strong> avec l’héritage.',
          'Pas de <strong>valeur par défaut</strong> avec l’héritage.'
        ], { frag: true })}
        ${H.warn('La copie (par construction ou par affectation) est <strong>ajoutée automatiquement</strong> par le compilateur : il faut donc toujours la <strong>gérer</strong> — l’écrire, ou l’interdire avec <code class="inline">= delete</code> (avant C++11 : la rendre <code class="inline">private</code>).')}`
    },
    {
      title: 'Réserver le polymorphisme à l’architecture',
      section: 'Code lisible',
      html: `
        <p>On réservera le polymorphisme aux <strong>classes structurantes</strong> (architecture logicielle) :</p>
        ${H.cols(
          H.list([
            'Destructeur virtuel',
            'Méthodes toutes virtuelles',
            'Héritage virtuel sur les interfaces',
            'Limiter l’usage de l’héritage multiple',
            'Pas d’opérateurs',
            'Pas de surcharge'
          ]),
          H.info('Ces classes servent à la structuration générale du logiciel : en pratique, le <strong>nombre d’instances est réduit</strong> et l’utilisation (appel de méthodes) des instances est modérée. Le coût des méthodes virtuelles (un vptr par instance, une indirection par appel) y est donc négligeable.')
        )}`
    },
    {
      title: 'Viser la performance',
      section: 'Performance',
      html: `
        <p>Pour les parties <strong>calculatoires</strong> (pixels d’une image, graphes, etc.), on utilise en priorité :</p>
        ${H.list([
          'Des classes <strong>sans méthodes virtuelles</strong> (s’il y a beaucoup d’instances)',
          '<strong>Pas d’héritage</strong>',
          'Les <strong>opérateurs</strong> si l’on veut profiter de code générique',
          'La <strong>programmation générique</strong>'
        ], { frag: true })}
        ${H.rule('Ce code doit être <strong>isolé</strong> du reste de l’application (API, bibliothèque).')}
        ${H.quiz({
          q: 'Vous écrivez une classe <code class="inline">Pixel</code> dont une image contiendra des millions d’instances. Que faut-il éviter ?',
          options: ['Des méthodes virtuelles', 'Des opérateurs', 'Des méthodes const', 'Des templates'],
          answer: 0,
          explain: '<p>Chaque instance d’une classe à méthodes virtuelles porte un pointeur caché (le vptr) vers la vtable de sa classe (4 ou 8 octets de plus) et chaque appel passe par une indirection : c’est coûteux sur des millions d’objets.</p>'
        })}`
    },
    {
      title: 'Les pièges quand on vient de Java (1/2)',
      section: 'Pièges venant de Java',
      html: `
        <p class="lead">Vos réflexes Java sont souvent justes… sauf ici :</p>
        ${H.table(['Vous écrivez…', 'En Java', 'En C++', 'Voir'], [
          ['A a;', 'une référence non initialisée', 'un <strong>objet construit</strong> dans la pile', 'Classes · instanciation'],
          ['A b = a;', 'deux références, un seul objet', 'une <strong>copie</strong> (constructeur par recopie)', 'Constructeur par recopie'],
          ['new A()', 'le GC libère', 'à libérer avec <code class="inline">delete</code>, ou mieux : objet local + destructeur (RAII)', 'Allocation · Destructeur'],
          ['void f(A a)', 'passe une référence', 'passe une <strong>copie</strong> → écrire <code class="inline">const A &amp;</code>', 'Références et const']
        ], { cls: 'left' })}`
    },
    {
      title: 'Les pièges quand on vient de Java (2/2)',
      section: 'Pièges venant de Java',
      html: `
        ${H.table(['Vous écrivez…', 'En Java', 'En C++', 'Voir'], [
          ['void m()', 'redéfinissable (virtuelle)', '<strong>non virtuelle</strong> par défaut : écrire <code class="inline">virtual</code>', 'Polymorphisme & vtable'],
          ['Base b = fille;', 'polymorphisme', 'copie de la partie <code class="inline">Base</code> seulement : passer par <code class="inline">Base &amp;</code> ou <code class="inline">Base *</code>', 'Héritage · principe'],
          ['delete base;', '—', '<strong>comportement indéfini</strong> (au mieux une fuite) si le destructeur n’est pas <code class="inline">virtual</code>', 'Destructeur virtuel'],
          ['a == b', 'compare les références', 'ne compile pas tant que <code class="inline">operator==</code> n’est pas écrit', 'Opérateurs'],
          ['class Pile&lt;T&gt;', 'compilée une fois', 'code générique dans le <code class="inline">.hpp</code>, une version par type', 'Templates']
        ], { cls: 'left' })}
        ${H.tip('En cas de doute, demandez-vous : « <strong>où vit cet objet</strong> (pile ou tas) et <strong>qui le détruit</strong> ? »')}`
    },
    {
      title: 'Les règles d’or (1/2)',
      section: 'Règles d’or',
      html: `
        <p class="lead">Les règles rencontrées tout au long du cours, rassemblées :</p>
        <div class="cards">
          <div class="card"><h4>✅ Initialisation</h4><p>Préférer <code class="inline">{}</code> à <code class="inline">=</code> : pas de conversion avec perte.</p></div>
          <div class="card"><h4>✅ Arguments</h4><p>Passer les instances (non primitives) par <strong>référence constante</strong>, sauf si on veut les modifier.</p></div>
          <div class="card"><h4>✅ Méthodes const</h4><p>Se demander non pas si une méthode doit être <code class="inline">const</code>, mais si on a besoin qu’elle ne le soit pas.</p></div>
          <div class="card"><h4>✅ Règle des 3</h4><p>Une classe qui alloue dynamiquement écrit : constructeur par recopie <code class="inline">A(const A &amp;)</code>, destructeur et <code class="inline">operator=</code>.</p></div>
          <div class="card"><h4>✅ RAII</h4><p>Une ressource est acquise dans un constructeur et libérée par le destructeur : préférer les objets locaux au couple <code class="inline">new</code>/<code class="inline">delete</code>.</p></div>
          <div class="card"><h4>✅ Destructeur virtuel</h4><p>Toute classe destinée à être dérivée a un destructeur virtuel.</p></div>
          <div class="card"><h4>✅ override</h4><p>Écrire <code class="inline">override</code> sur une redéfinition : le compilateur vérifie qu’elle redéfinit bien.</p></div>
        </div>`
    },
    {
      title: 'Fin du cours : les règles d’or (2/2)',
      section: 'Règles d’or',
      html: `
        <div class="cards">
          <div class="card"><h4>✅ Copie et héritage</h4><p>Dès qu’il y a de l’héritage, supprimer la copie (<code class="inline">= delete</code>).</p></div>
          <div class="card"><h4>✅ Interfaces</h4><p>Héritage virtuel systématique lors de l’héritage d’une interface <span class="muted">(voir « Héritage multiple »)</span>.</p></div>
          <div class="card"><h4>✅ Clarté</h4><p>Ne pas mélanger redéfinition, surcharge et valeurs par défaut.</p></div>
          <div class="card"><h4>✅ Opérateurs</h4><p>Ne pas les détourner de leur sens ; dans le doute, une méthode classique.</p></div>
          <div class="card"><h4>✅ friend</h4><p>Les fonctions amies ne remplacent pas les accesseurs.</p></div>
          <div class="card"><h4>✅ Templates</h4><p>Documenter les méthodes attendues des types paramètres.</p></div>
        </div>
        <div style="text-align:center"><button class="nav-btn primary" data-go="0">↺ Revenir au début du cours</button></div>`
    }
  ]
});
