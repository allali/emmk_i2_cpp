(function () {
  /* ---------- Diagrammes Compteur ---------- */
  const pile = { id: 'pile', x: 10, y: 10, w: 200, h: 300, label: 'pile', kind: 'zone' };
  const tas = { id: 'tas', x: 260, y: 10, w: 330, h: 300, label: 'tas', kind: 'zone' };

  /* Exemple 1 : partage d'un compteur entre instances */
  function ex1(o) {
    const boxes = [], arrows = [];
    const v = (id, y, kind, label) => boxes.push({ id, x: 90, y, w: 100, h: 40, label: label || 'Cmp', kind, tag: id });
    if (o.c) v('c', 45, o.c);
    if (o.d) v('d', 115, o.d);
    if (o.e) v('e', 185, o.e);
    if (o.t) v('t', 255, o.t, 'Cmp *');
    if (o.ic) boxes.push({ id: 'ic', x: 450, y: 45, w: 110, h: 36, label: 'int: ' + o.ic[0], kind: o.ic[1] || 'int' });
    if (o.id) boxes.push({ id: 'id', x: 450, y: 125, w: 110, h: 36, label: 'int: ' + o.id[0], kind: o.id[1] || 'int' });
    if (o.h) boxes.push({ id: 'h', x: 300, y: 240, w: 100, h: 40, label: 'Cmp', kind: o.h });
    if (o.c && o.ic) arrows.push({ from: 'c', to: 'ic' });
    if (o.d && o.id) arrows.push({ from: 'd', to: 'id' });
    if (o.e && o.id) arrows.push({ from: 'e', to: 'id' });
    if (o.t && o.h && o.t !== 'dead') arrows.push({ from: 't', to: 'h' });
    if (o.h && o.ic) arrows.push({ from: 'h', to: 'ic', bend: 40 });
    return { boxes, arrows, line: o.line, note: o.note };
  }

  const compteur1 = H.diagram({
    w: 600, h: 320,
    code: `
      Cmp c;
      Cmp d;
      Cmp e=d;
      Cmp *t;
      t=new Cmp(c);
      ...
      }
    `,
    codeTitle: 'exemple1.cpp',
    common: { boxes: [pile, tas] },
    steps: [
      ex1({ line: 1, c: 'obj', ic: [1], note: '<code class="inline">Cmp c;</code> : le constructeur par défaut alloue un compteur dans le tas, initialisé à 1.' }),
      ex1({ line: 2, c: 'obj', ic: [1], d: 'obj', id: [1], note: '<code class="inline">Cmp d;</code> : une autre instance, un autre compteur.' }),
      ex1({ line: 3, c: 'obj', ic: [1], d: 'obj', id: [2], e: 'obj', note: '<code class="inline">Cmp e=d;</code> : construction <b>par recopie</b> : <code class="inline">e</code> partage le compteur de <code class="inline">d</code>, qui passe à 2.' }),
      ex1({ line: 4, c: 'obj', ic: [1], d: 'obj', id: [2], e: 'obj', t: 'obj', note: '<code class="inline">Cmp *t;</code> : un simple pointeur, aucune instance créée.' }),
      ex1({ line: 5, c: 'obj', ic: [2], d: 'obj', id: [2], e: 'obj', t: 'obj', h: 'heap', note: '<code class="inline">new Cmp(c)</code> : une instance dans le tas, construite par recopie de <code class="inline">c</code> : le compteur de <code class="inline">c</code> passe à 2.' }),
      ex1({ line: 6, c: 'obj', ic: [2], d: 'obj', id: [2], e: 'obj', t: 'obj', h: 'heap', note: '… on utilise nos instances.' }),
      ex1({ line: 7, c: 'obj', ic: [2], d: 'obj', id: [1], e: 'dead', t: 'obj', h: 'heap', note: 'Sortie du bloc : destruction dans l’ordre inverse. <code class="inline">e</code> est détruit, le compteur partagé passe à 1.' }),
      ex1({ line: 7, c: 'obj', ic: [2], d: 'dead', id: [0, 'dead'], e: 'dead', t: 'obj', h: 'heap', note: '<code class="inline">d</code> est détruit : c’était le <b>dernier</b>, le compteur tombe à 0 et il est libéré.' }),
      ex1({ line: 7, c: 'dead', ic: [1], d: 'dead', id: [0, 'dead'], e: 'dead', t: 'obj', h: 'heap', note: '<code class="inline">c</code> est détruit : son compteur passe à 1 (l’instance du tas le partage encore).' }),
      ex1({ line: 7, c: 'dead', ic: [1, 'err'], d: 'dead', id: [0, 'dead'], e: 'dead', t: 'dead', h: 'leak', note: '<b class="hl-err">Fuite mémoire</b> : le pointeur <code class="inline">t</code> est dépilé, mais personne n’a fait <code class="inline">delete t</code>. L’instance du tas et son compteur ne seront jamais libérés.' })
    ]
  });

  /* Exemple 2 : valeur de retour */
  function ex2(o) {
    const boxes = [], arrows = [];
    if (o.c) boxes.push({ id: 'c', x: 90, y: 60, w: 100, h: 40, label: o.c === 'empty' ? '' : 'Cmpt', kind: o.c === 'empty' ? 'empty' : o.c, tag: 'c' });
    if (o.l) boxes.push({ id: 'l', x: 90, y: 150, w: 100, h: 40, label: 'Cmpt', kind: o.l, tag: 'l' });
    if (o.i) boxes.push({ id: 'i', x: 400, y: 105, w: 110, h: 36, label: 'int: ' + o.i[0], kind: o.i[1] || 'int' });
    if (o.i && o.i[1] !== 'dead') {
      if (o.c && o.c !== 'empty' && o.c !== 'dead') arrows.push({ from: 'c', to: 'i' });
      if (o.l && o.l !== 'dead') arrows.push({ from: 'l', to: 'i' });
    }
    return { boxes, arrows, line: o.line, note: o.note };
  }

  const compteur2 = H.diagram({
    w: 600, h: 260,
    code: `
      Cmpt f(){
          Cmpt l;
          return l;
      }

      Cmpt c=f();
    `,
    codeTitle: 'exemple2.cpp',
    common: { boxes: [{ id: 'pile', x: 10, y: 20, w: 200, h: 220, label: 'pile', kind: 'zone' }, { id: 'tas', x: 260, y: 20, w: 330, h: 220, label: 'tas', kind: 'zone' }] },
    steps: [
      ex2({ line: 6, c: 'empty', note: 'La place de <code class="inline">c</code> est réservée dans la pile, mais <code class="inline">c</code> n’est pas encore construit : on appelle d’abord <code class="inline">f()</code>.' }),
      ex2({ line: 2, c: 'empty', l: 'obj', i: [1], note: '<code class="inline">Cmpt l;</code> : variable locale de <code class="inline">f</code>, avec son compteur à 1.' }),
      ex2({ line: 3, c: 'empty', l: 'obj', i: [1], note: '<code class="inline">return l;</code> : la valeur de retour doit être construite à partir de <code class="inline">l</code>.' }),
      ex2({ line: 6, c: 'obj', l: 'obj', i: [2], note: '<code class="inline">c</code> est construit <b>par recopie</b> de <code class="inline">l</code> : ils partagent le compteur, qui vaut 2.' }),
      ex2({ line: 4, c: 'obj', l: 'dead', i: [1], note: 'Fin de <code class="inline">f</code> : <code class="inline">l</code> est détruit, le compteur redescend à 1. <code class="inline">c</code> est bien le dernier.' }),
      ex2({ line: 6, c: 'dead', l: 'dead', i: [0, 'dead'], note: 'Fin du programme : <code class="inline">c</code> est détruit, le compteur tombe à 0 et il est libéré. <b class="hl-ok">Aucune fuite.</b>' })
    ]
  });

  /* Problème : l'affectation */
  function pb(o) {
    const boxes = [], arrows = [];
    if (o.c) boxes.push({ id: 'c', x: 90, y: 50, w: 100, h: 40, label: 'Cmpt', kind: o.c, tag: 'c' });
    if (o.d) boxes.push({ id: 'd', x: 90, y: 130, w: 100, h: 40, label: 'Cmpt', kind: o.d, tag: 'd' });
    if (o.a) boxes.push({ id: 'a', x: 420, y: 70, w: 110, h: 36, label: 'int: ' + o.a[0], kind: o.a[1] || 'int' });
    if (o.b) boxes.push({ id: 'b', x: 420, y: 200, w: 110, h: 36, label: 'int: ' + o.b[0], kind: o.b[1] || 'int' });
    (o.arrows || []).forEach(a => arrows.push(a));
    return { boxes, arrows, line: o.line, note: o.note };
  }

  const probleme = H.diagram({
    w: 600, h: 270,
    code: `
      int main(){
          Cmpt c;
          Cmpt d;

          d=c; // Recopie de c dans d
      }
    `,
    codeTitle: 'probleme.cpp',
    common: { boxes: [{ id: 'pile', x: 10, y: 20, w: 200, h: 230, label: 'pile', kind: 'zone' }, { id: 'tas', x: 260, y: 20, w: 330, h: 230, label: 'tas', kind: 'zone' }] },
    steps: [
      pb({ line: 2, c: 'obj', a: [1], arrows: [{ from: 'c', to: 'a' }], note: '<code class="inline">Cmpt c;</code> : un compteur à 1.' }),
      pb({ line: 3, c: 'obj', a: [1], d: 'obj', b: [1], arrows: [{ from: 'c', to: 'a' }, { from: 'd', to: 'b' }], note: '<code class="inline">Cmpt d;</code> : un second compteur à 1.' }),
      pb({ line: 5, c: 'obj', a: [1], d: 'obj', b: [1], arrows: [{ from: 'c', to: 'a' }, { from: 'd', to: 'a' }], note: '<code class="inline">d=c;</code> : l’affectation fournie par le compilateur copie <b>champ par champ</b> : <code class="inline">d</code> pointe sur le compteur de <code class="inline">c</code>… qui n’est <b>pas</b> incrémenté. L’ancien compteur de <code class="inline">d</code> est orphelin.' }),
      pb({ line: 6, c: 'obj', a: [0, 'dead'], d: 'dead', b: [1], arrows: [{ from: 'c', to: 'a' }], note: '<code class="inline">d</code> est détruit : le compteur partagé tombe à 0 et il est libéré… alors que <code class="inline">c</code> l’utilise encore !' }),
      pb({ line: 6, c: 'obj', a: [0, 'dead'], d: 'dead', b: [1, 'leak'], arrows: [{ from: 'c', to: 'a', kind: 'bad' }], note: '<b class="hl-err">Double erreur</b> : <code class="inline">c</code> décrémente et libère un compteur déjà libéré (double free), et l’ancien compteur de <code class="inline">d</code> fuit.' })
    ]
  });

  /* ---------- Sorties AddressSanitizer réelles (g++ 13, -g -fsanitize=address), raccourcies ---------- */
  const asanLeak = H.asan(`
    $ g++ -g -fsanitize=address Matrix.cpp main.cpp && ./a.out
    ==ERROR: LeakSanitizer: detected memory leaks
    Direct leak of 72 byte(s) in 1 object(s) allocated from:
        #0 in operator new[](unsigned long)
        #1 in Matrix::Matrix(int, int) Matrix.cpp:4
        #2 in main main.cpp:3
    SUMMARY: AddressSanitizer: 72 byte(s) leaked in 1 allocation(s).
  `);
  const asanDouble = H.asan(`
    $ g++ -g -fsanitize=address Matrix.cpp main.cpp && ./a.out
    ==ERROR: AddressSanitizer: attempting double-free on 0x507000000090
        #1 in Matrix::~Matrix() Matrix.cpp:7
        #2 in main main.cpp:5
    freed by thread T0 here:
        #1 in Matrix::~Matrix() Matrix.cpp:7
    previously allocated by thread T0 here:
        #1 in Matrix::Matrix(int, int) Matrix.cpp:4
        #2 in main main.cpp:3
    SUMMARY: AddressSanitizer: double-free ... in operator delete[](void*)
  `);
  const asanAffect = H.asan(`
    $ g++ -g -fsanitize=address Matrix.cpp main.cpp && ./a.out
    ==ERROR: AddressSanitizer: attempting double-free on 0x507000000100
        #1 in Matrix::~Matrix() Matrix.cpp:12
        #2 in main main.cpp:6
    previously allocated by thread T0 here:
        #1 in Matrix::Matrix(Matrix const&) Matrix.cpp:7
        #2 in main main.cpp:4
    SUMMARY: AddressSanitizer: double-free ... in operator delete[](void*)
  `);
  const asanTabs = (files, out, note) => H.variants([
    { label: 'Code', html: files },
    { label: '🩺 Ce que dit AddressSanitizer', html: out + (note ? '<div class="var-note">' + note + '</div>' : '') }
  ]);

  /* ---------- Point ---------- */
  const pointMain1 = `
    #include "Point.hpp"
    int main(){
        Point p(2,3);
        Point q;
        Point *t=new Point[20];
        delete [] t;
    }
  `;

  /* ---------- Matrix ---------- */
  const mHpp = (dtor, copy, hl) => ({
    name: 'Matrix.hpp', hl,
    code: `
      class Matrix {
          int l, c;
          double *data;
      public:
          Matrix(int l, int c);` + (copy ? `
          Matrix(const Matrix &x);` : '') + (dtor ? `
          ~Matrix();` : '') + `
      };
    `
  });
  const mCpp = (dtor, copy, hl) => ({
    name: 'Matrix.cpp', hl,
    code: `
      #include "Matrix.hpp"

      Matrix::Matrix(int l, int c):l(l),c(c){
          data = new double[l*c];
      }` + (copy ? `
      Matrix::Matrix(const Matrix &x):l(x.l),c(x.c){
          data = new double[l*c];
          for (int i=0;i<l*c;++i)
              data[i]=x.data[i];
      }` : '') + (dtor ? `
      Matrix::~Matrix(){
          delete [] data;
      }` : '') + `
    `
  });

  Course.chapter({
    id: 'classes',
    sections: ['Exemple : Compteur', 'Exemple : Point', 'Exemple : Matrix', 'L’essentiel'],
    slides: [
      {
        title: 'Une classe <code>Compteur</code>',
        section: 'Exemple : Compteur',
        html: `
          <p class="lead">Objectif : écrire une classe <code class="inline">Compteur</code> telle que <strong>plusieurs instances</strong>
          puissent <strong>partager un même compteur</strong>, implanté ici par un entier.</p>
          ${H.cols(
            `<div class="cards">
               <div class="card"><div class="ci">🔗</div><h4>Partage</h4><p>Les copies d’une instance partagent le même compteur.</p></div>
               <div class="card"><div class="ci">🔢</div><h4>Comptage</h4><p>Le compteur indique combien d’instances le partagent.</p></div>
             </div>`,
            H.key('Le compteur doit donc être <strong>alloué dynamiquement</strong> : il doit pouvoir être transmis entre des instances et survivre à celle qui l’a créé.')
          )}
          ${H.java('<code class="inline">d = c;</code> copie la <strong>référence</strong> : <code class="inline">c</code> et <code class="inline">d</code> désignent le même objet, et le ramasse-miettes le libère quand plus personne ne l’utilise. En C++, <code class="inline">d = c;</code> copie l’<strong>objet</strong> champ par champ, et la libération est à notre charge : c’est pour cela qu’on a besoin de compter les instances qui partagent une ressource.')}`
      },
      {
        title: 'Compteur : exemple 1',
        section: 'Exemple : Compteur',
        html: `
          <p>Suivez les instances de <code class="inline">Cmp</code> et leur compteur partagé (<kbd>→</kbd> pour avancer).</p>
          ${compteur1}`
      },
      {
        title: 'Compteur : exemple 2',
        section: 'Exemple : Compteur',
        html: `
          <p>Le constructeur par recopie intervient aussi pour la <strong>valeur de retour</strong> d’une fonction.</p>
          ${compteur2}
          ${H.info('g++ supprime ces copies, même sans optimisation (<em>RVO</em>) : en testant, vous ne verrez aucun appel au constructeur par recopie. Le schéma est une <b>représentation adaptée au cours</b>, non conforme à la norme : depuis C++17, celle-ci impose de supprimer la copie dans <code class="inline">Cmpt c = f();</code>.', 'En pratique')}`
      },
      {
        title: 'La classe <code>Compteur</code>',
        section: 'Exemple : Compteur',
        html: `
          ${H.cols(
            `<h3>Méthodes</h3>
             ${H.table(['Méthode', 'Visibilité'], [
               ['void incremente()', '<span class="no">private</span>'],
               ['void decremente()', '<span class="no">private</span>'],
               ['bool dernier()', '<span class="yes">public</span>']
             ])}`,
            `<h3>Constructeurs &amp; destructeur</h3>
             ${H.list([H.c('Compteur();') + ' — par défaut', H.c('Compteur(const Compteur &);') + ' — par recopie', H.c('~Compteur();') + ' — destructeur'])}`
          )}
          ${H.reveal('Voir une implémentation possible', H.code(`
            class Compteur {
                int *cpt;                        // compteur partagé (dans le tas)
                void incremente() { ++*cpt; }
                void decremente() { --*cpt; }
            public:
                Compteur() : cpt(new int(1)) {}
                Compteur(const Compteur &c) : cpt(c.cpt) {
                    incremente();                // une instance de plus
                }
                ~Compteur() {
                    decremente();
                    if (*cpt == 0) delete cpt;   // j'étais le dernier
                }
                bool dernier() const { return *cpt == 1; }
            };
          `, { small: true }))}
          ${H.tip('Ce compteur partagé, c’est exactement le principe de <code class="inline">std::shared_ptr</code> de la bibliothèque standard.')}`
      },
      {
        title: 'Problème : l’affectation',
        section: 'Exemple : Compteur',
        html: `
          ${H.warn('La recopie <code class="inline">d=c;</code> se fait comme la construction par recopie par défaut : le compilateur ajoute une <strong>recopie champ par champ</strong> ! Notre constructeur par recopie n’est pas appelé : <code class="inline">d</code> existe déjà.')}
          ${probleme}`
      },

      /* ----- Point ----- */
      {
        title: 'Exemple : une classe <code>Point</code> basique',
        section: 'Exemple : Point',
        html: `
          ${H.files([
            { name: 'Point.hpp', code: `
              class Point {
                  double x, y;
              public:
                  Point();
                  Point(double x, double y);
              };
            ` },
            { name: 'Point.cpp', code: `
              #include "Point.hpp"

              Point::Point():x(0),y(0){
              }
              Point::Point(double x, double y):x(x),y(y){
              }
            ` },
            { name: 'main.cpp', code: pointMain1 }
          ])}
          ${H.info('<code class="inline">new Point[20]</code> est possible car <code class="inline">Point</code> possède un <strong>constructeur par défaut</strong>. Les listes d’initialisation <code class="inline">x(x)</code> ne sont pas ambiguës.')}`
      },
      {
        title: '<code>Point</code> : accesseurs',
        section: 'Exemple : Point',
        html: `
          ${H.files([
            { name: 'Point.hpp', hl: [6, 7], code: `
              class Point {
                  double x, y;
              public:
                  Point();
                  Point(double x, double y);
                  double getx() const;
                  void setx(double);
              };
            ` },
            { name: 'Point.cpp', hl: [7, 8], code: `
              #include "Point.hpp"

              Point::Point():x(0),y(0){
              }
              Point::Point(double x, double y):x(x),y(y){
              }
              double Point::getx() const { return x; }
              void Point::setx(double d) { x=d; }
            ` },
            { name: 'main.cpp', hl: [6, 7, 8], code: `
              #include "Point.hpp"
              int main(){
                  Point p(2,3);
                  Point q;
                  Point *t=new Point[20];
                  q.getx();
                  t[0].getx();
                  (t+5)->setx(10);
                  delete [] t;
              }
            ` }
          ])}
          ${H.tip('<code class="inline">getx</code> ne modifie pas l’instance : elle est déclarée <code class="inline">const</code> (dans le .hpp <b>et</b> le .cpp).')}`
      },
      {
        title: '<code>Point</code> : méthode ou fonction ?',
        section: 'Exemple : Point',
        html: `
          ${H.files([
            { name: 'Point.hpp', hl: [6, 7, 9], code: `
              class Point {
                  double x, y;
              public:
                  Point();
                  Point(double x, double y);
                  void add(const Point &p);
                  Point sum(const Point &p) const;
                  double getx() const; double gety() const;
              };
              Point fsum(const Point &a, const Point &b);
            ` },
            { name: 'Point.cpp', hl: [4, 5, 6, 7, 8, 9, 10], code: `
              #include "Point.hpp"
              // ... constructeurs, getx, gety ...

              void Point::add(const Point &p){ x+=p.x; y+=p.y; }
              Point Point::sum(const Point &p) const {
                  return Point(x+p.x, y+p.y);
              }
              Point fsum(const Point &a, const Point &b){
                  return Point(a.getx()+b.getx(), a.gety()+b.gety());
              }
            ` },
            { name: 'main.cpp', hl: [6, 7, 8], code: `
              #include "Point.hpp"
              int main(){
                  Point p(2,3);
                  Point q;
                  Point *t=new Point[20];
                  t[2]=p.sum(q);
                  q.add(p);
                  t[4]=fsum(t[5],t[6]);
                  delete [] t;
              }
            ` }
          ], { tiny: true })}
          ${H.table(['', 'Modifie l’instance ?', 'Accès aux privés ?'], [
            ['add', 'oui', 'oui'],
            ['sum (const)', 'non', 'oui'],
            ['fsum (fonction)', 'non', 'non']
          ])}`
      },

      /* ----- Matrix ----- */
      {
        title: 'Exemple : une classe <code>Matrix</code>',
        section: 'Exemple : Matrix',
        html: `
          ${asanTabs(H.files([mHpp(false, false), mCpp(false, false), { name: 'main.cpp', mark: { 4: 'err' }, code: `
            #include "Matrix.hpp"
            int main(){
                Matrix m(3,3);
            } // -> fuite memoire, ajout d'un destructeur
          ` }]), asanLeak, 'La fuite est détectée à la fin du programme, avec la ligne où le tableau a été alloué.')}
          ${H.warn('Le tableau <code class="inline">data</code> est alloué dans le constructeur mais jamais libéré : <strong>fuite mémoire</strong>.', 'Étape 1 / 5')}`
      },
      {
        title: '<code>Matrix</code> : ajout du destructeur',
        section: 'Exemple : Matrix',
        html: `
          ${H.files([mHpp(true, false, [6]), mCpp(true, false, [6, 7, 8]), { name: 'main.cpp', mark: { 4: 'ok' }, code: `
            #include "Matrix.hpp"
            int main(){
                Matrix m(3,3);
            } // ok
          ` }])}
          ${H.tip('Le destructeur libère la mémoire à la sortie du bloc.', 'Étape 2 / 5')}`
      },
      {
        title: '<code>Matrix</code> : et la copie ?',
        section: 'Exemple : Matrix',
        html: `
          ${asanTabs(H.files([mHpp(true, false), mCpp(true, false), { name: 'main.cpp', hl: [4], mark: { 5: 'err' }, code: `
            #include "Matrix.hpp"
            int main(){
                Matrix m(3,3);
                Matrix n(m);
            } // erreur ! double free,
              // => ajout d'un constructeur par copie
          ` }]), asanDouble, 'Le même tableau (alloué ligne 4) est libéré deux fois par le destructeur, à la fermeture de <code class="inline">main</code>.')}
          ${H.warn('Le constructeur par recopie du compilateur copie le <strong>pointeur</strong> <code class="inline">data</code> : <code class="inline">m</code> et <code class="inline">n</code> partagent le même tableau, libéré deux fois.', 'Étape 3 / 5')}`
      },
      {
        title: '<code>Matrix</code> : constructeur par recopie',
        section: 'Exemple : Matrix',
        html: `
          ${H.files([mHpp(true, true, [6]), mCpp(true, true, [6, 7, 8, 9, 10]), { name: 'main.cpp', mark: { 5: 'ok' }, code: `
            #include "Matrix.hpp"
            int main(){
                Matrix m(3,3);
                Matrix n(m);
            } // ok
          ` }], { tiny: true })}
          ${H.tip('Copie <strong>profonde</strong> : <code class="inline">n</code> reçoit son propre tableau, rempli avec les valeurs de <code class="inline">m</code>.', 'Étape 4 / 5')}`
      },
      {
        title: '<code>Matrix</code> : et l’affectation ?',
        section: 'Exemple : Matrix',
        html: `
          ${asanTabs(H.files([mHpp(true, true), mCpp(true, true), { name: 'main.cpp', hl: [5], mark: { 6: 'err' }, code: `
            #include "Matrix.hpp"
            int main(){
                Matrix m(3,3);
                Matrix n(m);
                m=n;
            } // erreur ! double free + fuite memoire
          ` }], { tiny: true }), asanAffect, 'Le tableau de <code class="inline">n</code> (créé par le constructeur par recopie) est libéré deux fois. La fuite du tableau initial de <code class="inline">m</code> n’apparaît pas : le programme s’arrête dès la première erreur.')}
          ${H.warn('<code class="inline">m=n;</code> utilise l’<strong>opérateur d’affectation</strong> fourni par le compilateur : copie champ par champ du pointeur. Le tableau initial de <code class="inline">m</code> fuit, et celui de <code class="inline">n</code> est libéré deux fois. La solution : écrire l’opérateur d’affectation — c’est l’objet du chapitre sur les <strong>opérateurs</strong>.', 'Étape 5 / 5')}`
      },

      /* ----- Récapitulatif du chapitre ----- */
      {
        title: 'Classes : l’essentiel',
        section: 'L’essentiel',
        html: `
          ${H.list([
              'Les arguments non primitifs se passent par <strong>référence constante</strong> : ' + H.c('void f(const A &a)') + '.',
              'Une méthode qui ne modifie pas l’instance est <strong>' + H.c('const') + '</strong>.',
              'La classe alloue dynamiquement ? Elle a un <strong>destructeur</strong>.',
              'La copie doit être profonde ? Elle a un <strong>constructeur par recopie</strong>.',
              '<strong>RAII</strong> : la ressource est acquise dans le constructeur et libérée dans le destructeur, automatiquement à la sortie du bloc.'
            ])}`
      },
      {
        title: 'Classes : testez-vous',
        section: 'L’essentiel',
        html: `
          ${H.quiz({
              q: 'Une classe possède un attribut ' + H.c('int *t') + ' alloué par ' + H.c('new int[10]') + ' dans son constructeur. Que lui faut-il au minimum ?',
              options: ['Rien de plus', 'Un destructeur', 'Un destructeur et un constructeur par recopie', 'Un constructeur par défaut'],
              answer: 2,
              explain: '<p>Le <b>destructeur</b> évite la fuite ; le <b>constructeur par recopie</b> évite que deux copies partagent (et libèrent deux fois) le même tableau. Le chapitre suivant ajoute l’opérateur d’affectation.</p>'
            })}
          ${H.quiz({
              q: 'Que fait ' + H.c('A b = a;') + ' en C++ ?',
              options: ['Comme en Java : b et a désignent le même objet', 'Construit b par recopie de a', 'Appelle l’opérateur d’affectation', 'Erreur de compilation'],
              answer: 1,
              explain: '<p>C’est une <b>construction</b> (b n’existe pas encore) : le constructeur par recopie est appelé. Rien à voir avec la copie de référence de Java.</p>'
            })}`
      }
    ]
  });
})();
