Course.chapter({
  id: 'classes',
  num: 3,
  title: 'Classes',
  icon: '🧱',
  color: '#8b5cf6',
  intro: 'Regrouper données et comportements : déclarer, instancier, protéger et initialiser des objets.',
  sections: ['Définition et déclaration', 'Visibilité, friend, struct', 'Attributs et méthodes', 'this', 'Espaces de noms', 'Références et const', 'Constructeur', 'Destructeur', 'static', 'Exemple : Compteur', 'Exemple : Point', 'Exemple : Matrix', 'L’essentiel'],
  slides: [
    /* ---------------- Définition et déclaration ---------------- */
    {
      title: 'Les classes : déclaration',
      section: 'Définition et déclaration',
      html: `
        <p class="lead">Une classe est un <strong>regroupement d’attributs et de méthodes</strong>.</p>
        ${H.cols(
          H.code(`
            class NomClasse {
                // attributs
                ...
                // méthodes
                ...
            };  // ne pas oublier le ;
          `),
          `${H.list([
            'Pas d’<strong>ordre des déclarations</strong> imposé par le langage.',
            'La classe est une <strong>description</strong> des données internes et des comportements qu’aura une instance générée par cette classe.'
          ])}
           ${H.key('Classe = <b>plan de construction</b> ; instance = <b>objet construit</b> à partir de ce plan.')}`
        )}`
    },
    {
      title: 'Les classes : instanciation',
      section: 'Définition et déclaration',
      html: `
        <p>L’<em class="term">instanciation</em> (ou réification) est la création d’un objet <b>instance</b> (ressource)
        à partir de l’objet <b>classe</b> (description / générateur). Elle peut être :</p>
        ${H.cols(
          `${H.code(`
             A *x = new A();
             A *y = new A{};
           `, { title: 'allocation dynamique' })}
           <p>L’instance est située dans le <strong>tas</strong>.</p>`,
          `${H.code(`
             A z;
             A t{};
           `, { title: 'allocation automatique' })}
           <p>L’instance est située dans la <strong>pile</strong>.</p>`
        )}
        ${H.info('Dans les deux cas, une ressource (une adresse mémoire) est associée à l’instance.')}
        ${H.java('<code class="inline">A z;</code> déclare une <b>référence</b> qui vaut <code class="inline">null</code> ; seul <code class="inline">new</code> crée un objet. En C++, <code class="inline">A z;</code> <strong>construit un objet</strong>, directement dans la pile.')}`
    },

    /* ---------------- Visibilité, friend, struct ---------------- */
    {
      title: 'Visibilité : définition',
      section: 'Visibilité, friend, struct',
      html: `
        <p>On contrôle l’accès aux méthodes et attributs, depuis une sous-classe ou un objet extérieur, avec
        ${H.c('public')}, ${H.c('protected')} et ${H.c('private')} :</p>
        ${H.table(['', 'la classe', 'sous-classe', 'extérieur'], [
          ['public', 'oui', 'oui', 'oui'],
          ['protected', 'oui', 'oui', 'non'],
          ['private', 'oui', 'non', 'non']
        ])}
        ${H.info('Les membres <code class="inline">protected</code> et <code class="inline">private</code> ne peuvent être accédés qu’à partir d’une <strong>fonction membre</strong>.')}`
    },
    {
      title: 'Visibilité : déclaration',
      section: 'Visibilité, friend, struct',
      html: `
        ${H.cols(
          H.code(`
            class NomClasse {
                // attributs et méthodes privés
            public:
                // attributs et méthodes publics
            protected:
                // attributs et méthodes protégés
                ...
            };
          `),
          `${H.key('La visibilité <strong>par défaut</strong> dans une classe est <code class="inline">private</code>.')}
           <p>On peut changer la visibilité <strong>à tout moment</strong> : elle s’applique à toutes les déclarations suivantes, jusqu’au prochain changement.</p>
           ${H.java('La visibilité s’écrit devant <b>chaque</b> membre, et sans mot-clé elle vaut « package ». En C++, on écrit <code class="inline">public:</code> une fois pour tout un bloc, et le défaut est <code class="inline">private</code>.')}`
        )}`
    },
    {
      title: 'Les structures',
      section: 'Visibilité, friend, struct',
      html: `
        ${H.cols(
          `${H.code(`
             struct Nom {
                 ...
                 // attributs et méthodes publics
                 ...
             };
           `, { title: 'déclaration (comme en C)' })}`,
          `${H.key('En C++, une <code class="inline">struct</code> est une <strong>classe dont la visibilité par défaut est <code class="inline">public</code></strong>.')}
           ${H.list([
             'elle peut donc contenir des attributs <b>et des méthodes</b> ;',
             'deux noms de type lui sont associés : <code class="inline">struct Nom</code> et <code class="inline">Nom</code> ;',
             'les structures C sont un cas particulier des structures C++.'
           ])}`
        )}`
    },
    {
      title: 'Les structures : instanciation',
      section: 'Visibilité, friend, struct',
      html: `
        <p>L’instanciation des structures se fait comme pour les classes.</p>
        <div class="cols" style="--n:2; grid-template-columns: minmax(0, 2fr) minmax(0, 1fr)">
          <div class="col">${H.code(`
            struct A { ... };
            A *x = new A(); // erreur si une fonction A existe
            A *x = new struct A();
            struct A *x = new struct A();
          `, { title: 'allocation dynamique' })}</div>
          <div class="col">${H.code(`
            struct A { ... };
            A x;
            struct A x;
          `, { title: 'allocation automatique' })}</div>
        </div>
        ${H.tip('Le nom <code class="inline">struct A</code> lève l’ambiguïté si une fonction porte aussi le nom <code class="inline">A</code> (héritage du C).')}`
    },
    {
      title: '<code>friend</code> : définition',
      section: 'Visibilité, friend, struct',
      html: `
        <p>Dans une classe <code class="inline">A</code>, le mot-clé ${H.c('friend')} donne à une <strong>fonction</strong> ou à une <strong>autre classe</strong>
        les mêmes droits qu’une méthode de <code class="inline">A</code>.</p>
        ${H.table(['', 'la classe', 'friend', 'sous-classe', 'extérieur'], [
          ['public', 'oui', 'oui', 'oui', 'oui'],
          ['protected', 'oui', 'oui', 'oui', 'non'],
          ['private', 'oui', 'oui', 'non', 'non']
        ])}
        ${H.info('Une fonction <code class="inline">f</code> amie d’une classe <code class="inline">A</code> peut accéder aux attributs privés de <code class="inline">A</code>, ainsi qu’aux attributs <code class="inline">protected</code> hérités des classes parentes de <code class="inline">A</code>.')}`
    },
    {
      title: '<code>friend</code> : déclaration',
      section: 'Visibilité, friend, struct',
      html: `
        <p>La déclaration se fait <strong>dans la classe</strong>, en indiquant soit le nom de la classe amie, soit le prototype de la fonction amie :</p>
        ${H.cols(
          H.code(`
            class NomClasse { ...
                friend class NomClasseAmie;
            };
          `, { title: 'classe amie' }),
          H.code(`
            class NomClasse { ...
                friend void fonctionAmie(int, char, NomClasse);
            };
          `, { title: 'fonction amie' })
        )}
        ${H.info('La visibilité courante (<code class="inline">public</code>, <code class="inline">private</code>…) n’a <strong>aucune importance</strong> pour déclarer une classe ou une fonction amie.')}`
    },

    /* ---------------- Attributs et méthodes ---------------- */
    {
      title: 'Attributs et méthodes : définition',
      section: 'Attributs et méthodes',
      html: `
        ${H.cols(
          `<div class="card"><div class="ci">🗃️</div><h4>Attributs</h4><p>propriétés internes qu’aura une instance, déclarées <b>à l’intérieur</b> de la classe.</p></div>`,
          `<div class="card"><div class="ci">⚙️</div><h4>Méthodes</h4><p>comportements qu’aura une instance ; implémentées dans la classe ou à l’extérieur.</p></div>`
        )}
        <p>On écrit l’implémentation des méthodes <strong>dans la classe</strong> pour :</p>
        ${H.list(['les classes <b>template</b> ;', 'les classes à usage <b>local</b> au fichier ;', 'l’<b>inlining</b>.'])}
        ${H.rule('Sinon, on écrit un fichier d’en-tête <code class="inline">NomClasse.hpp</code> (déclarations) et un fichier source <code class="inline">NomClasse.cpp</code> (implémentation).')}`
    },
    {
      title: 'Exemple de classe : un seul fichier',
      section: 'Attributs et méthodes',
      html: `
        ${H.cols(
          H.code(`
            #include <cstdio>
            class Test {
                int i;          // attribut privé
            public:
                void print() {  /* méthode publique */
                    printf("Test\\n");
                }
            };
          `, { title: 'Test.cpp' }),
          `${H.variants([
            { label: 'Instance automatique', code: `
                int main() {
                    Test t;
                    t.print();
                }
              `, note: 'L’instance est dans la pile : on utilise <code class="inline">.</code>' },
            { label: 'Instance dynamique', code: `
                int main() {
                    Test *t = new Test;
                    t->print();
                    delete t;
                }
              `, note: 'On manipule un pointeur : on utilise <code class="inline">-&gt;</code>' }
          ])}
          <p>Compilation :</p>
          ${H.cmd('$ g++ -Wall Test.cpp -o test')}`
        )}`
    },
    {
      title: 'Exemple de classe : deux fichiers',
      section: 'Attributs et méthodes',
      html: `
        ${H.files([
          { name: 'Test.hpp', code: `
              class Test {
                  int i;   // attribut privé
              public:
                  /* méthode publique */
                  void print();
              };
            ` },
          { name: 'Test.cpp', code: `
              #include <cstdio>
              #include "Test.hpp"
              void Test::print() {
                  printf("Test\\n");
              }
            ` },
          { name: 'Exemple.cpp', code: `
              #include "Test.hpp"
              int main() {
                  Test t;
                  t.print();
                  // ou
                  Test *p = new Test;
                  p->print();
                  delete p;
              }
            ` }
        ])}
        <p>La compilation se fait en <strong>deux temps</strong> : compilation séparée, puis édition de liens.</p>
        ${H.cmd(`
          $ g++ -Wall -c Test.cpp -o Test.o
          $ g++ -Wall -c Exemple.cpp -o Exemple.o
          $ g++ Test.o Exemple.o -o Exemple
        `)}`
    },
    {
      title: 'Accès aux attributs',
      section: 'Attributs et méthodes',
      html: `
        <p>L’accès aux membres se fait avec ${H.c('.')} ou ${H.c('->')} selon que l’on dispose d’une <b>instance</b> ou d’un <b>pointeur</b> sur une instance.</p>
        ${H.key('Tout membre de classe a pour nom complet <code class="inline">NomClasse::membre</code>. Lorsqu’il n’y a pas d’ambiguïté, <code class="inline">NomClasse::</code> peut être omis.')}
        ${H.cols(
          H.code(`
              ClasseA x;
              x.i = 1;              // i est un attribut public de ClasseA
              x.ClasseA::i = 1;     // idem
              x.methode();          // appel de méthode
              x.ClasseA::methode(); // idem
            `, { title: 'Cas automatique', small: true }) + '<p>L’instance se trouve dans la <b>pile</b>.</p>',
          H.code(`
              ClasseA *y = new ClasseA();
              y->i = 1;              // i est un attribut public de ClasseA
              y->ClasseA::i = 1;     // idem
              y->methode();          // appel de méthode
              y->ClasseA::methode(); // idem
            `, { title: 'Cas dynamique', small: true }) + '<p>L’instance est allouée dynamiquement dans le <b>tas</b>.</p>'
        )}`
    },

    /* ---------------- this ---------------- */
    {
      title: 'Le mot-clé <code>this</code>',
      section: 'this',
      html: `
        <p>Lors d’un appel de méthode, ${H.c('this')} fait référence à l’<strong>instance sur laquelle la méthode est appelée</strong> (le site d’appel).</p>
        ${H.key('<code class="inline">this</code> est un <strong>pointeur</strong> : son type est <code class="inline">NomClasse * const</code> (on verra plus tard le sens de <code class="inline">const</code>).')}
        ${H.variants([
          { label: 'Avec this', code: `
              class A {
                  int attributPrive;
              public:
                  void setAttribut(int valeur) {
                      this->attributPrive = valeur;
                  }
              };
            `, hl: [5] },
          { label: 'Sans this', code: `
              class A {
                  int attributPrive;
              public:
                  void setAttribut(int valeur) {
                      attributPrive = valeur;
                  }
              };
            `, hl: [5], note: 'Lorsqu’il n’y a pas de variable locale de même nom que l’attribut, on peut <b>omettre</b> <code class="inline">this</code>.' }
        ])}`
    },
    {
      title: 'Opérateur de portée <code>::</code>',
      section: 'this',
      html: `
        <p>L’opérateur de portée ${H.c('::')} permet d’indiquer <strong>précisément</strong> la variable que l’on souhaite manipuler.</p>
        ${H.code(`
          int lunatique;   // variable globale, beurk !
          class A {
              char lunatique;  // attribut privé de la classe
          public:
              void printAllVariable(double lunatique) { // variable locale à la méthode
                  lunatique;             // la variable locale
                  A::lunatique;          // l'attribut d'instance
                  this->A::lunatique;    // l'attribut d'instance
                  this->lunatique;       // l'attribut d'instance
                  ::lunatique;           // la variable globale
              }
          };
        `, { hl: [6, 7, 10] })}
        ${H.tip('Le nom le plus <b>proche</b> (local) masque les autres : <code class="inline">A::</code> ou <code class="inline">this-&gt;</code> désignent l’attribut, <code class="inline">::</code> seul désigne la portée globale.')}`
    },

    /* ---------------- Espaces de noms ---------------- */
    {
      title: 'Les espaces de noms',
      section: 'Espaces de noms',
      html: `
        <p>Un espace de noms regroupe un ensemble d’éléments (classes, variables globales, fonctions…).
        Il sert à <strong>structurer le code</strong> et à <strong>éviter les collisions</strong> de noms.</p>
        ${H.code(`
          namespace Nom {   // début de l'espace de nom
              class A {
                  ...
              };
              int i;
              int fonction();
          }                 // fin de l'espace de nom
        `)}
        ${H.java('Un <code class="inline">namespace</code> joue le rôle d’un <b>package</b>, et <code class="inline">using</code> celui d’un <code class="inline">import</code>. Mais un namespace ne dépend pas des dossiers ni des fichiers.')}`
    },
    {
      title: 'Espaces de noms et fichier <code>.cpp</code>',
      section: 'Espaces de noms',
      html: `
        <p>Pour écrire le code des méthodes dans le <code class="inline">.cpp</code>, on peut soit <b>ré-ouvrir</b> l’espace de noms, soit utiliser l’<b>opérateur de portée</b>.</p>
        ${H.cols(
          H.code(`
            namespace tec {
                class A {
                public:
                    void m();
                };
            }
          `, { title: 'A.hpp', large: true }),
          H.variants([
            { label: 'Ré-ouverture', title: 'A.cpp', code: `
                #include "A.hpp"
                namespace tec {
                    void A::m() {
                        ...
                    }
                }
              ` },
            { label: 'Opérateur de portée', title: 'A.cpp', code: `
                #include "A.hpp"
                void tec::A::m() {
                    ...
                }
              ` }
          ], { large: true })
        )}
        ${H.info('Pas de limite sur le nombre d’espaces de noms ni sur leur imbrication. Mais les espaces de noms font partie du nom (symbole) de la fonction, dont la taille est limitée. D’une certaine manière, une <b>classe</b> peut être vue comme un espace de noms particulier.')}`
    },
    {
      title: 'Espaces de noms : <code>using</code>',
      section: 'Espaces de noms',
      html: `
        <p>Le mot-clé ${H.c('using')} rend accessible tout ou partie d’un espace de noms dans une fonction, un espace de noms ou tout le code.
        Comparez les variantes :</p>
        ${H.variants([
          { label: 'Sans rien', code: `
              namespace spatial {
                  class Navette {};
              }
              namespace missions {
                  Navette n; // Erreur !
              }
              Navette n;     // Erreur !
              void starWars() {
                  Navette n; // Erreur !
              }
            `, mark: { 5: 'err', 7: 'err', 9: 'err' }, note: '<code class="inline">Navette</code> n’est connue qu’à l’intérieur de <code class="inline">spatial</code>.' },
          { label: 'Portée ::', code: `
              namespace spatial {
                  class Navette {};
              }
              namespace missions {
                  spatial::Navette n; // ok
              }
              spatial::Navette n;     // ok
              void starWars() {
                  spatial::Navette n; // ok !
              }
            `, mark: { 5: 'ok', 7: 'ok', 9: 'ok' }, note: 'Utilisation de l’opérateur de portée : le nom complet marche partout.' },
          { label: 'using en tête', code: `
              namespace spatial {
                  class Navette {};
              }
              using spatial::Navette;
              namespace missions {
                  Navette n; // ok
              }
              Navette n;     // ok
              void starWars() {
                  Navette n; // ok !
              }
            `, mark: { 4: 'warn', 6: 'ok', 8: 'ok', 10: 'ok' }, note: 'Placé au niveau global <b>avant</b> les utilisations : tout le code en profite.' },
          { label: 'using au milieu', code: `
              namespace spatial {
                  class Navette {};
              }
              namespace missions {
                  Navette n; // Erreur !
              }
              using spatial::Navette;
              Navette n;     // ok
              void starWars() {
                  Navette n; // ok !
              }
            `, mark: { 5: 'err', 7: 'warn', 8: 'ok', 10: 'ok' }, note: 'Le <code class="inline">using</code> ne vaut qu’<b>à partir de l’endroit</b> où il est écrit.' },
          { label: 'using dans un namespace', code: `
              namespace spatial {
                  class Navette {};
              }
              namespace missions {
                  using spatial::Navette;
                  Navette n; // ok
              }
              Navette n;     // Erreur !
              void starWars() {
                  Navette n; // Erreur !
              }
            `, mark: { 5: 'warn', 6: 'ok', 8: 'err', 10: 'err' }, note: 'Limité à l’espace de noms <code class="inline">missions</code>.' },
          { label: 'using dans une fonction', code: `
              namespace spatial {
                  class Navette {};
              }
              namespace missions {
                  Navette n; // Erreur !
              }
              Navette n;     // Erreur !
              void starWars() {
                  using spatial::Navette;
                  Navette n; // ok
              }
            `, mark: { 5: 'err', 7: 'err', 9: 'warn', 10: 'ok' }, note: 'Limité au corps de la fonction.' },
          { label: 'using namespace', code: `
              namespace spatial {
                  class Navette {};
              }
              namespace missions {
                  Navette n; // Erreur !
              }
              Navette n;     // Erreur !
              void starWars() {
                  using namespace spatial;
                  Navette n; // ok
              }
            `, mark: { 5: 'err', 7: 'err', 9: 'warn', 10: 'ok' }, note: '<code class="inline">using namespace spatial;</code> importe <b>tous</b> les noms de <code class="inline">spatial</code>.' }
        ], { small: true })}`
    },
    {
      title: '<code>using</code> : des synonymes locaux',
      section: 'Espaces de noms',
      html: `
        <p>Le <code class="inline">using</code> crée des <strong>synonymes locaux</strong> entre les espaces de noms :</p>
        ${H.files([
          { name: 'exemple.hpp', code: `
              namespace math {
                  const double pi = 3.14;
              }
              namespace cercle {
                  using math::pi;
                  double surf(double);
              }
            `, hl: [5] },
          { name: 'exemple.cpp', code: `
              #include "exemple.hpp"

              double cercle::surf(double r)
              {
                  return pi * r * r;
              }
            `, hl: [5] }
        ])}
        ${H.list([
          'permet de <b>remplacer facilement</b> une référence externe par une autre ;',
          'permet d’introduire de la <b>modularité</b> sans modification profonde du code.'
        ])}
        ${H.info('<code class="inline">using namespace nom;</code> crée des synonymes pour <b>tous</b> les éléments de <code class="inline">nom</code>.')}`
    },

    /* ---------------- Constructeur ---------------- */
    {
      title: 'Constructeur : définition',
      section: 'Constructeur',
      html: `
        <p class="lead">Un <em class="term">constructeur</em> est une méthode appelée <strong>après la réservation des ressources</strong>
        nécessaires à la création d’une instance ; son rôle est d’<strong>initialiser les attributs</strong> de cette instance.</p>
        ${H.list([
          'En C++, le constructeur est une méthode <b>sans valeur de retour</b> et de <b>même nom que la classe</b>.',
          'On appelle <b>constructeur par défaut</b> le constructeur ne prenant aucun argument.'
        ], { frag: true })}
        ${H.frag(H.warn('Si la classe ne comporte <b>aucun</b> constructeur, le compilateur ajoute un constructeur par défaut. Celui-ci <b>disparaît</b> dès que l’on a écrit au moins un constructeur.'))}`
    },
    {
      title: 'Constructeur : exemples',
      section: 'Constructeur',
      html: `
        ${H.variants([
          { label: 'Un fichier', html: H.code(`
              class Exemple {
                  double pop;
              public:
                  Exemple() {          // Constructeur par défaut
                      pop = 0;
                  }
                  Exemple(double d) {  // Constructeur
                      pop = d;
                  }
              };
            `, { title: 'Exemple.cpp' }) },
          { label: 'Deux fichiers', html: H.files([
              { name: 'Exemple.hpp', code: `
                  class Exemple {
                      double pop;
                  public:
                      Exemple();
                      Exemple(double);
                  };
                ` },
              { name: 'Exemple.cpp', code: `
                  #include "Exemple.hpp"

                  Exemple::Exemple() {
                      pop = 0;
                  }
                  Exemple::Exemple(double d) {
                      pop = d;
                  }
                ` }
            ]) }
        ])}
        ${H.tip('Plusieurs constructeurs peuvent coexister : c’est de la <b>surcharge</b>, le compilateur choisit selon les arguments.')}`
    },
    {
      title: 'Constructeur : liste d’initialisation',
      section: 'Constructeur',
      html: `
        <p>Les attributs peuvent être initialisés <strong>avant le corps</strong> du constructeur, avec la syntaxe <code class="inline">: attribut(valeur)</code> :</p>
        ${H.variants([
          { label: 'Syntaxe', code: `
              class A {
                  int pop;
              public:
                  A(int value) : pop(value) {
                  }
              };
            `, hl: [4] },
          { label: 'Même nom', code: `
              class A {
                  int pop;
              public:
                  A(int pop) : pop(pop) {
                  }
              };
            `, hl: [4], note: 'Il n’y a <b>pas d’ambiguïté</b> : à l’extérieur des parenthèses, c’est l’attribut ; à l’intérieur, c’est le paramètre.' },
          { label: 'Opérations', code: `
              class A {
                  int pop;
              public:
                  A(int pop) : pop(pop * 2) {
                  }
              };
            `, hl: [4], note: 'On peut effectuer des <b>opérations</b>.' },
          { label: 'Fonctions', code: `
              int decremente(int i) {
                  return i - 1;
              }
              class A {
                  int pop;
              public:
                  A(int pop) : pop(decremente(pop) * 2) {
                  }
              };
            `, hl: [7], note: 'On peut appeler des <b>fonctions</b>.' },
          { label: 'Méthodes !', code: `
              class A {
                  int pop;
                  int m() {
                      return 1;
                  }
              public:
                  A(int pop) : pop((m() + pop) * 2) {
                  }
              };
            `, hl: [7], note: 'On peut même appeler des <b>méthodes</b> !' }
        ])}`
    },
    {
      title: 'Valeurs par défaut des attributs (C++11)',
      section: 'Constructeur',
      html: `
        <p>La norme <strong>C++11</strong> autorise une valeur par défaut pour les attributs <b>non statiques</b>, directement à la déclaration :</p>
        ${H.code(`
          class A {
              int v = 10;           // ou v{10};
              std::string s{"hello"};
          public:
              A() {
                  printf("%d %s\\n", v, s.c_str());
                  // affiche : 10 hello
              }
          };
        `, { hl: [2, 3] })}
        ${H.tip('Si un constructeur initialise aussi l’attribut dans sa liste d’initialisation, c’est cette valeur qui l’emporte.')}`
    },
    {
      title: 'Ordre d’initialisation des attributs',
      section: 'Constructeur',
      html: `
        <p>On peut initialiser plusieurs attributs dans la liste. Mais l’ordre des initialisations suit <strong>toujours l’ordre de déclaration</strong> des attributs dans la classe :</p>
        ${H.cols(
          H.code(`
            class A {
                int a;
                double d;
                char c;
            public:
                A();
            };
          `),
          H.variants([
            { label: 'Désordre', code: `
                A::A() : c('a'), a(0) {} // Warning
              `, mark: { 1: 'warn' }, note: 'Écrit <code class="inline">c</code> puis <code class="inline">a</code>, mais exécuté <code class="inline">a</code> puis <code class="inline">c</code> : le compilateur avertit (<code class="inline">-Wall</code>).' },
            { label: 'Dans l’ordre', code: `
                A::A() : a(0), c('a') {} // ok
              `, mark: { 1: 'ok' }, note: 'Même ordre que les déclarations : pas de surprise.' }
          ])
        )}
        ${H.rule('Écrivez la liste d’initialisation <b>dans l’ordre des déclarations</b>, surtout si un attribut dépend d’un autre.')}`
    },
    {
      title: 'Constructeur et instanciation automatique',
      section: 'Constructeur',
      html: `
        <p>Pour l’allocation automatique, il existe deux façons d’indiquer le constructeur à appeler :</p>
        ${H.cols(
          H.code(`
            A x;
            A x(1);
            A x('c');
            A x();  // Erreur :
                    // pas d'instanciation !
          `, { title: 'parenthésée', mark: { 4: 'err' } }),
          H.code(`
            A y;
            A y = 1;
            A y = 'c';
          `, { title: 'affectation' })
        )}
        ${H.key('Le <code class="inline">=</code> au moment de l’instanciation fait nécessairement appel à un <strong>constructeur</strong> (pas à l’opérateur d’affectation).')}
        ${H.reveal('Pourquoi <code>A x();</code> n’instancie rien ?', `
          <p>Le compilateur lit <code class="inline">A x();</code> comme la <b>déclaration d’une fonction</b> <code class="inline">x</code> sans argument qui retourne un <code class="inline">A</code>
          (la fameuse <em>« most vexing parse »</em>). Pour appeler le constructeur par défaut : <code class="inline">A x;</code> ou <code class="inline">A x{};</code></p>`)}`
    },
    {
      title: 'Constructeur et instanciation dynamique',
      section: 'Constructeur',
      html: `
        <p>Pour le cas dynamique, seules les versions <strong>parenthésée</strong> et <strong>avec <code class="inline">{}</code></strong> sont légales (pas de <code class="inline">=</code>) :</p>
        <div class="cols" style="--n:2; grid-template-columns: minmax(0, 3fr) minmax(0, 2fr)">
        <div class="col">${H.code(`
          A *p = new A;     // Construction par défaut
          A *p = new A(3);  // Utilisation du constructeur
                            // prenant un entier
          A *p = new A();   // Construction par défaut
          A *p = new A = 5; // Erreur !
        `, { title: 'parenthésée', mark: { 5: 'err' } })}</div>
        <div class="col">${H.code(`
          A *p = new A{3};  // = new A(3)
          A *p = new A{};   // = new A()
        `, { title: 'avec {}' })}</div>
        </div>
        ${H.info('Contrairement au cas automatique, <code class="inline">new A()</code> est bien une construction par défaut.')}`
    },
    {
      title: 'Et pour les types primitifs ?',
      section: 'Constructeur',
      html: `
        <p>Les deux syntaxes sont aussi valables pour les types primitifs :</p>
        ${H.cols(
          H.code(`
            int i = 0;
            char c = 'a';
            char *p = nullptr;
          `, { title: 'affectation' }),
          H.code(`
            int i(0);
            char c('a');
            char *p(nullptr);
          `, { title: 'parenthésée' })
        )}
        ${H.tip('C’est ce qui permet d’écrire du code générique qui traite de la même façon les types primitifs et les classes.')}`
    },
    {
      title: 'Instanciation anonyme',
      section: 'Constructeur',
      html: `
        <p>On peut instancier une classe de façon <strong>anonyme</strong> : aucun nom de variable n’est associé à l’instance.</p>
        ${H.code(`
          A();   // Instanciation utilisant le
                 // constructeur par défaut
          A(1);  // Avec le constructeur A(int);
          A;     // Erreur ! syntaxe invalide.
        `, { mark: { 4: 'err' } })}
        <p>Ce type d’instanciation sert lors du <strong>passage d’un argument</strong> à une fonction ou lors d’une <strong>levée d’exception</strong> :</p>
        ${H.code(`
          void f(A a) { ... }
          ...
          f(A(1));   // 1. Appel de fonction
          f(1);      // 2. Instanciation implicite
          ...
          throw A(); // 3. Levée d'exception
        `)}
        ${H.info('Dans le cas 2, le constructeur est appelé <b>implicitement</b> : le compilateur cherche <code class="inline">f(int)</code>, ne trouve que <code class="inline">f(A)</code>, et cherche alors un moyen de construire un <code class="inline">A</code> à partir d’un entier.')}`
    },
    {
      title: 'Constructeur et tableaux',
      section: 'Constructeur',
      html: `
        <p>Lors de l’allocation d’un tableau, les instances doivent être créées avec le <strong>constructeur par défaut</strong> :</p>
        ${H.code(`
          A *t = new A[10];  // dynamique
          A tableau2[10];    // automatique
        `)}
        ${H.warn('Une classe <b>sans constructeur par défaut</b> ne peut pas être utilisée avec les tableaux.')}
        <p>Solution : un <strong>tableau de pointeurs</strong>, chaque élément étant instancié séparément avec le bon constructeur.</p>
        ${H.code(`
          class A {
          public:
              A(int);
          };
          ...
          A t[10];    // Erreur !
          A *t[10];   // Tableau de pointeurs
          for (int i = 0; i < 10; i++)
              t[i] = new A(3);  // utilisation du constructeur,
                                // allocation dynamique
          ...
          for (int i = 0; i < 10; i++)
              delete t[i];
        `, { small: true, mark: { 6: 'err', 7: 'ok' } })}`
    },
    {
      title: 'Constructeur et conversion',
      section: 'Constructeur',
      html: `
        <p>Comme nous l’avons vu, l’appel au constructeur peut être <strong>implicite</strong> : <code class="inline">f(1)</code> avec <code class="inline">int f(A p);</code>.</p>
        ${H.key('La conversion implicite se fait sur <strong>au plus un niveau</strong>.')}
        ${H.code(`
          class A {
          public:
              A(int);
          };

          class B {
          public:
              B(A);
          };

          void f(B q);

          f(1);     // Ne marche pas ! (int -> A -> B : deux niveaux)
          f(A(1));  // ok (A -> B : un niveau)
        `, { mark: { 13: 'err', 14: 'ok' } })}
        ${H.info('La notation <code class="inline">A a = 1;</code> fait elle aussi appel au système de conversion.')}`
    },
    {
      title: 'Constructeur <code>explicit</code>',
      section: 'Constructeur',
      html: `
        <p>Un constructeur déclaré ${H.c('explicit')} n’est <strong>jamais utilisé pour une conversion implicite</strong> :</p>
        ${H.code(`
          class A {
          public:
              explicit A(int);
          };
          A::A(int i) {}  // explicit n'est pas reporté ici
          ...
          void f(A p);
          ...
          f(1);     // Erreur : ne trouve pas la fonction f(int)
          A a = 1;  // Erreur !
          A b(1);   // ok
        `, { mark: { 9: 'err', 10: 'err', 11: 'ok' } })}
        ${H.quiz({
          q: 'Avec <code class="inline">explicit A(int);</code>, lequel de ces appels compile ?',
          options: ['<code class="inline">f(1);</code>', '<code class="inline">A a = 1;</code>', '<code class="inline">f(A(1));</code>', 'aucun'],
          answer: 2,
          explain: '<p><code class="inline">f(A(1))</code> appelle <b>explicitement</b> le constructeur : c’est autorisé. Les deux autres demandent une conversion implicite, interdite par <code class="inline">explicit</code>.</p>'
        })}`
    }
  ]
});
