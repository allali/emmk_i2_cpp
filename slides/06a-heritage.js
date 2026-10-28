(function () {
  /* Diagramme de classes Tuyau / TuyauPer */
  const tuyauDiagram = H.diagram({
    w: 520, h: 250, maxw: 520,
    common: {
      boxes: [
        { id: 'base', x: 150, y: 10, w: 220, h: 92, kind: 'cls', label: 'Tuyau\n- _diametre : double\n+ debit() const\n+ diametre() const', fs: 13 },
        { id: 'der', x: 150, y: 150, w: 220, h: 76, kind: 'cls', label: 'TuyauPer\n- _densite : double\n+ densite() const', fs: 13 }
      ],
      arrows: [{ from: 'der', to: 'base', kind: 'inherit' }],
      texts: [{ x: 385, y: 132, text: 'est un (sous-type)', fs: 12, cls: 'muted' }]
    }
  });

  /* Ordre des appels constructeurs / destructeurs */
  const out = (lines) => ({ id: 'out', x: 20, y: 40, w: 260, h: 200, kind: 'plain', label: lines.length ? lines.join('\n') : ' ', fs: 15 });
  const cascadeDiagram = H.diagram({
    w: 300, h: 260, maxw: 420,
    code: `
      class Mere{
          public:
          Mere(){ puts("Mere"); }
          ~Mere(){ puts("~Mere"); }
      };
      class Fille: public Mere{
          public:
          Fille(){ puts("Fille"); }
          ~Fille(){ puts("~Fille"); }
      };
      {
          Fille f;
      }
    `,
    codeTitle: 'cascade.cpp',
    common: { texts: [{ x: 20, y: 28, text: 'Sortie :', fs: 14, cls: 'muted' }] },
    steps: [
      { line: 12, boxes: [out([])], note: 'Construction de <code class="inline">f</code> : on commence par la partie <b>Mere</b>…' },
      { line: 3, boxes: [out(['Mere'])], note: 'Le constructeur de <code class="inline">Mere</code> est appelé en premier.' },
      { line: 8, boxes: [out(['Mere', 'Fille'])], note: '…puis le corps du constructeur de <code class="inline">Fille</code>.' },
      { line: 13, boxes: [out(['Mere', 'Fille', '~Fille'])], note: 'Sortie du bloc : le destructeur de <code class="inline">Fille</code> s’exécute…' },
      { line: 4, boxes: [out(['Mere', 'Fille', '~Fille', '~Mere'])], note: '…et à sa fin, le compilateur ajoute l’appel au destructeur de <code class="inline">Mere</code>. Ordre <b>inverse</b> de la construction.' }
    ]
  });

  Course.chapter({
    id: 'heritage',
    num: 5,
    title: 'Héritage & polymorphisme',
    icon: '🧬',
    color: '#ec4899',
    intro: 'Construire un type à partir d’un autre, puis choisir la bonne méthode à l’exécution.',
    sections: ['Principe', 'Appel de méthodes', 'Constructeurs & destructeurs', 'Affectation & delete', 'public / protected / private',
      'Polymorphisme & vtable', 'Virtuelle pure & redéfinition', 'Résolution des appels', 'Classes abstraites', 'Héritage multiple', 'L’essentiel'],
    slides: [
      {
        title: 'Où en est-on ?',
        section: 'Principe',
        html: `
          <p class="lead">Jusqu’à présent, nous avons vu des mécanismes d’<strong>encapsulation</strong> : le C++ permet de faire des <code class="inline">struct</code> <em class="term">améliorées</em>.</p>
          <div class="cards">
            <div class="card"><div class="ci">⚙️</div><h4>Comportements</h4><p>ajout de méthodes</p></div>
            <div class="card"><div class="ci">🔒</div><h4>Visibilité</h4><p>public / protected / private</p></div>
            <div class="card"><div class="ci">🏗️</div><h4>Cycle de vie</h4><p>constructeurs (initialisation) et destructeurs (libération)</p></div>
            <div class="card"><div class="ci">📋</div><h4>Copie</h4><p>contrôle de la copie (recopie, affectation)</p></div>
          </div>
          ${H.info('S’y ajoutent l’allocation dynamique avec <code class="inline">new</code>, les espaces de noms et les références.')}
          ${H.key('Il nous manque maintenant la <strong>réutilisation</strong> et le <strong>polymorphisme</strong> : c’est le rôle de l’héritage.', 'La suite')}`
      },
      {
        title: 'Héritage : définition',
        section: 'Principe',
        html: `
          <p>L’<em class="term">héritage</em> permet de construire un type <code class="inline">T</code> à partir d’un autre type <code class="inline">Base</code>.
          <code class="inline">T</code> se retrouve doté des <strong>comportements</strong> (méthodes) et des <strong>propriétés</strong> (attributs) de <code class="inline">Base</code>.</p>
          ${H.cols(
            `${H.list([
              '<code class="inline">T</code> est un <b>sous-type</b> de <code class="inline">Base</code> (ou classe <b>dérivée</b>).',
              '<code class="inline">Base</code> est un <b>super-type</b> de <code class="inline">T</code> (classe de base).',
              'Une <b>relation de typage</b> relie les deux : un <code class="inline">T</code> <em>est un</em> <code class="inline">Base</code>.'
            ])}`,
            `${H.code(`
              class T : public Base {
                  ...
              };
            `, { title: 'déclaration' })}
             <p class="muted">Nous reviendrons plus tard sur le sens du <code class="inline">public</code>.</p>`
          )}
          ${H.java('<code class="inline">class T extends Base</code> s’écrit <code class="inline">class T : public Base</code>. Le <code class="inline">public</code> est à écrire explicitement : sans lui, l’héritage est <b>privé</b> et la relation « T est un Base » n’est plus visible de l’extérieur.')}`
      },
      {
        title: 'Héritage : exemple',
        section: 'Principe',
        html: `
          ${H.cols(
            H.files([
              { name: 'Tuyau', code: `
                class Tuyau{
                    double _diametre;
                public:
                    double debit() const;
                    double diametre() const;
                };` },
              { name: 'TuyauPer', code: `
                class TuyauPer : public Tuyau{
                    double _densite;
                public:
                    double densite() const;
                };` }
            ], { stack: true }),
            tuyauDiagram
          )}
          ${H.code(`
            TuyauPer tper;
            Tuyau &tuyau = tper;  // relation de typage
            tper.densite();       // ok
            tuyau.densite();      // erreur !
            tper.debit();         // ok : méthode héritée
          `)}
          ${H.info('Via une référence de type <code class="inline">Tuyau</code>, on ne voit que l’interface de <code class="inline">Tuyau</code> : <code class="inline">densite()</code> n’y existe pas.')}`
      },
      {
        title: 'Héritage : pointeurs et références',
        section: 'Principe',
        html: `
          <p>La relation de typage ne peut jouer <strong>qu’avec des pointeurs ou des références</strong> :
          on veut manipuler <em>une même instance</em> à travers des variables de types différents.</p>
          ${H.code(`
            TuyauPer tper;
            Tuyau t = tper;       // pas de relation de typage : copie !
            Tuyau *p = &tper;     // ok
            Tuyau &r = tper;      // ok
            TuyauPer &r2 = r;     // Erreur !
          `, { mark: { 2: 'warn', 3: 'ok', 4: 'ok', 5: 'err' } })}
          ${H.warn('<code class="inline">Tuyau t = tper;</code> <strong>compile</strong>, mais crée un <em>nouvel</em> objet <code class="inline">Tuyau</code> par recopie de la seule partie <code class="inline">Tuyau</code> de <code class="inline">tper</code>. C’est le <strong>« slicing »</strong> (découpage) : <code class="inline">_densite</code> est perdue et <code class="inline">t</code> n’a plus aucun lien avec <code class="inline">tper</code>. Ce n’est donc pas une utilisation de la relation de typage.', 'Slicing')}
          ${H.rule('Un <code class="inline">Base&amp;</code> ou <code class="inline">Base*</code> peut désigner un <code class="inline">T</code> ; l’inverse (<code class="inline">TuyauPer &amp;r2 = r;</code>) est refusé sans conversion explicite.')}`
      },
      {
        title: 'Appel de méthodes',
        section: 'Appel de méthodes',
        html: `
          <p>En C++, un appel de méthode doit être vu comme un <strong>appel de fonction</strong> avec un premier paramètre caché (<code class="inline">this</code>).
          La méthode choisie est celle du <strong>type de la variable</strong> ; si elle n’y est pas directement, c’est la méthode compatible du <strong>parent le plus proche</strong>.</p>
          ${H.cols(
            H.code(`
              class A{
              public:
                  void f(char){ puts("A"); }
              };
              class B : public A{
              public:
                  void f(int){ puts("B"); }
              };
              class C : public B{ };
            `),
            H.code(`
              C c;
              c.f(1);       // => B
              c.f('a');     // => B  (char converti en int !)
              c.A::f('A');  // => A
              c.B::f('a');  // => B
              B &b = c;
              b.f('a');     // => B
            `)
          )}
          ${H.tip('On utilise l’<strong>opérateur de portée</strong> <code class="inline">A::</code> pour préciser la méthode à appeler.')}
          ${H.info('<code class="inline">c.f(\'a\')</code> appelle <code class="inline">B::f</code> : dès qu’une méthode nommée <code class="inline">f</code> est trouvée dans <code class="inline">B</code>, la recherche s’arrête, même si <code class="inline">A::f(char)</code> serait plus précise.')}`
      },
      {
        title: 'Appel : type de la variable',
        section: 'Appel de méthodes',
        html: `
          ${H.cols(
            H.code(`
              class A{
              public:
                  void m(){}
              };
              class B : public A{
              public:
                  void m(){}
              };
            `),
            H.code(`
              B b;
              A a;
              A &r = b;
              b.m();   // b est de type B   => B::m()
              a.m();   // a est de type A   => A::m()
              r.m();   // r est de type A   => A::m()
              A *p = &b;
              p->m();  // p est de type A * => A::m()
            `, { hl: [6, 8] })
          )}
          ${H.key('Sans mot-clé particulier, c’est le <strong>type de la variable</strong> (connu à la compilation) qui décide, et non le type réel de l’instance : <code class="inline">r</code> désigne un <code class="inline">B</code> mais appelle <code class="inline">A::m()</code>.')}`
      },
      {
        title: 'Le piège n°1 quand on vient de Java',
        section: 'Appel de méthodes',
        html: `
          <p>Le « même » programme n’affiche pas la même chose :</p>
          ${H.javaCpp(`
            class A { void m() { System.out.println("A"); } }
            class B extends A { void m() { System.out.println("B"); } }

            A r = new B();
            r.m();   // affiche B
          `, `
            class A { public: void m() { puts("A"); } };
            class B : public A { public: void m() { puts("B"); } };

            B b;
            A &r = b;
            r.m();   // affiche A !
          `, { hl: [6] })}
          ${H.java('Toutes les méthodes sont <b>virtuelles par défaut</b> : c’est toujours le type réel de l’objet qui décide.')}
          ${H.key('En C++, les méthodes <b>ne sont pas virtuelles</b> par défaut. Pour obtenir le comportement de Java, il faut le demander avec le mot-clé <code class="inline">virtual</code> (voir plus loin).')}`
      },
      {
        title: 'Héritage et « mangling »',
        section: 'Appel de méthodes',
        html: `
          <p>Le <em class="term">mangling</em> désigne la façon de générer un <strong>nom de symbole</strong> à partir d’une fonction ou d’une méthode :</p>
          ${H.cmd(`
            $ g++ -c mang.cpp
            $ nm mang.o
            0000000000000000 T _ZN1A1mEv
            0000000000000010 T _ZN1B1mEv
          `)}
          <p>La première correspond à <code class="inline">A::m()</code>, la deuxième à <code class="inline">B::m()</code> : <code class="inline">_Z N 1A 1m E v</code> = nom imbriqué, classe <code class="inline">A</code> (1 caractère), méthode <code class="inline">m</code>, sans argument (<code class="inline">void</code>).</p>
          ${H.warn('Cet encodage n’est <strong>pas défini par la norme</strong> C++, qui n’impose pas non plus d’ABI : en toute généralité, des objets compilés avec un compilateur ne sont pas exploitables avec un autre ! En pratique, g++ et clang++ suivent la même convention (l’ABI « Itanium ») et sont compatibles ; MSVC (Windows) a la sienne.')}
          ${H.info('En C, il n’y a pas de mangling : une fonction génère un symbole de même nom qu’elle.')}`
      },
      {
        title: 'Question',
        section: 'Appel de méthodes',
        layout: 'center',
        html: H.quiz({
          q: 'Le polymorphisme ne fonctionne qu’avec l’utilisation des pointeurs et des références ?',
          options: ['vrai', 'faux'],
          answer: 0,
          explain: '<p><strong>Vrai.</strong> Pour qu’il y ait polymorphisme, il faut manipuler <em>une même instance</em> via une variable d’un autre type. Avec une variable par valeur, le type est fixé à la compilation (et une copie « slicée » est créée).</p>'
        })
      },
      {
        title: 'Question',
        section: 'Appel de méthodes',
        layout: 'center',
        html: H.quiz({
          q: '<code class="inline">A</code> ne possède ni attribut, ni méthode, ni classe de base. Que vaut <code class="inline">sizeof(A)</code> ?',
          options: ['0', '1', '4', '4 en 32 bits, 8 en 64 bits'],
          answer: 1,
          explain: '<p><strong>1 octet.</strong> Deux objets distincts doivent avoir des <b>adresses distinctes</b> : une taille nulle est donc interdite. Le compilateur réserve au minimum un octet.</p>'
        })
      },
      {
        title: 'Héritage et constructeur',
        section: 'Constructeurs & destructeurs',
        html: `
          <p>Lors de la construction d’une <code class="inline">Fille</code>, sa partie <code class="inline">Mere</code> doit elle aussi être initialisée :
          le compilateur ajoute un appel au <strong>constructeur par défaut</strong> de <code class="inline">Mere</code>.</p>
          ${H.cols(
            H.code(`
              class Mere{
                  public:
                  Mere(){ puts("Mere"); }
              };
              class Fille: public Mere{
                  public:
                  Fille(){ puts("Fille"); }
              };
            `),
            `${H.code(`
              Fille f;
              /* Affiche :
                 Mere
                 Fille  */
            `)}`
          )}
          ${H.frag(H.warn('Comment faire si la classe <code class="inline">Mere</code> <strong>n’a pas</strong> de constructeur par défaut ?', 'Question'))}`
      },
      {
        title: 'Choisir le constructeur de la classe mère',
        section: 'Constructeurs & destructeurs',
        html: `
          <p>On indique le constructeur à appeler dans la <strong>liste d’initialisation</strong> :</p>
          ${H.cols(
            H.code(`
              class Mere{
                  public:
                  Mere(int i){ puts("Mere"); }
              };
              class Fille: public Mere{
                  public:
                  Fille():Mere(1)
                  { puts("Fille"); }
              };
            `, { hl: [7] }),
            H.code(`
              Fille f;
              /* Affiche :
                 Mere
                 Fille  */
            `)
          )}
          ${H.java('On écrit <code class="inline">super(1);</code> en première ligne du constructeur. En C++, l’appel se place dans la <b>liste d’initialisation</b> : <code class="inline">Fille() : Mere(1) { … }</code>.')}
          ${H.rule('L’appel au constructeur de <code class="inline">Mere</code> se fait <strong>avant</strong> l’initialisation des attributs de la classe. Si on l’écrit après, le compilateur <strong>réordonne</strong> les initialisations.')}`
      },
      {
        title: 'Piège : l’ordre des initialisations',
        section: 'Constructeurs & destructeurs',
        html: `
          ${H.cols(
            H.code(`
              class Mere{
                  public:
                  Mere(int i){
                      printf("Mere : %d\\n", i);
                  }
              };
              class Fille: public Mere{
                  int v;
                  public:
                  Fille():v(1),Mere(v)
                  { puts("Fille"); }
              };
            `, { mark: { 10: 'err' } }),
            `${H.code(`
              Fille f;
              /* Affiche :
                 Mere : -1479451508
                 Fille  */
            `)}
             ${H.list(['<code class="inline">Mere(v)</code> est exécuté <b>en premier</b>…', '…alors que <code class="inline">v</code> n’est pas encore initialisé : valeur <b>indéterminée</b>.'], { frag: true })}`
          )}
          ${H.warn('Avec <code class="inline">-Wall</code>, le compilateur signale l’inversion ; sinon <strong>rien n’est dit</strong>.')}`
      },
      {
        title: 'Héritage et destructeur',
        section: 'Constructeurs & destructeurs',
        html: `
          <p>Comme pour le constructeur, les destructeurs sont appelés <strong>en cascade</strong> : à la fin du destructeur de <code class="inline">Fille</code>,
          un appel au destructeur de <code class="inline">Mere</code> est ajouté.</p>
          ${cascadeDiagram}
          ${H.key('Construction : de la base vers la dérivée. Destruction : dans l’ordre <strong>inverse</strong>.')}`
      },
      {
        title: 'Héritage et opérateur d’affectation',
        section: 'Affectation & delete',
        html: `
          <p>Le compilateur ajoute un opérateur d’affectation s’il n’est pas écrit. Celui-ci fait appel à l’opérateur de la classe <code class="inline">Mere</code> (et à celui de chaque attribut) :</p>
          ${H.cols(
            H.code(`
              class Mere{
                  int _v;
                  public:
                  Mere(int v=0):_v(v){}
                  const Mere &operator=(const Mere &){
                      printf("Mere:%d\\n", _v);
                      return *this;
                  }
              };
              class Fille: public Mere{
                  Mere m;
                  public:
                  Fille():Mere(10){}
              };
            `),
            `${H.code(`
              {
                  Fille f, g;
                  f = g;
              }
              /* Affiche :
                 Mere:10
                 Mere:0   */
            `)}
             ${H.list(['<code class="inline">Mere:10</code> : affectation de la <b>partie Mere</b> de <code class="inline">f</code> (construite avec 10).', '<code class="inline">Mere:0</code> : affectation de l’<b>attribut</b> <code class="inline">m</code> (construit par défaut).'], { frag: true })}`
          )}`
      },
      {
        title: 'L’opérateur ajouté par le compilateur',
        section: 'Affectation & delete',
        html: `
          <p>Voici à quoi ressemble l’opérateur d’affectation ajouté par le compilateur :</p>
          ${H.code(`
            class Fille: public Mere{
                ...
                public:
                Fille &operator=(const Fille &f){
                    Mere::operator=(f);            // d'abord la partie Mere
                    this->attribut1 = f.attribut1; // puis chaque attribut
                    this->attribut2 = f.attribut2;
                    ...
                    return *this;
                }
            };
          `, { hl: [5] })}
          ${H.rule('Si l’on écrit <strong>notre propre</strong> opérateur d’affectation, c’est à nous d’appeler <strong>explicitement</strong> celui de la classe <code class="inline">Mere</code>.')}`
      },
      {
        title: 'Ne pas oublier <code>Mere::operator=</code>',
        section: 'Affectation & delete',
        html: `
          ${H.variants([
            {
              label: '❌ Oubli',
              code: `
                class A{
                    public:
                    const A &operator=(const A &){
                        puts("A=A"); return *this; }
                };
                class M{
                    A a;
                };
                class F: public M{
                    public:
                    const F &operator=(const F &f){
                        return *this;
                    }
                };

                F f, g;
                f = g;   // Pas d'affichage !
              `,
              note: 'L’opérateur de <code class="inline">F</code> ne fait rien : la partie <code class="inline">M</code> (et donc son attribut <code class="inline">a</code>) n’est <strong>pas copiée</strong>.'
            },
            {
              label: '✅ Appel explicite',
              code: `
                class A{
                    public:
                    const A &operator=(const A &){
                        puts("A=A"); return *this; }
                };
                class M{
                    A a;
                };
                class F: public M{
                    public:
                    const F &operator=(const F &f){
                        M::operator=(f);
                        return *this;
                    }
                };

                F f, g;
                f = g;   // Affiche A=A
              `,
              hl: [12],
              note: 'On peut appeler l’opérateur <strong>ajouté par le compilateur</strong> dans <code class="inline">M</code> : il copie ses attributs, donc appelle <code class="inline">A::operator=</code>.'
            }
          ], { small: true })}`
      },
      {
        title: 'C++11 : <code>= delete</code>',
        section: 'Affectation & delete',
        html: `
          <p>Le C++11 introduit un nouvel usage du mot-clé <code class="inline">delete</code> : <strong>supprimer</strong> une fonction.</p>
          ${H.cols(
            H.code(`
              class M{
                  public:
                  void f() = delete;
              };

              M m;
              m.f();
            `),
            H.cmd(`
              op_del.cpp:9:6: error: use of deleted
                  function 'void M::f()'
              9 |   m.f();
            `)
          )}`
      },
      {
        title: 'Supprimer la copie',
        section: 'Affectation & delete',
        html: `
          <p>Usage courant : supprimer les fonctionnalités <strong>ajoutées automatiquement</strong> par le compilateur.</p>
          ${H.code(`
            class A{
                int m;
            public:
                A(int x) : m(x) {}
                A &operator=(const A &) = delete;
                A(const A &) = delete;
            };

            A a1(1), a2(2);
            a1 = a2;    // Error
            A a3(a2);   // Error
          `, { hl: [5, 6] })}
          ${H.key('C’est très souvent associé à l’héritage : <strong>dès qu’il y a de l’héritage, on supprime la copie</strong> (et on évite ainsi le slicing).')}`
      },
      {
        title: 'Héritage public, protected et private',
        section: 'public / protected / private',
        html: `
          <p>Trois formes d’héritage : ${H.c('class T : public Base')}, ${H.c('class T : protected Base')} et ${H.c('class T : private Base')}.</p>
          ${H.info('L’héritage est <strong>privé par défaut</strong> avec <code class="inline">class</code>, et <strong>public par défaut</strong> avec <code class="inline">struct</code>.')}
          ${H.table(['Membre dans Base', 'héritage public', 'héritage protected', 'héritage private'], [
            ['public', 'public', 'protected', 'private'],
            ['protected', 'protected', 'protected', 'private'],
            ['private', 'inaccessible', 'inaccessible', 'inaccessible']
          ])}
          <p class="muted">Dans le cas public, la relation entre <code class="inline">T</code> et <code class="inline">Base</code> est visible de tous.</p>`
      },
      {
        title: 'Qui peut voir un T comme un Base ?',
        section: 'public / protected / private',
        html: `
          <p>On ne peut utiliser la relation type / sous-type que si l’on a accès aux membres publics de <code class="inline">Base</code> à travers <code class="inline">T</code>.</p>
          ${H.table(['Héritage', 'Qui peut voir un T comme un Base ?'], [
            ['public', 'tout le monde'],
            ['protected', 'T, ses amies, ses sous-classes et leurs amies'],
            ['private', 'T et ses fonctions / classes amies']
          ], { cls: 'left' })}
          ${H.cols(
            H.code(`
              class A{ ... };
              class B: public A{ ... };
              class C: protected A{ ... };
              class D: public C{ ... };
              class E: private A{ ... };
              class F: public E{ ... };
            `),
            H.code(`
              B b;
              A &a = b;         // ok
              C c;
              A *p = &c;        // erreur !
              void D::f(){
                  A &r = *this; // ok
              }
              void F::f(){
                  A &r = *this; // erreur
              }
              void E::f(){
                  A &r = *this; // ok
              }
            `)
          )}`
      },
      {
        title: 'Hériter d’une implémentation',
        section: 'public / protected / private',
        html: `
          <p>L’héritage <code class="inline">protected</code> ou <code class="inline">private</code> permet de <strong>récupérer une implémentation</strong> sans exposer la relation « est un ».
          C’est une alternative efficace à la <em class="term">délégation</em> (lien « a un »).</p>
          ${H.variants([
            {
              label: 'Délégation',
              code: `
                class Pile{
                    Vector _v;  // Pile "a un" Vector
                public:
                    void empiler(int x){ _v.push_back(x); }
                    int  depiler();
                };
              `,
              note: 'La solution sans héritage : un attribut de type <code class="inline">Vector</code> utilisé pour implémenter la pile.'
            },
            {
              label: 'Héritage privé',
              code: `
                class Pile : private Vector{
                public:
                    void empiler(int x){ push_back(x); }
                    int  depiler();
                };

                Pile p;
                p.push_back(3);  // erreur : privé dans Pile
                Vector &v = p;   // erreur : relation invisible
              `,
              note: 'Une pile n’est <strong>pas</strong> un vecteur particulier : on ne veut pas qu’elle présente toutes les méthodes de <code class="inline">Vector</code>.'
            }
          ])}
          ${H.rule('Si la « délégation » doit être accessible aux sous-classes : héritage <code class="inline">protected</code> ; sinon : héritage <code class="inline">private</code>.')}`
      }
    ]
  });
})();
