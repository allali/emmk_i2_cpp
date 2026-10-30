(function () {
  /* Diagramme : copie superficielle -> double free */
  const xObj = (kind) => ({ id: 'x', x: 70, y: 60, w: 110, h: 44, label: 'A  (i)', kind: kind || 'obj', tag: 'x' });
  const yObj = (kind) => ({ id: 'y', x: 70, y: 170, w: 110, h: 44, label: 'A  (i)', kind: kind || 'obj', tag: 'y' });
  const heap = { id: 'tas', x: 290, y: 20, w: 290, h: 240, label: 'tas', kind: 'zone' };
  const pile = { id: 'pile', x: 20, y: 20, w: 200, h: 240, label: 'pile', kind: 'zone' };
  const int1 = (kind, lbl) => ({ id: 'n1', x: 370, y: 62, w: 110, h: 40, label: lbl || 'int : 0', kind: kind || 'int' });
  const int2 = (kind, lbl) => ({ id: 'n2', x: 370, y: 172, w: 110, h: 40, label: lbl || 'int : 0', kind: kind || 'int' });

  const shallowDiagram = H.diagram({
    w: 600, h: 280,
    code: `
      class A{
          int *i;
          public:
          A():i(new int(0)){}
          ~A(){ delete i; }
      };
      A x;
      A y(x); // recopie fournie par le compilateur
      // fin du bloc
    `,
    codeTitle: 'sans constructeur par recopie',
    common: { boxes: [pile, heap] },
    steps: [
      { line: 7, boxes: [xObj(), int1()], arrows: [{ from: 'x', to: 'n1' }],
        note: '<code class="inline">A x;</code> : le constructeur alloue un <code class="inline">int</code> dans le tas.' },
      { line: 8, boxes: [xObj(), yObj(), int1()], arrows: [{ from: 'x', to: 'n1' }, { from: 'y', to: 'n1' }],
        note: 'La recopie du compilateur copie <b>le pointeur</b>, pas l’entier : <code class="inline">x.i</code> et <code class="inline">y.i</code> désignent la même zone.' },
      { line: 9, boxes: [xObj(), yObj('dead'), int1('ghost', 'libéré')], arrows: [{ from: 'x', to: 'n1', kind: 'bad' }],
        note: 'Fin du bloc : <code class="inline">~A()</code> de <code class="inline">y</code> libère l’entier… <code class="inline">x.i</code> pointe maintenant sur une zone libérée.' },
      { line: 9, boxes: [xObj('dead'), yObj('dead'), int1('err', 'free ×2 !')], arrows: [{ from: 'x', to: 'n1', kind: 'bad' }],
        note: '<code class="inline">~A()</code> de <code class="inline">x</code> libère <b>une deuxième fois</b> la même zone : erreur <b>double free</b>.' }
    ]
  });

  const deepDiagram = H.diagram({
    w: 600, h: 280,
    code: `
      class A{
          int *i;
          public:
          A():i(new int(0)){}
          ~A(){ delete i; }
          A(const A &a):i(new int(*(a.i))){}
      };
      A x;
      A y(x);
    `,
    codeTitle: 'avec constructeur par recopie',
    common: { boxes: [pile, heap] },
    steps: [
      { line: 8, boxes: [xObj(), int1()], arrows: [{ from: 'x', to: 'n1' }], note: '<code class="inline">A x;</code> alloue son entier.' },
      { line: [6, 9], boxes: [xObj(), yObj(), int1(), int2()], arrows: [{ from: 'x', to: 'n1' }, { from: 'y', to: 'n2' }],
        note: 'Notre constructeur par recopie alloue un <b>nouvel</b> entier et y copie la valeur : c’est une <b>copie profonde</b>. Chaque destructeur libère sa propre zone. ✔' }
    ]
  });

  /* Diagramme : une référence est un autre nom… encodé par un pointeur interne */
  const refZone = { id: 'pile', x: 10, y: 6, w: 380, h: 158, label: 'pile (stack)', kind: 'zone', fs: 16 };
  const refI = (tag, lbl) => ({ id: 'i', x: 110, y: 36, w: 150, h: 48, label: lbl || '?', kind: 'cell', tag, fs: 18, tagFs: 20 });
  const refPtr = { id: 'rp', x: 110, y: 108, w: 150, h: 48, label: '0x7F10', kind: 'ghost', tag: 'interne', fs: 17, tagFs: 15 };
  const refAdr = { x: 270, y: 66, text: '0x7F10', fs: 15, cls: 'muted' };
  const refDiagram = H.diagram({
    w: 400, h: 170, maxw: 380,
    code: `
      int i;
      int &r = i; // r est un autre nom pour i
    `,
    common: { boxes: [refZone], texts: [refAdr] },
    steps: [
      { line: 1, boxes: [refI('i')],
        note: '<code class="inline">int i;</code> : une case est réservée dans la pile, à l’adresse <code class="inline">&amp;i</code> (ici <code class="inline">0x7F10</code>, valeur d’exemple).' },
      { line: 2, boxes: [refI('i, r')],
        note: '<code class="inline">r</code> est un <b>autre nom</b> pour cette case : <code class="inline">r</code> et <code class="inline">i</code> désignent la même donnée, et <code class="inline">&amp;r</code> vaut <code class="inline">&amp;i</code>.' },
      { line: 2, boxes: [refI('i, r'), refPtr], arrows: [{ from: 'rp', to: 'i' }],
        note: 'En interne, <code class="inline">r</code> est encodée par un <b>pointeur</b> vers <code class="inline">i</code>, déréférencé automatiquement. Ce pointeur n’est <b>pas accessible</b> : <code class="inline">&amp;r</code> donne l’adresse de <code class="inline">i</code>.' }
    ]
  });

  Course.chapter({
    id: 'classes',
    slides: [
      /* ------------------------------------------------------------ Constructeur par recopie */
      {
        title: 'Constructeur par recopie',
        section: 'Recopie',
        html: `
          <p class="lead">Le <em class="term">constructeur par recopie</em> permet d’instancier une classe à partir d’une <strong>autre instance de cette classe</strong>.</p>
          <p>Il est utilisé, entre autres, lors du <strong>passage de paramètres</strong> à une fonction et pour la <strong>valeur de retour</strong>.</p>
          ${H.cols(
            H.code(`
              A f(A p) { return p; }
              ....
              A x;
              f(x);
            `),
            H.list([
              'La variable <code class="inline">p</code>, locale à <code class="inline">f</code>, est allouée automatiquement et instanciée <strong>par recopie</strong> de <code class="inline">x</code>.',
              'La valeur de retour de <code class="inline">f</code> est instanciée <strong>par recopie</strong> de la variable locale.'
            ], { frag: true })
          )}
          ${H.java('<code class="inline">A b = a;</code> copie la <b>référence</b> : <code class="inline">a</code> et <code class="inline">b</code> désignent le même objet. En C++, <code class="inline">A b = a;</code> crée un <strong>deuxième objet</strong>, copie du premier : c’est le travail du constructeur par recopie.')}`
      },
      {
        title: 'Pourquoi pas <code>A(A x)</code> ?',
        section: 'Recopie',
        html: `
          <p>L’idée est d’avoir dans <code class="inline">A</code> un constructeur qui prend une instance de <code class="inline">A</code> en argument :</p>
          ${H.cols(
            `${H.code(`
              class A{
              public:
                  A(A x); // erreur !
              };
            `)}
            ${H.warn('Pour instancier la variable locale <code class="inline">x</code> (passée <b>par valeur</b>), il faudrait… appeler le constructeur par recopie ! Récursion infinie : le compilateur refuse.')}`,
            `${H.frag(`<p>La solution : une <strong>référence</strong> (vue plus haut) — pas de copie pour passer l’argument :</p>
            ${H.code(`
              class A{
              public:
                  A(const A &x);
                  A(A &x);
              };
            `)}`)}`
          )}`
      },

      /* ------------------------------------------------------------ Références */
      {
        title: 'Références',
        section: 'Références et const',
        html: `
          <p class="lead">Un nouvel outil, dont on aura besoin pour la copie des objets : une <em class="term">référence</em> peut être vue comme un <strong>« alias »</strong> sur une instance.</p>
          ${refDiagram}
          ${H.frag(`<p>Après l’initialisation :</p>
          ${H.list([
            'les variables <code class="inline">i</code> et <code class="inline">r</code> représentent <strong>la même donnée</strong> ;',
            'l’adresse de <code class="inline">r</code> (<code class="inline">&amp;r</code>) est égale à celle de <code class="inline">i</code> (<code class="inline">&amp;i</code>).'
          ])}`)}`
      },
      {
        title: 'Références : règles',
        section: 'Références et const',
        html: `
          ${H.rule('Une référence doit <strong>obligatoirement être initialisée</strong> à sa création et ne peut plus référencer une autre instance par la suite.')}
          ${H.frag(H.key('Contrairement à un pointeur, une référence « pointe » <strong>toujours</strong> sur une instance.'))}
          ${H.frag(H.java('Une « référence » Java peut valoir <code class="inline">null</code> et être réaffectée : elle ressemble donc à un <b>pointeur</b> C++. La référence C++ est un simple <strong>autre nom</strong> : jamais nulle, jamais réaffectée.'))}`
      },
      {
        title: 'Références : paramètres et retour',
        section: 'Références et const',
        html: `
          ${H.cols(
            `<p>Passage par référence : la fonction modifie les variables de l’appelant.</p>
            ${H.code(`
              void swap(int &i, int &j){
                  int k = i;
                  i = j;
                  j = k;
              }
              int a = 3, b = 5;
              swap(a, b);        // a vaut 5, b vaut 3
              int t[10];
              swap(t[1], t[2]);
            `)}`,
            H.frag(`<p>On peut aussi utiliser une référence comme <strong>valeur de retour</strong> :</p>
            ${H.code(`
              int &element(int *t, int i){
                  return t[i];
              }
              element(t, 5) = 10; // modifie t[5]
              element(t, 20) = 99; // !!! segfault
            `, { mark: { 5: 'err' } })}`)
          )}
          ${H.frag(H.rule('Sauf pour les types primitifs, on ne prendra plus les instances <strong>par recopie</strong> mais <strong>par référence</strong>.'), { withPrev: true })}`
      },
      {
        title: 'Références : jamais nulles',
        section: 'Références et const',
        html: `
          <p>Parmi les avantages des références : une référence <strong>ne peut pas être nulle</strong>.</p>
          ${H.files([
            { name: 'avec des pointeurs', code: `
              void swap(int *i, int *j){
                  assert(i != nullptr);
                  assert(j != nullptr);
                  int k = *i;
                  *i = *j;
                  *j = k;
              }` },
            { name: 'avec des références', code: `
              void swap(int &i, int &j){
                  int k = i;
                  i = j;
                  j = k;
              }` }
          ])}
          ${H.tip('Sauf si l’on souhaite laisser la possibilité de passer <code class="inline">nullptr</code> ou de <b>modifier la valeur du pointeur</b>, on remplace le pointeur par une référence.')}`
      },
      {
        title: 'Retourner une référence : oui, mais…',
        section: 'Références et const',
        html: `
          <p>On ne peut retourner une référence que si l’objet renvoyé <strong>existe en dehors de la fonction</strong> (comme pour les pointeurs).</p>
          ${H.cols(
            H.code(`
              int &f(){
                  int i;
                  return i;
              }
              int &g(int j){
                  return j;
              }
            `),
            H.code(`
              int &h(int &k){
                  return k;
              }
              int &p(int *l){
                  return *l;
              }
            `)
          )}
          <p>Quels appels sont corrects ? (avec <code class="inline">int x;</code>)</p>
          ${H.table(['Appel', 'Verdict', 'Pourquoi'], [
            ['f() = 0;', 'non', 'référence sur une variable locale, détruite à la sortie de <code class="inline">f</code>'],
            ['g(x) = 0;', 'non', '<code class="inline">j</code> est une copie locale de <code class="inline">x</code> : même problème'],
            ['h(x) = 0;', 'oui', '<code class="inline">k</code> est un alias de <code class="inline">x</code>, qui existe hors de <code class="inline">h</code>'],
            ['p(&x) = 0;', 'oui', '<code class="inline">*l</code> est <code class="inline">x</code>'],
            ['p(nullptr) = 0;', 'non', 'déréférencement de <code class="inline">nullptr</code> : plantage']
          ].map(([c, v, w], k) => [c,
            H.frag(v === 'oui' ? '<span class="yes">✔ oui</span>' : '<span class="no">✘ non</span>', { tag: 'span', withPrev: k > 0 }),
            H.frag(w, { tag: 'span', withPrev: true })]), { cls: 'left' })}`
      },
      {
        title: 'Par valeur ou par référence ?',
        section: 'Références et const',
        html: `
          ${H.files([
            { name: 'par référence', code: `
              void print(int &i){
                  // 1 entier
              }
              void print(Matrix &m){
                  // 1 instance
              }` },
            { name: 'par valeur', code: `
              void print(int i){
                  // 2 entiers
              }
              void print(Matrix m){
                  // 2 instances : recopie !
              }` }
          ])}
          ${H.code(`
            int j;
            print(j);
            Matrix n(10000);
            print(n); // par valeur : copie d'une matrice 10000...
          `)}
          ${H.warn('Problème de l’<strong>intégrité des données</strong> : avec une référence, comment être sûr que la fonction ne va pas <b>modifier</b> l’instance passée en argument ?')}`
      },
      {
        title: '<code>const</code> : définition',
        section: 'Références et const',
        html: `
          <p>Le mot-clé ${H.c('const')} indique qu’une donnée <strong>ne peut pas être modifiée</strong>.</p>
          ${H.cols(
            H.code(`
              const int i = 5;
              int j = 10;
              const int &r = j;
              r = 4; // erreur !
              j = 4; // ok
              i = 1; // erreur !
            `),
            H.code(`
              const int *p = 0; // int const *p = 0;
              p = new int[10];  // ok : p n'est pas const
              p[0] = 5;         // erreur ! *p est const
              int * const q = new int[10];
              q = nullptr;         // erreur ! q est const
              q[0] = 5;         // ok
            `)
          )}
          ${H.info('Une variable déclarée <code class="inline">const</code> doit être <strong>initialisée lors de sa déclaration</strong>.')}
          ${H.java('<code class="inline">final A a</code> empêche seulement de réaffecter <code class="inline">a</code> : l’objet reste modifiable (≈ <code class="inline">A * const</code>). En C++, <code class="inline">const</code> peut aussi protéger <strong>l’objet lui-même</strong>.')}`
      },
      {
        title: 'Lire une déclaration <code>const</code>',
        section: 'Références et const',
        html: `
          <p>Un <code class="inline">const</code> s’applique à ce qui est <strong>juste à sa gauche</strong> (ou à droite s’il est en tête). Lisez de droite à gauche :</p>
          ${H.code(`
            const type * const * const p;
            type const * const * const p;  // équivalent
          `)}
          ${H.table(['Position du const', 'const type <i>ou</i> type const', '* const *', '* const p'], [
            ['Interdit', H.c('**p = …'), H.c('*p = …'), H.c('p = …')]
          ])}
          ${H.cols(
            H.table(['Déclaration', 'Lecture'], [
              ['const int *p', 'pointeur vers un <b>int constant</b>'],
              ['int const *p', 'idem'],
              ['int * const p', 'pointeur <b>constant</b> vers un int'],
              ['const int * const p', 'les deux']
            ], { cls: 'left' }),
            H.warn('Lorsque l’on dispose d’une <strong>référence constante</strong> sur une instance de classe, comment garantir que l’appel d’une méthode ne va pas modifier l’instance ?', 'Et pour les objets ?')
          )}`
      },
      {
        title: '<code>const</code> et instances',
        section: 'Références et const',
        html: `
          <p>Illustration du problème :</p>
          ${H.files([
            { name: 'A.hpp', code: `
              class A{
                  int i;
              public:
                  int get(){ return i; }
                  void set(int v){
                      this->i = v;
                  }
              };` },
            { name: 'main.cpp', code: `
              void f(const A &x){
                  x.get();
                  x.set(0); // !
              }
              A y;
              f(y);`, mark: { 3: 'err' } }
          ])}
          <p>La référence est constante (l’instance ne doit pas être modifiée) mais l’appel de méthode <strong>modifie l’objet</strong> !</p>
          ${H.key('On distingue deux types de méthodes : celles qui sont susceptibles de <strong>modifier</strong> l’objet et celles qui <strong>ne le modifient pas</strong>.')}`
      },
      {
        title: 'Méthodes <code>const</code>',
        section: 'Références et const',
        html: `
          <p>Une méthode peut être typée <code class="inline">const</code> : dans cette méthode, <code class="inline">this</code> est de type <code class="inline">const NomClasse * const</code>.
          Tous les attributs deviennent alors constants eux aussi.</p>
          ${H.files([
            { name: 'A.hpp', code: `
              class A{
                  int i;
                  int *d;
              public:
                  void m() const;
                  void p();
              };` },
            { name: 'A.cpp', code: `
              void A::p() {
                  // this : A * const
              }
              void A::m() const {
                  // this : const A * const
                  //        (= A const * const)
                  // this->i : const int
                  // this->d : int * const
              }` }
          ])}
          ${H.warn('Dans <code class="inline">m() const</code>, <code class="inline">this-&gt;d</code> est un <code class="inline">int * const</code> : on ne peut pas changer le pointeur, mais on peut modifier l’entier pointé !')}`
      },
      {
        title: 'Fil rouge : <code>const</code> et références',
        section: 'Références et const',
        group: 'vector',
        html: `
          <p><code class="inline">get</code> et <code class="inline">add</code> ne modifient pas l’instance : ce sont des méthodes <code class="inline">const</code>. <code class="inline">b</code> est passé par référence constante.</p>
          <div class="cols" style="grid-template-columns: 41fr 52fr 40fr; gap: 14px">
            <div class="col">${H.code(`#ifndef VECTOR_HPP
#define VECTOR_HPP

struct Vector {
    int *values;
    int size;

    int get(int i) const;
    void set(int i, int x);
    Vector *add(const Vector &b) const;
};

Vector *vector_create(int size);
void vector_destroy(Vector *v);

#endif`, { title: 'Vector.hpp', small: true, hl: [8, 10] })}</div>
            <div class="col">${H.code(`#include "Vector.hpp"

Vector *vector_create(int size) {
    Vector *v = new Vector;
    v->values = new int[size];
    v->size = size;
    return v;
}
void vector_destroy(Vector *v) {
    delete[] v->values;
    delete v;
}
int Vector::get(int i) const {
    return values[i];
}
void Vector::set(int i, int x) {
    values[i] = x;
}
Vector *Vector::add(const Vector &b) const {
    if (size != b.size) return nullptr;
    auto r = vector_create(size);
    for (int i = 0; i < size; i++)
        r->values[i] = values[i] + b.values[i];
    return r;
}`, { title: 'Vector.cpp', small: true, hl: [13, 19, 20, 23] })}</div>
            <div class="col">${H.code(`#include <stdio.h>
#include "Vector.hpp"

int main(void) {
    Vector *a = vector_create(3);
    Vector *b = vector_create(3);
    for (int i = 0; i < 3; i++) {
        a->set(i, i);
        b->set(i, 10 * i);
    }
    auto c = a->add(*b);
    printf("%d\\n", c->get(2));
    vector_destroy(a);
    vector_destroy(b);
    vector_destroy(c);
    return 0;
}`, { title: 'main.cpp', small: true, hl: [11] })}</div>
          </div>
        `
      },
      {
        title: 'Appeler une méthode sur une instance <code>const</code>',
        section: 'Références et const',
        html: `
          <p>Sur une variable constante, seules les méthodes <strong>déclarées const</strong> peuvent être appelées :</p>
          ${H.code(`
            A x;
            const A &y = x;

            x.m(); // ok
            x.p(); // ok
            y.p(); // erreur !
            y.m(); // ok
          `)}
          ${H.info('Une méthode <code class="inline">const</code> peut être appelée sur tout type de variable ; une méthode non const seulement sur une variable non constante.')}
          ${H.rule('Lors de l’écriture d’une méthode, on ne doit pas se demander si elle doit être <code class="inline">const</code>, mais plutôt <strong>si l’on a besoin qu’elle ne soit pas const</strong>.')}
          ${H.rule('Les arguments de fonction (non primitifs) seront des <strong>références constantes</strong>, sauf si l’on veut modifier l’argument.')}`
      },
      {
        title: 'Surcharge par <code>const</code>',
        section: 'Références et const',
        html: `
          <p>Il est possible de surcharger une méthode en utilisant le <code class="inline">const</code> :</p>
          ${H.cols(
            H.code(`
              class A{
              public:
                  void m(){
                      printf("le site d'appel n'est pas constant");
                  }
                  void m() const {
                      printf("le site d'appel est constant");
                  }
              };
            `, { small: true }),
            `${H.code(`
              A x;
              const A &y = x;
              A const *p = &x;
              x.m(); // ?
              y.m(); // ?
              p->m(); // ?
            `)}
            ${H.reveal('Voir les réponses', H.list([
              '<code class="inline">x.m()</code> → version <b>non const</b> (x n’est pas constant)',
              '<code class="inline">y.m()</code> → version <b>const</b>',
              '<code class="inline">p-&gt;m()</code> → version <b>const</b> (p pointe vers un A const)'
            ]))}`
          )}
          ${H.warn('Le <code class="inline">const</code> fait partie de la <strong>signature</strong> de la méthode : il doit être présent dans le <code class="inline">.hpp</code> <b>et</b> dans le <code class="inline">.cpp</code>.')}`
      },
      {
        title: '<code>const</code> et arguments de fonction',
        section: 'Références et const',
        html: `
          <div class="cols" style="--n:2; grid-template-columns: minmax(0, 2fr) minmax(0, 3fr)">
            <div class="col">${H.code(`
              class A{
                  int i;
              public:
                  int get() const { return i; }
              };

              void f(A a){ // copie
                  printf("%d\\n", a.get());
              }

              void g(A &b){
                  printf("%d\\n", b.get());
              }
            `)}</div>
            <div class="col"><div style="display: grid">
              <div style="grid-area: 1 / 1">${H.code(`
                void h(const A &c){
                    g(c);    // ?
                    f(c);    // ?
                    c.get(); // ?
                }
                A x;
                const A &y = x;
                h(x); // ?
                g(x); // ?
                g(y); // ?
              `)}</div>
              <div class="frag" style="grid-area: 1 / 1">${H.code(`
                void h(const A &c){
                    g(c); // non : g attend une référence non const
                    f(c); // oui : copie, l’original n’est pas modifié
                    c.get(); // oui : get est const
                }
                A x;
                const A &y = x;
                h(x); // oui : non const → const, toujours possible
                g(x); // oui : x n’est pas const
                g(y); // non : y est une référence const
              `, { mark: { 2: 'err', 3: 'ok', 4: 'ok', 8: 'ok', 9: 'ok', 10: 'err' } })}</div>
            </div></div>
          </div>`
      },
      {
        title: 'Constructeur par recopie (suite)',
        section: 'Recopie',
        html: `
          <p>Le constructeur par recopie peut donc s’écrire de deux façons :</p>
          ${H.code(`
            class A{
            public:
                A(const A &x); // 1
                A(A &x);       // 2
            };
          `)}
          ${H.info('Si l’on n’écrit pas de constructeur par recopie, le compilateur en fournit un : il fait une recopie <strong>attribut par attribut</strong> en utilisant les constructeurs par recopie des types des attributs.')}
          <p>Le constructeur fourni sera de forme <b>1</b> si tous les constructeurs par recopie des attributs sont de forme 1, sinon de forme <b>2</b>.</p>`
      },
      {
        title: 'La recopie générée par le compilateur',
        section: 'Recopie',
        html: `
          <p>Pour cette classe, le compilateur génère l’équivalent de :</p>
          ${H.code(`
            class Comp{
                int i;
                std::string s;
                Matrix m;
                public:
                Comp(const Comp &c):i(c.i),s(c.s),m(c.m){}
            };
          `, { hl: [6] })}
          ${H.rule('On préférera <strong>toujours</strong> écrire le constructeur par recopie sous la forme 1 : <code class="inline">A(const A &amp;)</code>.')}
          ${H.rule('Toute classe nécessitant une <strong>copie profonde</strong> (allocation dynamique des attributs) devra avoir un <strong>constructeur par recopie</strong>.')}`
      },
      {
        title: 'Copie superficielle : le double free',
        section: 'Recopie',
        html: `
          <p>Ici, il y a une erreur : on libère <strong>deux fois</strong> le même espace mémoire.</p>
          ${shallowDiagram}`
      },
      {
        title: 'Le double free, vu par AddressSanitizer',
        section: 'Recopie',
        html: `
          <p>Compilé avec <code class="inline">-fsanitize=address</code>, le programme s’arrête et indique <strong>où</strong> la mémoire a été libérée deux fois :</p>
          ${H.asan(`
            $ g++ -g -fsanitize=address copie.cpp -o copie && ./copie
            ==149465==ERROR: AddressSanitizer: attempting double-free on 0x502000000010 in thread T0:
                #1 0x64184de404a5 in A::~A() copie.cpp:5
                #2 0x64184de4034f in main copie.cpp:11
            freed by thread T0 here:
                #1 0x64184de404a5 in A::~A() copie.cpp:5
                #2 0x64184de40343 in main copie.cpp:11
            previously allocated by thread T0 here:
                #1 0x64184de403f3 in A::A() copie.cpp:4
                #2 0x64184de402ed in main copie.cpp:9
            SUMMARY: AddressSanitizer: double-free ... in operator delete(void*, unsigned long)
          `)}
          ${H.tip('Lisez de haut en bas : l’erreur (2ᵉ <code class="inline">delete</code>), puis où la zone a déjà été libérée, puis où elle avait été allouée. Pensez à cette option en TP !')}`
      },
      {
        title: 'Copie profonde : la correction',
        section: 'Recopie',
        html: deepDiagram
      },
      {
        title: 'Fil rouge : constructeur par recopie',
        section: 'Recopie',
        group: 'vector',
        html: `
          <p>Sans ce constructeur, <code class="inline">d</code> et <code class="inline">a</code> partageraient le même tableau : double <code class="inline">delete[]</code> à la fin du bloc. La recopie alloue un nouveau tableau et copie les valeurs.</p>
          <div class="cols" style="grid-template-columns: 41fr 52fr 40fr; gap: 14px">
            <div class="col">${H.code(`#ifndef VECTOR_HPP
#define VECTOR_HPP

class Vector {
    int *values;
    int size;

public:
    Vector(int size);
    Vector(const Vector &v);
    ~Vector();
    int get(int i) const;
    void set(int i, int x);
    Vector *add(const Vector &b) const;
};

#endif`, { title: 'Vector.hpp', small: true, hl: [10] })}</div>
            <div class="col">${H.code(`#include "Vector.hpp"

Vector::Vector(int size)
    : values(new int[size]), size(size) {
}
Vector::Vector(const Vector &v)
    : values(new int[v.size]), size(v.size) {
    for (int i = 0; i < size; i++)
        values[i] = v.values[i];
}
Vector::~Vector() {
    delete[] values;
}
int Vector::get(int i) const {
    return values[i];
}
void Vector::set(int i, int x) {
    values[i] = x;
}
Vector *Vector::add(const Vector &b) const {
    if (size != b.size) return nullptr;
    auto r = new Vector(size);
    for (int i = 0; i < size; i++)
        r->values[i] = values[i] + b.values[i];
    return r;
}`, { title: 'Vector.cpp', small: true, hl: [6, 7, 8, 9] })}</div>
            <div class="col">${H.code(`#include <stdio.h>
#include "Vector.hpp"

int main(void) {
    Vector a(3);
    Vector b(3);
    for (int i = 0; i < 3; i++) {
        a.set(i, i);
        b.set(i, 10 * i);
    }
    Vector d = a;   // recopie
    auto c = a.add(b);
    printf("%d\\n", c->get(2));
    delete c;
    return 0;
}`, { title: 'main.cpp', small: true, hl: [11] })}</div>
          </div>
        `
      },
      {
        title: 'Constructeurs <code>protected</code> et <code>private</code>',
        section: 'Constructeur',
        html: `
          ${H.cols(
            `<h3>Uniquement <code class="inline">protected</code></h3>
            <p>La classe ne pourra être instanciée que par :</p>
            ${H.list(['une sous-classe (instanciation parent)', 'une classe ou fonction amie', 'une classe ou fonction amie d’une sous-classe', 'une méthode de la classe'])}`,
            `<h3>Uniquement <code class="inline">private</code></h3>
            <p>La classe ne pourra être instanciée que par :</p>
            ${H.list(['une classe ou fonction amie', 'une méthode de la classe'])}`
          )}
          ${H.tip('C’est la base de patrons comme le <b>singleton</b> ou la <b>fabrique</b> : un constructeur privé + une méthode statique qui crée les instances.')}`
      },

      /* ------------------------------------------------------------ Destructeur */
      {
        title: 'Destructeur : définition',
        section: 'Destructeur',
        html: `
          <p class="lead">Le <em class="term">destructeur</em> est une méthode d’instance <strong>sans type de retour</strong> et de nom ${H.c('~NomClasse')}.</p>
          ${H.cols(
            H.code(`
              class Nom{
              public:
                  ~Nom(){}
              };
            `),
            H.code(`
              void f(){
                  Nom n;
                  Nom *p = new Nom;
                  delete p; // appel de p->~Nom()
              } // appel de n.~Nom()
            `)
          )}
          ${H.rule('Toute classe ayant <strong>alloué dynamiquement</strong> ses attributs devra écrire un <strong>destructeur</strong>.')}`
      },
      {
        title: 'Quand le destructeur est-il appelé ?',
        section: 'Destructeur',
        html: `
          ${H.table(['Allocation', 'Appel du destructeur'], [
            ['dynamique', 'déclenché par l’opérateur <code class="inline">delete</code>'],
            ['automatique', 'à la <strong>sortie du bloc</strong> d’instructions qui contient l’instance']
          ], { cls: 'left' })}
          ${H.key('Les ressources mémoire associées à l’instance sont libérées <strong>après</strong> l’appel au destructeur.')}
          ${H.java('Le ramasse-miettes libère les objets « un jour », à un moment imprévisible. En C++, pas de ramasse-miettes : le destructeur est appelé à un moment <strong>précis et connu</strong>.')}`
      },
      {
        title: 'Destructeur : exemple',
        section: 'Destructeur',
        html: `
          ${H.cols(
            H.code(`
              class Tab{
                  int *data;
              public:
                  Tab(int s){
                      data = new int[s];
                  }
                  ~Tab(){
                      delete [] data;
                  }
              };
            `),
            `${H.code(`
              int main(){
                  Tab t(10); // allocation
              } // libération
            `)}
            <p>Il est ainsi possible de « simuler » un tableau dans la pile avec une <strong>désallocation automatique</strong>.</p>
            ${H.key('C’est le principe du <b>RAII</b> : <strong>acquérir la ressource dans le constructeur, la libérer dans le destructeur</strong>.')}`
          )}`
      },
      {
        title: 'Fil rouge : destructeur',
        section: 'Destructeur',
        group: 'vector',
        html: `
          <p>Le destructeur remplace <code class="inline">vector_destroy</code>. Les attributs deviennent privés (<code class="inline">class</code>). <code class="inline">a</code> et <code class="inline">b</code> sont automatiques : détruits à la fin du bloc, sans <code class="inline">delete</code>.</p>
          <div class="cols" style="grid-template-columns: 41fr 52fr 40fr; gap: 14px">
            <div class="col">${H.code(`#ifndef VECTOR_HPP
#define VECTOR_HPP

class Vector {
    int *values;
    int size;

public:
    Vector(int size);
    ~Vector();
    int get(int i) const;
    void set(int i, int x);
    Vector *add(const Vector &b) const;
};

#endif`, { title: 'Vector.hpp', small: true, hl: [4, 8, 10] })}</div>
            <div class="col">${H.code(`#include "Vector.hpp"

Vector::Vector(int size)
    : values(new int[size]), size(size) {
}
Vector::~Vector() {
    delete[] values;
}
int Vector::get(int i) const {
    return values[i];
}
void Vector::set(int i, int x) {
    values[i] = x;
}
Vector *Vector::add(const Vector &b) const {
    if (size != b.size) return nullptr;
    auto r = new Vector(size);
    for (int i = 0; i < size; i++)
        r->values[i] = values[i] + b.values[i];
    return r;
}`, { title: 'Vector.cpp', small: true, hl: [6, 7] })}</div>
            <div class="col">${H.code(`#include <stdio.h>
#include "Vector.hpp"

int main(void) {
    Vector a(3);
    Vector b(3);
    for (int i = 0; i < 3; i++) {
        a.set(i, i);
        b.set(i, 10 * i);
    }
    auto c = a.add(b);
    printf("%d\\n", c->get(2));
    delete c;
    return 0;
}`, { title: 'main.cpp', small: true, hl: [5, 6, 8, 9, 11, 13] })}</div>
          </div>
        `
      },
      {
        title: 'Un pointeur « automatique »',
        section: 'Destructeur',
        html: `
          ${H.cols(
            H.code(`
              class AutoInt{
                  int *t;
              public:
                  AutoInt(int *t):t(t){}
                  int get(int i) const {
                      return t[i];
                  }
                  void set(int i, int v){
                      t[i] = v;
                  }
                  ~AutoInt(){
                      if (t != nullptr)
                          delete [] t;
                  }
              };
            `, { small: true }),
            `${H.code(`
              // Utilisation :
              int main(){
                  AutoInt t(new int[100]);
                  t.get(0);
                  t.set(0, 0);
              } // libération auto.
            `)}
            ${H.info('Nous verrons comment améliorer ce code avec les opérateurs.')}
            ${H.warn('Attention à la <strong>recopie</strong> ! Copier un <code class="inline">AutoInt</code> copie le pointeur : double <code class="inline">delete</code> en vue.')}`
          )}`
      },
      {
        title: 'AutoInt : transférer le pointeur',
        section: 'Recopie',
        html: `
          ${H.cols(
            H.code(`
              class AutoInt{
                  int *t;
              public:
                  AutoInt(int *t):t(t){}
                  int get(int i) const;
                  void set(int i, int v);
                  ~AutoInt(){
                      if (t != nullptr)
                          delete [] t;
                  }
                  AutoInt(AutoInt &p){
                      t = p.t;
                      p.t = nullptr;
                  }
              };
            `, { small: true, hl: [11, 12, 13, 14] }),
            H.code(`
              void f(AutoInt ai){
              } // libération auto.

              AutoInt tab(){
                  AutoInt x(new int[100]);
                  return x;
              }
              int main(){
                  AutoInt q(new int[100]);
                  f(q); // q ne possède plus rien

                  AutoInt r(tab());
              } // libération auto.
            `, { small: true })
          )}
          ${H.key('Une solution consiste à <strong>transférer</strong> le pointeur : la copie « vole » la ressource et laisse l’original à <code class="inline">nullptr</code>. C’est ce que fait <code class="inline">std::auto_ptr</code> (déprécié) de la bibliothèque standard.')}`
      },

      /* ------------------------------------------------------------ static */
      {
        title: '<code>static</code> : définition',
        section: 'static',
        html: `
          <p>Une variable <em class="term">statique</em> a une <strong>durée de vie égale à celle du programme</strong>, et une portée réduite à un fichier, une classe, une fonction ou une méthode selon l’endroit où elle est déclarée.</p>
          ${H.files([
            { name: 'Fichier.hpp', code: `
              void f();

              class A{
                  static int i;
                  public:
                  static void m();
              };` },
            { name: 'Fichier.cpp', code: `
              #include "Fichier.hpp"

              static double v;   // portée : le fichier

              int A::i = 0;      // attribut de classe

              void A::m(){
                  this; // erreur ! pas d'instance
              }
              void f(){
                  static int compteur = 0; // conservé entre les appels
              }`, mark: { 8: 'err' } }
          ])}`
      },
      {
        title: '<code>static</code> et classes',
        section: 'static',
        html: `
          ${H.list([
            'Une méthode publique statique est équivalente à une <strong>fonction amie</strong> (sauf pour la portée).',
            'On pourra utiliser les méthodes statiques en conjonction avec un <strong>constructeur privé</strong>.',
            'Avec <code class="inline">const</code>, <code class="inline">static</code> permet de définir des <strong>propriétés constantes de classe</strong>.'
          ])}
          ${H.variants([
            { label: 'Initialisation dans le .hpp', code: `
              class Chaine {
                  public:
                  static const char END = '\\0';
              };`,
              note: 'Avant C++11, pour un attribut <code class="inline">static</code>, seul un <code class="inline">static const</code> de type entier (<code class="inline">int</code>, <code class="inline">char</code>…) peut être initialisé directement dans la classe. <code class="inline">Chaine::END</code> se comporte alors comme une constante remplacée à la compilation (un peu comme une macro).' },
            { label: 'Initialisation séparée', code: `
              class Chaine {
                  public:
                  static const char END;
              };
              const char Chaine::END = '\\0';`,
              note: 'Sinon, on déclare l’attribut dans la classe et on le <b>définit</b> (une seule fois) dans le <code class="inline">.cpp</code> : <code class="inline">Chaine::END</code> est alors une vraie variable, avec une adresse en mémoire.' },
            { label: 'C++11 : constexpr', code: `
              class Chaine {
                  public:
                  static constexpr double PI = 3.14159;
              };`,
              note: 'Depuis C++11, un attribut <code class="inline">static constexpr</code> peut être initialisé dans la classe même s’il n’est pas entier (<code class="inline">double</code>…), pourvu que la valeur soit connue à la compilation. Avec <code class="inline">static const double PI = 3.14159;</code>, g++ refuse : <code class="inline">constexpr</code> est nécessaire.' }
          ])}`
      },
      {
        title: 'Quiz : <code>static</code>',
        section: 'static',
        html: H.quiz({
          q: 'Dans une méthode <code class="inline">static</code>, que peut-on utiliser ?',
          options: ['<code class="inline">this</code>', 'les attributs d’instance directement', 'les attributs <code class="inline">static</code> de la classe', 'rien de la classe'],
          answer: 2,
          explain: '<p>Une méthode statique n’est liée à <b>aucune instance</b> : pas de <code class="inline">this</code>, donc pas d’accès direct aux attributs d’instance. Elle peut en revanche utiliser les membres statiques (et accéder aux membres privés d’une instance qu’on lui passe).</p>'
        })
      }
    ]
  });
})();
