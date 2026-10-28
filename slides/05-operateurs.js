(function () {
  // ex : { opérateur: 'exemple d’utilisation' } — affiché dans une bulle au survol
  const keys = (list, ex) => '<div class="op-keys">' + list.map(k => '<kbd' + (ex && ex[k] ? ' data-ex="' + H.esc(ex[k]).replace(/"/g, '&quot;') + '"' : '') + '>' + H.esc(k) + '</kbd>').join('') + '</div>';
  const opStyle = `<style>
    .op-keys { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
    .op-keys kbd { font-variant-ligatures: none; font-feature-settings: "liga" 0, "calt" 0; font-size: 1em; min-width: 44px; text-align: center; padding: 6px 10px; background: var(--surface); box-shadow: var(--shadow); }
    .op-group { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 14px 16px; box-shadow: var(--shadow); }
    .op-group h4 { margin: 0; font-size: .85em; text-transform: uppercase; letter-spacing: .08em; color: var(--ch); }
    .op-keys kbd[data-ex] { position: relative; cursor: help; }
    .op-keys kbd[data-ex]:hover { border-color: var(--ch); }
    .op-keys kbd[data-ex]:hover::after { content: attr(data-ex); position: absolute; z-index: 20; top: calc(100% + 8px); left: 50%; transform: translateX(-50%);
      white-space: pre; text-align: left; font-family: var(--mono); font-size: .85em; padding: 8px 12px; border-radius: 8px;
      background: var(--code-bg); color: var(--code-fg); border: 1px solid var(--code-border); box-shadow: var(--shadow); pointer-events: none; }
    .op-group:first-child .op-keys kbd[data-ex]:hover::after { left: 0; transform: none; }
    .op-group:last-child .op-keys kbd[data-ex]:hover::after { left: auto; right: 0; transform: none; }
  </style>`;

  Course.chapter({
    id: 'operateurs',
    num: 4,
    title: 'Opérateurs',
    icon: '➕',
    color: '#f59e0b',
    intro: 'Donner à nos objets la syntaxe des types primitifs : a + b, a = b, a < b, cout << a…',
    sections: ['Définition', 'Syntaxe', 'Unaires & binaires', 'iostream', 'Affectation', 'Foncteurs & conversion', '[] et ()', 'Conclusion', 'L’essentiel'],
    slides: [
      {
        title: 'Opérateurs : définition',
        section: 'Définition',
        html: `
          <p class="lead">Un opérateur est une <strong>notation raccourcie</strong> représentant une opération fréquemment utilisée.</p>
          ${H.code(`a + b * c;   // on ajoute à a le résultat de b * c`)}
          ${H.list([
            'Si <code class="inline">a</code> est un <strong>pointeur</strong> sur <code class="inline">T</code>, le sens change : on ajoute à <code class="inline">a</code> <code class="inline">b*c*sizeof(T)</code> octets.',
            'Si <code class="inline">a</code> n’est pas un type primitif, cette notation est <strong>invalide</strong>… sauf si l’on fournit la fonction qui effectue cette opération.'
          ], { frag: true })}
          ${H.java('Pas de surcharge d’opérateurs : on écrit <code class="inline">a.add(b)</code>, <code class="inline">a.equals(b)</code>, <code class="inline">a.compareTo(b) &lt; 0</code>. En C++, on peut donner à ses classes la syntaxe <code class="inline">a + b</code>, <code class="inline">a == b</code>, <code class="inline">a &lt; b</code>.')}`
      },
      {
        title: 'Les opérateurs que l’on peut définir',
        section: 'Définition',
        html: `${opStyle}
          <p>Voici la liste des opérateurs pouvant être (re)définis en C++ <span style="color: var(--text-2)">(survolez un opérateur pour voir un exemple d’utilisation)</span> :</p>
          <div class="cols" style="--n:3">
            <div class="op-group"><h4>Unaires</h4>${keys(['!', '&', '*', '+', '++', '-', '--', '~'], {"!": "if (!f) { ... }   // flux en erreur ?", "&": "Point *p = &q;   // adresse de q", "*": "Point q = *it;   // valeur désignée", "+": "Point q = +p;", "++": "++it;   it++;   // avancer", "-": "Point q = -p;   // opposé", "--": "--it;   it--;   // reculer", "~": "Bits b = ~masque;   // complément"})}</div>
            <div class="op-group"><h4>Binaires</h4>${keys(['=', '%', '%=', '*', '*=', '-', '-=', '+', '+=', '/', '/=', '<', '<=', '>', '>=', '!=', '==', '&&', '||', '&', '&=', '|', '|=', '^', '^=', '<<', '<<=', '>>', '>>=', ',', '->*'], {"=": "p = q;", "%": "Entier r = a % b;", "%=": "a %= b;   // a = a % b", "*": "Matrix c = a * b;", "*=": "m *= 2;", "-": "Point d = p - q;", "-=": "p -= q;", "+": "Point s = p + q;", "+=": "p += q;", "/": "Fraction f = a / b;", "/=": "f /= 2;", "<": "if (p < q) { ... }", "<=": "if (p <= q) { ... }", ">": "if (p > q) { ... }", ">=": "if (p >= q) { ... }", "!=": "if (p != q) { ... }", "==": "if (p == q) { ... }", "&&": "if (a && b) { ... }", "||": "if (a || b) { ... }", "&": "Bits c = a & b;", "&=": "a &= masque;", "|": "Bits c = a | b;", "|=": "a |= masque;", "^": "Bits c = a ^ b;", "^=": "a ^= b;", "<<": "std::cout << p << std::endl;", "<<=": "b <<= 2;   // décalage", ">>": "std::cin >> p;", ">>=": "b >>= 2;   // décalage", ",": "a, b   // rarement redéfini", "->*": "p->*membre   // pointeur de membre (rare)"})}</div>
            <div class="op-group"><h4>Spéciaux</h4>${keys(['new', 'delete', 'new[]', 'delete[]', '[ ]', '( )', '->', 'conversion'], {"new": "A *p = new A;", "delete": "delete p;", "new[]": "A *t = new A[10];", "delete[]": "delete [] t;", "[ ]": "t[3] = 10;", "( )": "greater(1, 0)   // foncteur", "->": "it->getx()   // itérateur", "conversion": "int i = e;   // Entier → int"})}</div>
          </div>`
      },
      {
        title: 'Opérateurs : conditions',
        section: 'Définition',
        html: `
          ${H.list([
            'Au moins une des opérandes doit être d’un <strong>type utilisateur</strong> (pas primitif) : on ne peut pas modifier l’addition sur les entiers.',
            'Les opérateurs <strong>ne sont pas commutatifs</strong> pour le compilateur (jusqu’en C++17) : un opérateur « <code class="inline">A + B</code> » ne résout pas <code class="inline">B() + A()</code>.',
            'La <strong>précédence</strong> des opérateurs ne peut pas être modifiée.'
          ], { frag: true })}
          ${H.frag(H.code(`
            A operator+(const A &, const B &);  // défini : A + B
            A() + B();   // ok
            B() + A();   // Erreur : B + A n'est pas défini !
          `))}`
      },
      {
        title: 'Opérateurs : syntaxe',
        section: 'Syntaxe',
        html: `
          <p>Un opérateur <strong>α</strong> s’écrit comme une fonction ou une méthode non statique de nom <code class="inline">operator α</code>. Son type de retour est <strong>libre</strong>.</p>
          ${H.cols(
            H.code(`
              class A {
              public:
                  int operator+(int i);
              };
            `),
            H.info('Dans une méthode, le <strong>premier opérande</strong> est caché : c’est l’instance (<code class="inline">this</code>). Il doit donc être un <code class="inline">A</code> : aucune conversion implicite n’est appliquée à l’opérande de gauche.<br>Il faut lire cette méthode comme : l’opération <code class="inline">+</code> entre <b>un A non constant</b> et <b>un entier</b>.')
          )}`
      },
      {
        title: 'Fonction ou méthode ?',
        section: 'Syntaxe',
        html: `
          ${H.variants([
            {
              label: 'Comme fonction', code: `
                class Dix { };

                int operator+(const Dix &d, int i) {
                    return i + 10;
                }

                int main() {
                    Dix g;
                    int douze = g + 2;
                    douze = operator+(g, 2);   // appel explicite équivalent
                    operator+(2, g);           // Erreur !
                }
              `, note: '<code class="inline">g + 2</code> est un raccourci pour <code class="inline">operator+(g, 2)</code>. L’ordre des arguments compte.'
            },
            {
              label: 'Comme méthode', code: `
                class Dix {
                public:
                    int operator+(int i) const {
                        return i + 10;
                    }
                };

                int main() {
                    Dix g;
                    int douze = g + 2;
                    douze = g.operator+(2);    // appel explicite équivalent
                    2.operator+(g);            // Erreur !
                }
              `, note: 'Ici <code class="inline">g + 2</code> est un raccourci pour <code class="inline">g.operator+(2)</code>.'
            }
          ])}`
      },
      {
        title: 'Opérateurs : précédence',
        section: 'Syntaxe',
        html: `
          <p>La précédence ne peut pas être modifiée : l’évaluation respecte <strong>obligatoirement</strong> les priorités standards.</p>
          ${H.code(`
            class A {};
            class B {};

            A operator+(const A &, const B &);
            B operator*(const A &, const A &);

            int main() {
                A x;
                B y;
                x + y * x;     // Erreur ! (y * x est évalué d'abord : B * A n'existe pas)
                (x + y) * x;   // ok
            }
          `, { mark: { 10: 'err', 11: 'ok' } })}`
      },
      {
        title: 'Opérateurs unaires',
        section: 'Unaires & binaires',
        html: `
          <p>On écrira les opérateurs <strong>unaires</strong> dans les classes :</p>
          ${H.code(`
            class Point {
                int x, y;
            public:
                Point(int x, int y) : x(x), y(y) {}
                Point operator-() const {
                    return Point(-x, -y);
                }
            };
          `)}
          ${H.tip('On écrira l’opérateur comme <strong>fonction</strong> seulement si l’on n’a pas accès à la classe.')}`
      },
      {
        title: 'Opérateurs binaires',
        section: 'Unaires & binaires',
        html: `
          ${H.cols(
            `<p><strong>Dans la classe</strong> si les deux opérandes sont du même type et que l’on a accès à la classe :</p>
             ${H.code(`
               class Point {
                   int x, y;
               public:
                   Point operator+(const Point &e) const {
                       return Point(x + e.x, y + e.y);
                   }
               };
             `)}`,
            `<p><strong>Hors de la classe</strong> sinon :</p>
             ${H.code(`
               Point operator+(const Point &p, const Entier &e) {
                   return Point(p.getx() + e.v(), p.gety() + e.v());
               }
               Point operator+(const Entier &f, const Point &q) {
                   return q + f;   // operator+(q, f)
               }
             `, { small: true })}`
          )}
          ${H.info('On écrit les deux versions (<code class="inline">Point + Entier</code> et <code class="inline">Entier + Point</code>) car le compilateur ne considère pas l’opérateur comme commutatif. Éventuellement, on déclare l’opérateur <code class="inline">friend</code> s’il a besoin des attributs privés… mais les accesseurs sont préférables.')}`
      },
      {
        title: 'Opérateurs : conception',
        section: 'Unaires & binaires',
        layout: 'center',
        html: `
          ${H.key('Le but d’un opérateur est de <strong>simplifier</strong>, pas de compliquer : l’introduction de ce « raccourci » ne doit apporter <strong>aucune ambiguïté</strong>.')}
          ${H.rule('En cas de doute, préférez toujours des fonctions ou des méthodes classiques.')}
          ${H.frag(H.warn('Un exemple de mauvaise utilisation des opérateurs… la bibliothèque standard ! 😈', 'Contre-exemple'))}`
      },
      {
        title: 'La bibliothèque iostream',
        section: 'iostream',
        html: `
          <p>La bibliothèque standard <code class="inline">iostream</code> fournit un modèle orienté objet des entrées/sorties :</p>
          <div class="cards">
            ${[['ios', 'bases pour les entrées/sorties'], ['istream', 'entrées'], ['ostream', 'sorties'], ['streambuf', 'flux bufferisés'],
               ['iostream', 'entrées et sorties'], ['fstream', 'fichiers'], ['sstream', 'chaînes de caractères']]
              .map(([n, d]) => `<div class="card"><h4><code class="inline">${n}</code></h4><p>${d}</p></div>`).join('')}
          </div>
          ${H.info('Toutes ces classes font partie de l’espace de nom <code class="inline">std</code>. En plus de la gestion des flux, la lecture et l’écriture reposent sur des <strong>opérateurs</strong>.')}`
      },
      {
        title: 'Écrire dans un flux : <code>&lt;&lt;</code>',
        section: 'iostream',
        html: `
          ${H.code(`
            int main() {
                int i;
                std::cout << "un entier : " << i << std::endl;   // 1
                // ...
                f << 1;        // 2
                f << i << 1;   // 3
            }
          `)}
          <p>La ligne 1 doit être lue comme des appels <strong>enchaînés</strong>, chacun portant sur le résultat du précédent :</p>
          ${H.code(`
            operator<<(std::cout, "un entier : ")   // fonction
                .operator<<(i)                       // méthode de ostream
                .operator<<(std::endl);              // méthode de ostream
          `, { small: true })}
          ${H.quiz({
            q: 'Qu’en déduire sur le type de retour de <code class="inline">operator&lt;&lt;</code> ?',
            options: ['void', 'Il est compatible avec le premier argument (le flux)', 'bool (succès de l’écriture)', 'Le type de la valeur écrite'],
            answer: 1,
            explain: '<p>Le résultat de <code class="inline">cout &lt;&lt; "…"</code> sert de <b>premier argument</b> à l’appel suivant : le type de retour doit donc être compatible avec le premier argument, en pratique <code class="inline">std::ostream &amp;</code>.</p>'
          })}`
      },
      {
        title: 'Décalage ou affichage ?',
        section: 'iostream',
        html: `
          ${H.code(`
            std::cout << "un entier : " << i << std::endl;   // 1
            f << 1;        // 2
            f << i << 1;   // 3
          `)}
          ${H.list([
            'Cas 2 : est-on en train de <strong>décaler un entier</strong> ou d’<strong>afficher 1</strong> dans un flux ?',
            'Cas 3 : est-ce <code class="inline">f</code> décalé de <code class="inline">i</code> puis de 1 ? ou <code class="inline">i</code> décalé de 1 puis affiché dans <code class="inline">f</code> ?'
          ], { frag: true })}
          ${H.frag(H.rule('On évite de <strong>« détourner »</strong> un opérateur pour un usage sans rapport avec son sens premier. Implanter le décalage à gauche pour une classe <code class="inline">Entier</code> qui multiplie l’entier par 2<sup>i</sup> a du sens ; l’affichage, beaucoup moins.'))}`
      },
      {
        title: 'Lire depuis un flux : <code>&gt;&gt;</code>',
        section: 'iostream',
        html: `
          ${H.code(`
            int i, j, k;
            char *texte = new char[10];
            std::cin >> i;             // lecture d'un entier
            std::cin >> texte;         // lecture d'une chaîne !! (débordement possible)
            std::cin >> i >> j >> k;   // lecture de 3 entiers
          `, { mark: { 4: 'warn' } })}
          ${H.tip('Pour lire une chaîne, on utilise un type qui gère la réallocation, comme <code class="inline">std::string</code>.')}
          ${H.cols(
            H.reveal('Quel est le type de retour de cet opérateur ?', `<p>Il doit être compatible avec le premier argument :</p>${H.code(`std::istream & operator>>(std::istream &, ... )`)}`),
            H.reveal('Pourquoi les références ne sont-elles pas constantes ?', '<p>Parce que l’opérateur <strong>modifie</strong> ses deux arguments : il consomme des caractères du flux (sa position, son état change) et il écrit la valeur lue dans la variable.</p>')
          )}`
      },
      {
        title: 'Afficher sa propre classe',
        section: 'iostream',
        html: `
          <p>Comment adapter sa classe pour utiliser l’affichage de la bibliothèque standard ?</p>
          ${H.code(`
            #include <iostream>
            class Point { int x, y; };
            int main() {
                Point p;
                std::cerr << "debug" << p;
            }
          `, { title: 'A.cpp', mark: { 5: 'err' } })}
          ${H.reveal('Voir la réaction du compilateur', `${H.cmd(`
            $ g++ -Wall A.cpp
            A.cpp: In function ‘int main()’:
            A.cpp:5:26: error: no match for ‘operator<<’ (operand types are ‘std::basic_ostream<char>’ and ‘Point’)
                5 |     std::cerr << "debug" << p;
                  |     ~~~~~~~~~~~~~~~~~~~~ ^~ ~
          `)}
          <p class="muted">… suivi de 267 autres lignes : 77 notes, dont 32 « candidats » que le compilateur a essayés ! 😱 <small>(g++ 11.4)</small></p>`)}
          ${H.java('On redéfinit <code class="inline">toString()</code> et <code class="inline">System.out.println(p)</code> l’appelle tout seul. En C++, rien n’est prévu : il faut écrire soi-même <code class="inline">operator&lt;&lt;</code> (diapo suivante).')}`
      },
      {
        title: 'Solution : écrire <code>operator&lt;&lt;</code>',
        section: 'iostream',
        html: `
          <p>Il faut écrire l’opérateur <code class="inline">&lt;&lt;</code> entre <code class="inline">std::ostream</code> et <code class="inline">Point</code> :</p>
          ${H.code(`
            class Point {
                int x, y;
            };
            std::ostream & operator<<(std::ostream &stream, Point p) {
                stream << p.x << '/' << p.y;
                return stream;
            }
          `)}
          ${H.reveal('Combien de problèmes dans ce code ?', `
            <p>Au moins <strong>2</strong> :</p>
            ${H.list(['<code class="inline">p</code> devrait être une <b>référence constante</b> (pas de copie inutile) ;', '<code class="inline">p.x</code> et <code class="inline">p.y</code> sont <b>privés</b>, donc inaccessibles.'])}
            <p>Solutions : ajouter des <b>accesseurs</b>, ou déclarer l’opérateur <b>ami</b> de la classe.</p>`)}`
      },
      {
        title: 'Accesseurs ou <code>friend</code> ?',
        section: 'iostream',
        html: `
          ${H.variants([
            {
              label: '✔ Avec accesseurs', code: `
                class Point {
                    int x, y;
                public:
                    int getx() const { return x; }
                    int gety() const { return y; }
                };

                std::ostream & operator<<(std::ostream &stream, const Point &p) {
                    stream << p.getx() << '/' << p.gety();
                    return stream;
                }
              `, note: 'L’opérateur ne dépend que de l’interface publique de <code class="inline">Point</code>.'
            },
            {
              label: 'Avec friend', code: `
                class Point {
                    int x, y;
                public:
                    friend std::ostream & operator<<(std::ostream &stream,
                                                     const Point &p);
                };

                std::ostream & operator<<(std::ostream &stream, const Point &p) {
                    stream << p.x << '/' << p.y;
                    return stream;
                }
              `, note: 'Si l’implémentation change (un attribut privé est renommé), il faut aussi changer le code de l’opérateur 🙁'
            }
          ])}
          ${H.rule('Les fonctions amies ne doivent <strong>pas</strong> être utilisées à la place des accesseurs !')}`
      },
      {
        title: 'Exemple classique : Point',
        section: 'iostream',
        html: `
          ${H.cols(H.code(`
            class Point {
                int x, y;
            public:
                Point(int x = 0, int y = 0) : x(x), y(y) {}

                bool operator==(const Point &p) const {
                    return (x == p.x) && (y == p.y);
                }
                bool operator<(const Point &p) const {   // ordre lexicographique
                    if (x < p.x) return true;
                    if (x == p.x) return y < p.y;
                    return false;
                }
                // ... <= > >= != ...

                Point operator+(const Point &p) const {
                    return Point(x + p.x, y + p.y);
                }
                Point & operator+=(const Point &p) {
                    x += p.x; y += p.y;
                    return *this;
                }
                // ... - -= * *= ...
            };
          `, { small: true, hl: [16, 19, 21] }),
          H.java('<code class="inline">operator==</code> ≈ <code class="inline">equals()</code>, <code class="inline">operator&lt;</code> ≈ <code class="inline">compareTo()</code>. Notez : <code class="inline">+</code> renvoie un <b>nouveau</b> Point, <code class="inline">+=</code> modifie l’instance et renvoie <code class="inline">*this</code>.'))}`
      },
      {
        title: 'L’opérateur d’affectation',
        section: 'Affectation',
        html: `
          <p>L’opérateur d’affectation correspond au <code class="inline">=</code> et doit <strong>nécessairement</strong> être écrit comme <strong>membre</strong> de la classe :</p>
          ${H.code(`
            class Point {
                int x, y;
            public:
                Point & operator=(int i) {
                    x = i; y = 0;
                    return *this;
                }
            };
            // ...
            Point p;
            p = 1;          // appel à operator=(int)
            Point f = 1;    // Erreur : c'est un appel au constructeur !
          `, { mark: { 12: 'ok', 13: 'err' } })}
          ${H.warn('Un <code class="inline">=</code> dans une <strong>déclaration</strong> n’est pas une affectation : c’est une construction.')}
          ${H.java('<code class="inline">p = q;</code> copie une <strong>référence</strong> : <code class="inline">p</code> et <code class="inline">q</code> désignent ensuite le même objet. En C++, <code class="inline">p = q;</code> appelle <code class="inline">operator=</code> et <strong>copie l’objet</strong> : on obtient deux objets distincts.')}`
      },
      {
        title: 'Affectation fournie par le compilateur',
        section: 'Affectation',
        html: `
          <p>Le compilateur fournit <strong>toujours</strong> un opérateur d’affectation permettant de copier une instance dans une instance de même type (si possible) :</p>
          ${H.code(`
            struct S a, b;
            a = b;
          `)}
          ${H.cols(
            H.code(`
              X & X::operator=(const X &);   // 1
              X & X::operator=(X &);         // 2
            `, { title: 'formes possibles' }),
            H.list([
              'La copie est faite <strong>attribut par attribut</strong>, dans l’ordre de leur déclaration.',
              'La forme 1 est utilisée si chaque attribut possède un opérateur d’affectation en forme 1.',
              'Si l’on déclare soi-même un opérateur en forme 1 ou 2, le compilateur n’en ajoute plus.'
            ])
          )}`
      },
      {
        title: 'À quoi ressemble l’affectation générée ?',
        section: 'Affectation',
        html: `
          ${H.code(`
            class X {
                A a;
                B b;
                C c;
                // ...
            public:
                X & operator=(const X &y) {
                    a = y.a;
                    b = y.b;
                    c = y.c;
                    // ...
                    return *this;
                }
            };
          `)}
          ${H.warn('Pour un attribut pointeur, <code class="inline">data = y.data</code> copie <strong>l’adresse</strong>, pas les données pointées : c’est une copie superficielle.')}`
      },
      {
        title: 'Matrix : la version complète',
        section: 'Affectation',
        html: `
          ${H.files([
            {
              name: 'Matrix.hpp', code: `
                class Matrix {
                    int l, c;
                    double *data;
                public:
                    Matrix(int l, int c);
                    Matrix(const Matrix &x);
                    Matrix & operator=(const Matrix &m);
                    ~Matrix();
                };
              `, hl: [6, 7, 8]
            },
            {
              name: 'Matrix.cpp', code: `
                #include "Matrix.hpp"

                Matrix::Matrix(int l, int c) : l(l), c(c) {
                    data = new double[l * c];
                }
                Matrix::Matrix(const Matrix &x) : l(x.l), c(x.c) {
                    data = new double[l * c];
                    for (int i = 0; i < l * c; ++i)
                        data[i] = x.data[i];
                }
                Matrix & Matrix::operator=(const Matrix &m) {
                    if (this == &m) return *this;  // auto-affectation
                    delete [] data;                // libération
                    c = m.c; l = m.l;              // ré-initialisation
                    data = new double[c * l];
                    for (int i = 0; i < l * c; ++i)
                        data[i] = m.data[i];
                    return *this;
                }
                Matrix::~Matrix() {
                    delete [] data;
                }
              `, hl: [12]
            }
          ], { tiny: true })}`
      },
      {
        title: 'La règle des trois',
        section: 'Affectation',
        layout: 'center',
        html: `
          ${H.rule(`Dès qu’une classe effectue de l’allocation dynamique, on écrit <strong>systématiquement</strong> les trois (<em>règle des trois</em>) — chacun corrige un bug vu avec <code class="inline">Matrix</code> au chapitre Classes :
            ${H.list([
              '<b>destructeur</b> → sinon <strong>fuite mémoire</strong> à la sortie du bloc ;',
              '<b>constructeur par recopie</b> → sinon <code class="inline">Matrix n(m);</code> partage le tableau : <strong>double free</strong> ;',
              '<b>opérateur d’affectation</b> → sinon <code class="inline">m = n;</code> : <strong>double free + fuite</strong>.'
            ])}`, 'Règle des trois')}
          ${H.key('Si l’on doit écrire l’un des trois, on doit écrire les trois.')}
          <p style="font-size: .8em; font-style: italic; color: var(--text-2)">Depuis C++11, on parle de <b>règle des cinq</b> : s’y ajoutent le constructeur et l’opérateur d’affectation <b>par déplacement</b>.</p>`
      },
      {
        title: 'Pourquoi tester <code>this == &amp;m</code> ?',
        section: 'Affectation',
        html: `
          ${H.code(`
            Matrix m(3, 3);
            m = m;   // auto-affectation
          `)}
          ${H.quiz({
            q: 'Sans le test <code class="inline">if (this == &amp;m)</code>, que se passerait-il lors de <code class="inline">m = m;</code> ?',
            options: ['Rien de particulier', 'On libère data, puis on recopie depuis… la zone qu’on vient de libérer', 'Erreur de compilation', 'Récursion infinie'],
            answer: 1,
            explain: '<p><code class="inline">delete [] data</code> libère aussi <code class="inline">m.data</code> (c’est le même objet !). La boucle de copie lirait ensuite de la mémoire libérée : comportement indéfini.</p>'
          })}`
      },
      {
        title: 'Les foncteurs : <code>operator()</code>',
        section: 'Foncteurs & conversion',
        html: `
          <p><code class="inline">operator()</code> est le seul opérateur d’instance qui accepte un <strong>nombre variable d’arguments</strong>. Pour les autres, ce nombre est fixé par l’arité. (<code class="inline">new</code> et <code class="inline">delete</code> en acceptent aussi, mais surchargés dans une classe ce sont des <b>méthodes de classe</b>, implicitement <code class="inline">static</code>.)</p>
          <p>Une classe qui l’implémente est un <em class="term">foncteur</em> : on peut utiliser ses instances <strong>comme des fonctions</strong>.</p>
          ${H.cols(
            H.code(`
              class Greater {
              public:
                  bool operator()(int a, int b) const { return a > b; }
                  bool operator()(double a, double b) const {
                      return a > b;
                  }
                  bool operator()(const char *a, const char *b) const {
                      return strcmp(a, b) > 0;
                  }
              };
            `, { small: true }),
            H.code(`
              Greater greater;
              if (greater(1, 0)) { ... }
              if (greater("aba", "abb")) { ... }
            `, { small: true, title: 'utilisation' })
          )}
          ${H.info('On aurait pu écrire plusieurs fonctions <code class="inline">greater</code> surchargées. Un usage plus utile : une fonction de hachage <b>paramétrable</b> (par ses attributs). C’est un concept très utilisé avec les templates.')}`
      },
      {
        title: 'Opérateur de conversion',
        section: 'Foncteurs & conversion',
        html: `
          <p>On peut écrire des opérateurs qui convertissent une instance vers un autre type :</p>
          ${H.cols(
            H.code(`
              class Entier {
                  int _value;
              public:
                  operator int() const {
                      return _value;
                  }
              };
            `),
            `${H.list([
              'Prototype : <code class="inline">operator type() const</code>',
              '<strong>Pas de type de retour</strong> écrit (c’est <code class="inline">type</code>) et <strong>aucun argument</strong>.',
              'S’écrit obligatoirement comme <strong>fonction membre</strong>.'
            ])}`
          )}
          <p>Il peut être appelé explicitement (cast) ou implicitement :</p>
          ${H.code(`
            void f(int);
            // ...
            Entier e;
            int i = e;   // conversion implicite
            (int) e;     // conversion explicite
            f(e);        // conversion implicite
          `)}
          ${H.info('Les opérateurs de conversion sont pris en compte par l’algorithme de résolution des appels.')}
          <p style="font-size: .8em; font-style: italic; color: var(--text-2)">L’opérateur peut être qualifié <code class="inline">explicit</code> (C++11) : la conversion n’est alors possible qu’explicitement, comme pour un constructeur <code class="inline">explicit</code>.</p>`
      },
      {
        title: 'Conversion vers <code>std::string</code>',
        section: 'Foncteurs & conversion',
        html: `
          ${H.code(`
            #include <string>
            #include <sstream>
            class Entier {
                int _value;
            public:
                operator int() const { return _value; }
                operator std::string() const {
                    std::stringstream s;
                    s << _value;
                    return s.str();
                }
            };
            // ...
            Entier e;
            cout << (std::string) e;
          `, { hl: [7] })}
          ${H.tip('Cette approche est plus logique que l’implémentation de <code class="inline">&lt;&lt;</code> et offre plus de possibilités : la chaîne obtenue peut servir partout, pas seulement dans un flux.')}`
      },
      {
        title: 'L’opérateur <code>[]</code>',
        section: '[] et ()',
        html: `
          <p>Très utilisé, il prend <strong>un seul argument</strong> et s’écrit obligatoirement comme fonction membre.</p>
          ${H.code(`
            class Tab {
                int *data;
                int size;
            public:
                int operator[](int i) const {   // lecture (instance constante)
                    return data[i];
                }
                int & operator[](int i) {       // lecture ET écriture
                    return data[i];
                }
            };
          `)}
          ${H.warn('La version non-const renvoie une <strong>référence</strong> : ce n’est pas équivalent à un <em>setter</em>, car on n’a <strong>aucun contrôle</strong> sur la valeur écrite.')}`
      },
      {
        title: '<code>[]</code> et les tableaux 2D',
        section: '[] et ()',
        html: `
          <p>L’opérateur <code class="inline">[]</code> ne peut prendre qu’<strong>un seul paramètre</strong> :</p>
          ${H.code(`
            Matrix m(5, 5);
            m[2][3] = 10;
            m.operator[](2)[3] = 10;   // ce qu'il faut comprendre
          `)}
          ${H.code(`
            class Matrix {
                int l, c;
                double *data;   // l*c cases, ligne par ligne
                // ...
            public:
                double * operator[](int i) { return data + i * c; }
                const double * operator[](int i) const { return data + i * c; }
            };
          `)}
          ${H.warn('Le deuxième <code class="inline">[]</code> est l’opérateur classique des <strong>pointeurs</strong> : aucun contrôle de dépassement !')}`
      },
      {
        title: '<code>()</code> plutôt que <code>[]</code>',
        section: '[] et ()',
        html: `
          <p>Il peut être préférable d’utiliser <code class="inline">operator()</code>, qui accepte plusieurs arguments :</p>
          ${H.code(`
            class Matrix {
                int l, c;
                double *data;
                // ...
            public:
                double operator()(int i, int j) const {       // lecture
                    return data[i * c + j];
                }
                void operator()(int i, int j, double v) {     // écriture
                    data[i * c + j] = v;
                }
            };

            m(2, 3, 10);        // écrit 10 en (2,3)
            int x = m(2, 3);    // lit (2,3)
          `)}
          ${H.tip('On contrôle maintenant les deux indices (et la valeur écrite) : on peut vérifier les bornes.')}`
      },
      {
        title: 'Opérateurs : conclusion',
        section: 'Conclusion',
        html: `
          <ol class="bullets">
            <li class="frag">Les opérateurs sont des <strong>raccourcis syntaxiques</strong> pour appeler des méthodes ou des fonctions.</li>
            <li class="frag">L’opérateur d’affectation <code class="inline">=</code> a un rôle très particulier : il est <strong>fourni par le compilateur</strong> si l’on n’en écrit pas.</li>
            <li class="frag">Il est <strong>impératif</strong> d’implémenter l’affectation si une classe gère des ressources via ses attributs (allocation dynamique).</li>
            <li class="frag">Les opérateurs donnent aux instances des comportements similaires aux types primitifs : leur usage prend tout son sens avec la <strong>programmation générique</strong>.</li>
          </ol>`
      },
      {
        title: 'L’essentiel',
        section: 'L’essentiel',
        layout: 'center',
        html: `
            <ol class="bullets">
              <li><code class="inline">a + b</code> n’est qu’un appel : <code class="inline">a.operator+(b)</code> ou <code class="inline">operator+(a, b)</code>.</li>
              <li><code class="inline">operator=</code> est <strong>généré</strong> par le compilateur : copie <strong>attribut par attribut</strong> (superficielle pour un pointeur).</li>
              <li>Allocation dynamique ⇒ <strong>règle des trois</strong> : recopie + destructeur + affectation.</li>
              <li><code class="inline">operator&lt;&lt;</code> renvoie <code class="inline">std::ostream &amp;</code> pour pouvoir chaîner ; préférez les accesseurs à <code class="inline">friend</code>.</li>
            </ol>`
      },
      {
        title: 'Vérifiez-vous',
        section: 'L’essentiel',
        html: `
            ${H.quiz({
              q: '<code class="inline">Point p; Point q = p;</code> — qu’est-ce qui est appelé pour <code class="inline">q</code> ?',
              options: ['operator=', 'Le constructeur par recopie', 'Les deux', 'Rien, q est une référence'],
              answer: 1,
              explain: '<p>Un <code class="inline">=</code> dans une déclaration est une <b>construction</b> : c’est le constructeur par recopie. <code class="inline">operator=</code> ne s’applique qu’à un objet qui existe déjà.</p>'
            })}
            ${H.quiz({
              q: 'Une classe alloue <code class="inline">data</code> dans son constructeur et n’a qu’un destructeur. Que provoque <code class="inline">a = b;</code> ?',
              options: ['Rien de grave', 'Une erreur de compilation', 'Une fuite (l’ancien data de a) et un double free', 'Une copie profonde'],
              answer: 2,
              explain: '<p>L’affectation générée copie le <b>pointeur</b> : l’ancien tableau de <code class="inline">a</code> n’est plus accessible (fuite) et les deux destructeurs libèrent le même tableau (double free).</p>'
            })}`
      }
    ]
  });
})();
