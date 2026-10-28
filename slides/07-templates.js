(function () {
  /* Déroulé du calcul Puissance<2,3> */
  const pw = (id, y, lbl, kind) => ({ id, x: 40, y, w: 300, h: 40, label: lbl, kind: kind || 'plain' });
  const powDiagram = H.diagram({
    w: 600, h: 260,
    steps: [
      { boxes: [pw('p3', 20, 'Puissance<2,3>', 'obj')],
        note: 'Le compilateur doit calculer <code class="inline">Puissance&lt;2,3&gt;::resultat</code>.' },
      { boxes: [pw('p3', 20, 'Puissance<2,3>', 'obj'), pw('p2', 80, 'Puissance<2,2>', 'obj')], arrows: [{ from: 'p3', to: 'p2', label: '2 * …' }],
        note: 'Pour cela, il instancie <code class="inline">Puissance&lt;2,2&gt;</code>…' },
      { boxes: [pw('p3', 20, 'Puissance<2,3>', 'obj'), pw('p2', 80, 'Puissance<2,2>', 'obj'), pw('p1', 140, 'Puissance<2,1>', 'obj')],
        arrows: [{ from: 'p3', to: 'p2', label: '2 * …' }, { from: 'p2', to: 'p1', label: '2 * …' }],
        note: '… puis <code class="inline">Puissance&lt;2,1&gt;</code>…' },
      { boxes: [pw('p3', 20, 'Puissance<2,3>', 'obj'), pw('p2', 80, 'Puissance<2,2>', 'obj'), pw('p1', 140, 'Puissance<2,1>', 'obj'), pw('p0', 200, 'Puissance<2,0>  (spécialisation)', 'heap')],
        arrows: [{ from: 'p3', to: 'p2', label: '2 * …' }, { from: 'p2', to: 'p1', label: '2 * …' }, { from: 'p1', to: 'p0', label: '2 * …' }],
        texts: [{ x: 360, y: 225, text: 'resultat = 1', cls: 'ok' }],
        note: '… jusqu’à la <b>spécialisation</b> <code class="inline">Puissance&lt;a,0&gt;</code> qui arrête la récursion.' },
      { boxes: [pw('p3', 20, 'Puissance<2,3>', 'heap'), pw('p2', 80, 'Puissance<2,2>', 'heap'), pw('p1', 140, 'Puissance<2,1>', 'heap'), pw('p0', 200, 'Puissance<2,0>  (spécialisation)', 'heap')],
        arrows: [{ from: 'p3', to: 'p2' }, { from: 'p2', to: 'p1' }, { from: 'p1', to: 'p0' }],
        texts: [{ x: 360, y: 225, text: 'resultat = 1', cls: 'ok' }, { x: 360, y: 165, text: 'resultat = 2 * 1 = 2', cls: 'ok' },
          { x: 360, y: 105, text: 'resultat = 2 * 2 = 4', cls: 'ok' }, { x: 360, y: 45, text: 'resultat = 2 * 4 = 8', cls: 'ok' }],
        note: 'Les résultats remontent : <b>8</b> est calculé <b>à la compilation</b>. À l’exécution, il n’y a plus qu’une constante.' }
    ]
  });

  Course.chapter({
    id: 'templates',
    num: 6,
    title: 'Templates',
    icon: '🧩',
    color: '#10b981',
    intro: 'Écrire du code « à trous » indépendant des types : la programmation générique.',
    sections: ['Présentation', 'Fonctions génériques', 'Classes génériques', 'Spécialisation', 'Contraintes', 'STL', 'Métaprogrammation', 'L’essentiel'],
    slides: [
      {
        title: 'La programmation générique',
        section: 'Présentation',
        html: `
          <p class="lead">En plus de la programmation objet, le C++ ajoute au C la <strong>programmation générique</strong>.</p>
          ${H.list([
            'Elle consiste à écrire du code (fonction ou classe) <strong>indépendamment de certains types</strong>.',
            'Ces types seront <strong>fixés plus tard</strong>, lors de l’utilisation de ce code.',
            'En C++, c’est le mot-clé <code class="inline">template</code> qui permet de définir la généricité.'
          ], { frag: true })}
          ${H.key('On préfixe le code générique par <code class="inline">template&lt;class T&gt;</code> : <code class="inline">T</code> devient un <strong>type variable</strong>, paramètre du code.')}
          ${H.java('Vous connaissez déjà l’idée avec les <strong>génériques</strong> : <code class="inline">List&lt;T&gt;</code>, <code class="inline">Map&lt;K,V&gt;</code>. Les templates C++ s’écrivent de façon proche… mais fonctionnent très différemment (diapo suivante).')}`
      },
      {
        title: 'Une fonction générique : <code>swap</code>',
        section: 'Fonctions génériques',
        html: `
          <p>On peut écrire deux sortes de code générique : des <strong>classes</strong> et des <strong>fonctions</strong> génériques. Exemple de fonction :</p>
          ${H.code(`
            template<class T>
            void swap(T &a, T &b) {
                T t = a;
                a = b;
                b = t;
            }
          `, { hl: [1] })}
          ${H.cols(
            H.tip('Cette fonction échange les valeurs de <code class="inline">a</code> et <code class="inline">b</code> <strong>quel que soit leur type</strong>.'),
            H.warn('En revanche <code class="inline">a</code> et <code class="inline">b</code> doivent être <strong>du même type</strong> <code class="inline">T</code>.')
          )}`
      },
      {
        title: 'Utiliser une fonction générique',
        section: 'Fonctions génériques',
        html: `
          ${H.cols(
            H.code(`
              template<class T>
              void swap(T &a, T &b) { ... }

              int a = 0;
              int b = 1;
              char c = 'a';
            `),
            H.code(`
              swap<int>(a, b); // 1. type explicite
              swap(a, b);      // 2. type déduit : ok
              swap(a, c);      // 3. Erreur !
            `, { mark: { 1: 'ok', 2: 'ok', 3: 'err' } })
          )}
          ${H.variants([
            { label: 'Cas 1', html: '<p>On indique <strong>explicitement</strong> le type : le compilateur remplace <code class="inline">T</code> par <code class="inline">int</code>, trouve <code class="inline">swap&lt;int&gt;(int &amp;, int &amp;)</code> qui convient, et <strong>compile</strong> cette fonction au passage.</p>' },
            { label: 'Cas 2', html: '<p>Le compilateur cherche <code class="inline">swap</code> et essaie de <strong>déduire</strong> un type convenable pour <code class="inline">T</code> à partir des arguments (ce n’est pas toujours possible). Ici <code class="inline">T = int</code> : il construit et compile <code class="inline">swap&lt;int&gt;</code>.</p>' },
            { label: 'Cas 3', html: '<p><code class="inline">a</code> est un <code class="inline">int</code>, <code class="inline">c</code> un <code class="inline">char</code> : aucun <code class="inline">T</code> unique ne convient. Le compilateur ne trouve pas de <code class="inline">swap</code> avec le bon prototype et génère une <strong>erreur</strong>.</p>' }
          ])}`
      },
      {
        title: 'Templates et compilation',
        section: 'Fonctions génériques',
        html: `
          <p>Un code template est <strong>« à trous »</strong> : il ne peut être compilé qu’une fois les types paramètres connus.
          On ne peut donc plus mettre seulement le prototype dans le <code class="inline">.hpp</code> : <strong>on y met aussi le code</strong>.</p>
          ${H.cols(
            H.code(`
              template<class T>
              void swap(T &a, T &b) {
                  T t = a;
                  a = b;
                  b = t;
              }
            `, { title: 'swap.hpp — en une fois' }),
            H.code(`
              template<class T>
              void swap(T &, T &);

              // ...

              template<class T>
              void swap(T &a, T &b) {
                  T t = a; a = b; b = t;
              }
            `, { title: 'swap.hpp — en deux fois' })
          )}
          ${H.java('Un générique est compilé <strong>une seule fois</strong> (<code class="inline">T</code> devient <code class="inline">Object</code>). En C++, le compilateur <strong>génère une version par type</strong> utilisé : il a besoin du code source, d’où le <code class="inline">.hpp</code>.')}`
      },
      {
        title: 'Classe générique',
        section: 'Classes génériques',
        html: `
          <p>Voici un exemple de classe <strong>paramétrée</strong> (ou générique) :</p>
          ${H.code(`
            template<class T>
            class Entier {
                T _value;
            public:
                Entier(const T &t) : _value(t) {}
            };
          `)}
          <p>On écrit donc le code directement dans le <code class="inline">.hpp</code>… mais on peut tout à fait séparer déclaration et implémentation :</p>
          ${H.cols(
            H.code(`
              template<class T>
              class Entier {
                  T _value;
              public:
                  Entier(const T &t);
              };
            `, { title: 'déclaration' }),
            H.code(`
              template<class T>
              Entier<T>::Entier(const T &t) : _value(t)
              {}
            `, { title: 'implémentation (même .hpp)' })
          )}`
      },
      {
        title: 'Spécialisation d’une classe générique',
        section: 'Classes génériques',
        html: `
          <p>Lors de l’utilisation d’une classe générique, on doit indiquer <strong>explicitement</strong> le type des paramètres :</p>
          ${H.code(`
            Entier a;        // Erreur !
            Entier<int> b;   // ok
            Entier<long> c;  // ok
          `)}
          ${H.info('On parle de <em class="term">spécialisation</em> pour désigner une classe générique dont tous les paramètres sont spécifiés.')}
          ${H.key('Il n’existe <strong>aucune relation de typage</strong> entre deux spécialisations d’une même classe générique : <code class="inline">Entier&lt;int&gt;</code> et <code class="inline">Entier&lt;long&gt;</code> sont deux types sans aucun lien.')}`
      },
      {
        title: 'Paramètres par défaut',
        section: 'Classes génériques',
        html: `
          <p>On peut donner des <strong>valeurs par défaut</strong> aux paramètres d’un template. Elles doivent être fournies <strong>de la droite vers la gauche</strong> :</p>
          ${H.code(`
            template<class T = int>
            class Entier { ... };

            template<class D, class H = int>
            class HashTable { ... };

            template<class T = int, class C>   // Erreur !
            class Paire { ... };

            Entier<> e;  // ok : Entier<int>
          `, { mark: { 7: 'err' } })}
          ${H.info('Historiquement (C++98), seules les classes acceptaient des paramètres par défaut. Depuis <strong>C++11</strong>, les fonctions templates aussi — mais la règle de l’ordre reste la même pour les classes.', 'Remarque')}`
      },
      {
        title: 'Paramètres de type primitif',
        section: 'Classes génériques',
        html: `
          <p>Un code peut aussi être paramétré par des <strong>valeurs constantes</strong> de types primitifs <strong>entiers</strong> :</p>
          ${H.code(`
            template<int taille>
            class Matrix {
                int _data[taille][taille];
            public:
                // ...
            };

            Matrix<4> m4;  // matrice 4x4
            Matrix<3> m3;  // matrice 3x3
          `)}
          ${H.key('<code class="inline">Matrix&lt;4&gt;</code> et <code class="inline">Matrix&lt;3&gt;</code> sont <strong>deux types différents</strong>, dont la taille est connue à la compilation. Exemple d’usage : l’infographie.')}`
      },
      {
        title: 'Spécialisation',
        section: 'Spécialisation',
        html: `
          <p>On peut <strong>modifier l’implémentation</strong> pour certaines valeurs de paramètre :</p>
          ${H.cols(
            H.code(`
              template<class T>
              void affiche(const T &t) {
                  std::cout << t << std::endl;
              }
            `, { title: 'version générale' }),
            H.code(`
              template<>
              void affiche<int>(const int &t) {
                  printf("%d\\n", t);
              }
            `, { title: 'spécialisation pour int' })
          )}
          ${H.info('Pour les entiers, on utilise ici <code class="inline">printf</code> au lieu de <code class="inline">std::cout</code>. Le <code class="inline">template&lt;&gt;</code> vide annonce une spécialisation totale.')}`
      },
      {
        title: 'Spécialisation sur des valeurs',
        section: 'Spécialisation',
        html: `
          <p>Lorsque les paramètres sont des types primitifs, on peut spécialiser selon les <strong>valeurs</strong> :</p>
          ${H.cols(
            H.code(`
              template<int n>
              void affiche() {
                  printf("%d\\n", n);
              }

              template<>
              void affiche<0>() {
                  printf("zero\\n");
              }
            `),
            H.code(`
              affiche();     // erreur !
              affiche<1>();  // affiche : 1
              affiche<0>();  // affiche : zero
            `, { mark: { 1: 'err' } })
          )}
          ${H.warn('<code class="inline">affiche()</code> est une erreur : aucun argument ne permet de <strong>déduire</strong> <code class="inline">n</code>, il faut le donner explicitement.')}`
      },
      {
        title: 'Spécialisation sur les pointeurs',
        section: 'Spécialisation',
        html: `
          <p>Pour les classes, la spécialisation peut aussi porter sur une <strong>forme</strong> de type, par exemple les pointeurs :</p>
          ${H.cols(
            H.code(`
              template<class T>
              class Tableau {
                  T *_data;
                  // ...
              };
            `, { title: 'cas général' }),
            H.code(`
              template<class T>
              class Tableau<T *> {
                  T **_data;   // Attention ici !
              public:
                  Tableau(int i) {
                      _data = new T*[i];
                      for (int j = 0; j < i; ++j)
                          _data[j] = nullptr;
                  }
              };
            `, { title: 'cas T *' })
          )}
          ${H.tip('<code class="inline">Tableau&lt;int *&gt;</code> utilisera la seconde version (avec <code class="inline">T = int</code>), qui peut par exemple initialiser ses cases à <code class="inline">nullptr</code>.')}`
      },
      {
        title: 'Spécialisation partielle',
        section: 'Spécialisation',
        html: `
          <p>On peut ne spécialiser que <strong>certains</strong> paramètres d’un code générique :</p>
          ${H.code(`
            template<class T, class H>
            class HashTable {            // cas général
            };

            template<class T, class H>
            class HashTable<T *, H> {    // clés pointeurs
            };

            template<class T>
            class HashTable<T *, int> {  // clés pointeurs, H = int
            };
          `)}
          ${H.key('Il n’y a <strong>aucune contrainte</strong> entre ces différentes implémentations : elles ne correspondent pas au même type. Elles peuvent avoir des attributs et des méthodes totalement différents.', 'Important')}`
      },
      {
        title: 'Contraintes sur les paramètres',
        section: 'Contraintes',
        html: `
          <p>Lorsqu’on utilise un type dans un code générique, il faut faire très attention aux <strong>propriétés que l’on impose</strong> sur ce type :</p>
          ${H.cols(
            H.code(`
              template<class T>
              void swap(T &a, T &b) {
                  T t = a;
                  a = b;
                  b = t;
              }
            `, { title: 'version 1' }),
            H.code(`
              template<class T>
              void swap(T &a, T &b) {
                  T t;
                  t = a;
                  a = b;
                  b = t;
              }
            `, { title: 'version 2' })
          )}
          ${H.reveal('Quelles méthodes chaque version exige-t-elle de T ?', H.table(['', 'version 1', 'version 2'], [
            ['T(const T &)', 'oui', 'non'],
            ['T()', 'non', 'oui'],
            ['operator=', 'oui', 'oui']
          ]) + '<p>La version 1 exige un constructeur par recopie, la version 2 un constructeur par défaut ; les deux exigent <code class="inline">operator=</code>.</p>')}
          ${H.rule('Toujours indiquer clairement les méthodes attendues pour un type paramètre.')}`
      },
      {
        title: 'La STL et BOOST',
        section: 'STL',
        html: `
          <p>Deux grandes bibliothèques reposent sur les templates : la <strong>Standard Template Library</strong> et <strong>BOOST</strong>.</p>
          <div class="cards">
            <div class="card"><div class="ci">📦</div><h4>Conteneurs</h4><p>tableaux, listes, map…</p></div>
            <div class="card"><div class="ci">🔁</div><h4>Itérateurs</h4><p>parcours uniforme des conteneurs.</p></div>
            <div class="card"><div class="ci">⚙️</div><h4>Algorithmes</h4><p>comparaison, recopie, recherche, tris…</p></div>
            <div class="card"><div class="ci">🧮</div><h4>Allocateurs</h4><p>gestion de la mémoire des conteneurs.</p></div>
            <div class="card"><div class="ci">🎛️</div><h4>Foncteurs</h4><p>objets-fonctions (<code class="inline">operator()</code>).</p></div>
          </div>
          ${H.info('BOOST contient beaucoup, beaucoup de choses : conteneurs, graphes, maths, entrées/sorties, fichiers…')}`
      },
      {
        title: 'Types internes : <code>typedef</code>',
        section: 'STL',
        html: `
          <p>Pour comprendre la STL, il faut savoir qu’on peut déclarer un <strong>alias de type</strong> dans une classe :</p>
          ${H.code(`
            template<class T>
            class Entier {
            public:
                typedef T type;
            };

            Entier<int>::type i;  // i est de type int
          `, { hl: [4, 7] })}
          ${H.tip('En C++11, on peut écrire de façon équivalente <code class="inline">using type = T;</code>.')}`
      },
      {
        title: '<code>List&lt;Integer&gt;</code> ou <code>std::vector&lt;int&gt;</code> ?',
        section: 'STL',
        html: `
          <p>Le conteneur de base de la STL est <code class="inline">std::vector</code>, l’équivalent de <code class="inline">ArrayList</code> :</p>
          ${H.javaCpp(`
            List<Integer> v = new ArrayList<>();
            v.add(0);
            v.add(1);
            v.set(0, 2);
            for (int x : v)
                System.out.print(" " + x);
          `, `
            std::vector<int> v;   // pas de new : v est un objet
            v.push_back(0);
            v.push_back(1);
            v[0] = 2;
            for (auto x : v)      // C++11
                std::cout << " " << x;
          `, { hl: [1] })}
          ${H.java('On ne peut pas écrire <code class="inline">List&lt;int&gt;</code> : il faut la classe enveloppe <code class="inline">Integer</code>. En C++, <code class="inline">vector&lt;int&gt;</code> stocke directement des <code class="inline">int</code>, côte à côte en mémoire. Et <code class="inline">v</code> est détruit (avec son contenu) à la sortie du bloc.')}`
      },
      {
        title: 'Vecteurs et itérateurs',
        section: 'STL',
        html: `
          <p>Parmi les conteneurs les plus connus : <code class="inline">std::vector</code>, qui répond aux concepts de
          <em class="term">« Conteneur à Accès Quelconque »</em> et <em class="term">« Séquence avec insertion en fin »</em>
          (complexité, noms de méthodes, types internes…).</p>
          ${H.code(`
            #include <vector>

            std::vector<int> v;
            v.push_back(0);
            v.push_back(1);
            v[0] = 2;
            for (std::vector<int>::iterator i = v.begin();
                 i != v.end();
                 i++)
                std::cout << " " << *i;
          `, { hl: [7] })}
          ${H.java('<code class="inline">v.begin()</code> / <code class="inline">v.end()</code> jouent le rôle d’<code class="inline">Iterator</code> (<code class="inline">hasNext()</code> ≈ <code class="inline">i != v.end()</code>, <code class="inline">next()</code> ≈ <code class="inline">*i</code> puis <code class="inline">i++</code>). Le « for-each » Java s’écrit <code class="inline">for (auto x : v)</code>.')}
          ${H.info('<code class="inline">iterator</code> est un <strong>type interne</strong> du vecteur : celui qui implémente le concept d’itérateur pour cette classe.')}`
      },
      {
        title: 'Algorithmes : <code>std::sort</code>',
        section: 'STL',
        html: `
          <p>Les itérateurs fonctionnent <strong>comme des pointeurs</strong> : <code class="inline">++</code> (et, selon le conteneur, <code class="inline">--</code>) pour se déplacer,
          <code class="inline">*</code> et <code class="inline">-></code> pour accéder à la valeur.</p>
          ${H.cols(
            H.code(`
              #include <vector>
              #include <algorithm>

              std::vector<int> v;
              v.push_back(0); v.push_back(5); v.push_back(2);
              std::sort(v.begin(), v.end());
            `, { title: 'sur un vecteur' }),
            H.code(`
              #include <algorithm>

              int t[3] = {0, 5, 2};
              std::sort(t, t + 3);
            `, { title: 'sur un tableau C' })
          )}
          ${H.key('<code class="inline">std::sort</code> trie la séquence délimitée par <strong>deux itérateurs</strong>. Il marche donc avec tout conteneur fournissant des itérateurs <strong>à accès aléatoire</strong> (<code class="inline">vector</code>, <code class="inline">deque</code>)… et même avec les tableaux, car un pointeur <em>est</em> un itérateur. <span class="muted">(<code class="inline">std::list</code> n’en fournit pas : elle a sa propre méthode <code class="inline">l.sort()</code>.)</span>')}`
      },
      {
        title: 'La notion de concept',
        section: 'STL',
        html: `
          <p>La STL repose sur la notion de <em class="term">concept</em> : un peu comme une « interface », mais qui n’existe <strong>que sur le papier</strong>.
          C’est un ensemble de méthodes, types internes et propriétés que doit posséder une classe répondant au concept.</p>
          <p>Exemple : le concept <strong>« container »</strong> exige les types internes suivants :</p>
          ${H.table(['Type interne', 'Signification'], [
            ['X::value_type', 'type contenu'],
            ['X::iterator', 'type pour parcourir (« forward iterator »)'],
            ['X::const_iterator', 'type pour parcourir sans modifier'],
            ['X::reference', 'référence vers le type contenu'],
            ['X::const_reference', 'référence constante'],
            ['X::difference_type', 'différence entre deux itérateurs'],
            ['X::size_type', 'type des tailles']
          ], { cls: 'left' })}
          ${H.info('Depuis C++20, les <code class="inline">concept</code> existent enfin dans le langage lui-même.')}`
      },
      {
        title: 'Ce que propose la STL',
        section: 'STL',
        html: `
          <p>Un ensemble de classes paramétrées répondant à un ou plusieurs concepts :</p>
          <div class="cards">
            <div class="card"><h4>Séquences</h4><p>${['vector', 'deque', 'list', 'forward_list'].map(H.c).join(' ')}</p></div>
            <div class="card"><h4>Associatifs (triés)</h4><p>${['set', 'map', 'multiset', 'multimap'].map(H.c).join(' ')}</p></div>
            <div class="card"><h4>Associatifs (hachage)</h4><p>${['unordered_set', 'unordered_map'].map(H.c).join(' ')}</p></div>
            <div class="card"><h4>Chaînes</h4><p>${['string', 'basic_string'].map(H.c).join(' ')}</p></div>
          </div>
          <p>Ainsi qu’un ensemble d’<strong>algorithmes</strong> :</p>
          <div class="cards">
            <div class="card"><h4>Recherche / comptage</h4><p>${['for_each', 'find', 'find_if', 'count', 'count_if', 'equal', 'search', '…'].map(H.c).join(' ')}</p></div>
            <div class="card"><h4>Modification</h4><p>remplacement dans une séquence…</p></div>
            <div class="card"><h4>Réorganisation</h4><p>tris, mélange, rotation, renversement…</p></div>
            <div class="card"><h4>Extrema</h4><p>recherche d’élément, min, max…</p></div>
          </div>
          ${H.info('On trouve parfois <code class="inline">slist</code>, <code class="inline">hash_map</code>, <code class="inline">hash_set</code>… : ils viennent de la STL historique de SGI et <strong>ne sont pas standard</strong>. Leurs équivalents standard sont <code class="inline">forward_list</code>, <code class="inline">unordered_map</code> et <code class="inline">unordered_set</code>.')}`
      },
      {
        title: 'L’essentiel : templates',
        section: 'L’essentiel',
        html: `
          ${H.list([
            '<code class="inline">template&lt;class T&gt;</code> : un code « à trous », que le compilateur <strong>instancie</strong> pour chaque type utilisé.',
            'Le code d’un template va <strong>dans le <code class="inline">.hpp</code></strong> (pas seulement le prototype).',
            '<code class="inline">Entier&lt;int&gt;</code> et <code class="inline">Entier&lt;long&gt;</code> sont deux types <strong>sans aucun lien</strong>.',
            'Un template impose des <strong>contraintes</strong> sur T (copie, constructeur par défaut, <code class="inline">operator&lt;</code>…) : documentez-les.'
          ])}
          ${H.cols(
            H.quiz({
              q: 'Pourquoi met-on le code d’une fonction template dans le <code class="inline">.hpp</code> ?',
              options: ['Par convention, sans raison technique', 'Le compilateur doit voir le code pour générer une version par type', 'Pour qu’elle soit inline', 'Pour éviter le mangling'],
              answer: 1,
              explain: '<p>Sans le code, le compilateur ne peut pas fabriquer <code class="inline">swap&lt;int&gt;</code> au moment où vous l’utilisez dans un autre fichier.</p>'
            }),
            H.quiz({
              q: '<code class="inline">std::sort(t, t + 3)</code> fonctionne sur un tableau C <code class="inline">int t[3]</code> car…',
              options: ['sort est surchargé pour les tableaux', 'un pointeur se comporte comme un itérateur', 't est converti en vector'],
              answer: 1,
              explain: '<p><code class="inline">sort</code> attend deux itérateurs ; un pointeur offre <code class="inline">++</code>, <code class="inline">*</code>, <code class="inline">!=</code> : il convient.</p>'
            })
          )}`
      },
      {
        title: 'Métaprogrammation',
        section: 'Métaprogrammation',
        html: `
          <p class="lead">La <em class="term">métaprogrammation</em> consiste à faire exécuter un programme <strong>par le compilateur</strong>,
          au moment de la compilation, donc de façon <strong>statique</strong>.</p>
          <p>Exemple classique : un calcul mathématique simple.</p>
          ${H.code(`
            template<int a, int b>
            struct Addition {
                static const int resultat = a + b;
            };

            std::cout << Addition<2, 3>::resultat << std::endl;  // 5
          `)}
          ${H.key('<code class="inline">5</code> est calculé par le compilateur : le programme exécuté ne fait qu’afficher une constante.')}`
      },
      {
        title: 'Récursion à la compilation : <code>Puissance</code>',
        section: 'Métaprogrammation',
        html: `
          ${H.cols(
            H.code(`
              template<int a, int b>
              struct Puissance {
                  static const int resultat =
                      a * Puissance<a, b - 1>::resultat;
              };

              template<int a>
              struct Puissance<a, 0> {
                  static const int resultat = 1;
              };

              std::cout << Puissance<2, 3>::resultat;
            `, { small: true }),
            powDiagram
          )}`
      },
      {
        title: 'Les ingrédients de la métaprogrammation',
        section: 'Métaprogrammation',
        html: `
          <p>La métaprogrammation permet des choses très puissantes, comme la <strong>composition de types</strong>.
          Elle reste cependant réservée à l’implémentation de bibliothèques complexes et est difficile à maîtriser.</p>
          <p>Elle repose sur :</p>
          <div class="cards">
            <div class="card"><div class="ci">🧩</div><h4>les templates</h4></div>
            <div class="card"><div class="ci">🎯</div><h4>la spécialisation</h4><p>= les « if » et les cas d’arrêt</p></div>
            <div class="card"><div class="ci">🏷️</div><h4>les types internes</h4><p>= les « valeurs » de type</p></div>
            <div class="card"><div class="ci">🔒</div><h4>les attributs static const</h4><p>= les valeurs calculées</p></div>
          </div>`
      },
      {
        title: 'Un « langage » sur les types : <code>IfThenElse</code>',
        section: 'Métaprogrammation',
        html: `
          <p>On peut écrire des <strong>branchements conditionnels</strong> sur les types :</p>
          ${H.code(`
            template<bool C, class T, class E>
            struct IfThenElse {
                typedef T result;      // cas général : C vaut true
            };

            template<class T, class E>
            struct IfThenElse<false, T, E> {
                typedef E result;      // spécialisation : C vaut false
            };

            IfThenElse<true, int, char>::result i;  // i est un int
          `)}
          ${H.quiz({
            q: 'De quel type est <code class="inline">x</code> dans <code class="inline">IfThenElse&lt;false, int, char&gt;::result x;</code> ?',
            options: ['int', 'char', 'bool', 'Erreur de compilation'],
            answer: 1,
            explain: '<p>La spécialisation <code class="inline">IfThenElse&lt;false, T, E&gt;</code> est choisie : <code class="inline">result</code> vaut <code class="inline">E</code>, soit <code class="inline">char</code>.</p>'
          })}`
      },
      {
        title: 'Comparaison de types : <code>Equal</code>',
        section: 'Métaprogrammation',
        html: `
          ${H.code(`
            template<class T, class U>
            struct Equal {
                static const bool result = false;
            };

            template<class T>
            struct Equal<T, T> {
                static const bool result = true;
            };

            bool b = Equal<int, size_t>::result;  // false

            IfThenElse<Equal<int, ssize_t>::result,
                       int,
                       long>::result i;
          `)}
          ${H.info('La spécialisation <code class="inline">Equal&lt;T, T&gt;</code> n’est choisie que si les deux paramètres sont <strong>le même type</strong>. On combine ensuite les « méta-fonctions » entre elles.')}`
      },
      {
        title: 'Métaprogrammation et optimisation',
        section: 'Métaprogrammation',
        html: `
          <p>Ce type de métaprogrammation sert à l’<strong>optimisation</strong> : choisir la meilleure structure selon le type.</p>
          ${H.code(`
            template<class T>
            struct IsPointer {
                static const bool result = false;
            };
            template<class T>
            struct IsPointer<T *> {
                static const bool result = true;
            };

            template<class T>
            class MaClasse {
                typedef typename IfThenElse<IsPointer<T>::result,
                                            std::list<T>,
                                            std::vector<T> >::result icontainer;
                icontainer _data;
                // ...
            };
          `, { small: true, hl: [12, 13, 14] })}
          ${H.tip('<code class="inline">MaClasse&lt;int *&gt;</code> stocke ses données dans une <code class="inline">list</code>, <code class="inline">MaClasse&lt;int&gt;</code> dans un <code class="inline">vector</code> — choix fait à la compilation.')}
          ${H.info('Le mot-clé <code class="inline">typename</code> est nécessaire pour dire au compilateur que <code class="inline">…::result</code> (qui dépend de <code class="inline">T</code>) est un type.')}`
      },
      {
        title: 'Cacher les templates par inférence',
        section: 'Métaprogrammation',
        html: `
          <p>On peut utiliser les fonctions templates pour <strong>inférer des types</strong> et « cacher » les templates à l’utilisateur :</p>
          ${H.code(`
            struct Interface {
                virtual ~Interface() {}
                // ...
            };

            template<class T>
            class MaClasse : public Interface {
                typedef typename IfThenElse<IsPointer<T>::result,
                                            std::list<T>, std::vector<T> >::result icontainer;
                icontainer _data;
            public:
                MaClasse(const T &t) { /* ... */ }
            };

            template<class U>
            static MaClasse<U> *getClasse(const U &value) {
                return new MaClasse<U>(value);
            }

            int main() {
                Interface *i = getClasse(0);  // U déduit : int
                delete i;
            }
          `, { small: true, hl: [16, 17, 18, 21] })}
          ${H.key('L’utilisateur ne manipule qu’une <code class="inline">Interface *</code> : le type <code class="inline">U</code> est déduit de l’argument par <code class="inline">getClasse</code>.')}`
      },
      {
        title: 'Des API simplifiées',
        section: 'Métaprogrammation',
        html: `
          <p>La métaprogrammation permet de faire des API où l’on exprime un <strong>besoin</strong> plutôt qu’une implémentation :</p>
          ${H.code(`
            struct RandomContainer {};
            struct ReversibleContainer {};

            template<class T, class Type>
            struct Container {
                typedef std::vector<T> result;
            };

            template<class T>
            struct Container<T, ReversibleContainer> {
                typedef std::list<T> result;
            };

            Container<int, RandomContainer>::result container;  // std::vector<int>
          `)}
          ${H.info('Les structures vides <code class="inline">RandomContainer</code> et <code class="inline">ReversibleContainer</code> ne servent que d’<strong>étiquettes</strong> (tags) pour choisir la spécialisation.')}`
      }
    ]
  });
})();
