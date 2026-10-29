(function () {
  /* Diagramme pile / tas pour l'exemple complet */
  const stackZone = { id: 'pile', x: 20, y: 30, w: 220, h: 250, label: 'pile (stack)', kind: 'zone' };
  const heapZone = { id: 'tas', x: 330, y: 30, w: 250, h: 250, label: 'tas (heap)', kind: 'zone' };
  const iVar = (lbl, kind) => ({ id: 'i', x: 90, y: 80, w: 130, h: 40, label: lbl, kind: kind || 'cell', tag: 'i' });
  const tVar = (lbl, kind) => ({ id: 't', x: 90, y: 140, w: 130, h: 40, label: lbl, kind: kind || 'cell', tag: 't' });
  const aInt = (kind, lbl) => ({ id: 'A02', x: 360, y: 75, w: 90, h: 36, label: lbl || 'int', kind: kind || 'blue', tag: '0x0A02', tagPos: 'top', tagFs: 12 });
  const aTab = (kind, lbl) => ({ id: 'A10', x: 360, y: 150, w: 200, h: 100, label: lbl || 'int[10]\n40 octets', kind: kind || 'blue', tag: '0x0A10', tagPos: 'top', tagFs: 12 });

  const allocDiagram = H.diagram({
    w: 600, h: 300,
    code: `
      int *i = new int;
      int *t = new int[10];
      delete i;
      delete [] t;
    `,
    codeTitle: 'exemple.cpp',
    common: { boxes: [stackZone, heapZone] },
    steps: [
      { note: 'Au départ : la pile et le tas sont libres.' },
      { line: 1, boxes: [iVar('0x0A02'), aInt()], arrows: [{ from: 'i', to: 'A02' }],
        note: '<b>Allocation automatique</b> de la variable <code class="inline">i</code> (sizeof(int *) octets dans la pile) + <b>allocation dynamique</b> d’un <code class="inline">int</code> dans le tas.' },
      { line: 2, boxes: [iVar('0x0A02'), tVar('0x0A10'), aInt(), aTab()], arrows: [{ from: 'i', to: 'A02' }, { from: 't', to: 'A10' }],
        note: 'Même chose pour <code class="inline">t</code> : un pointeur dans la pile, un tableau de 10 <code class="inline">int</code> dans le tas.' },
      { line: 3, boxes: [iVar('0x0A02'), tVar('0x0A10'), aInt('ghost', 'libéré'), aTab()], arrows: [{ from: 'i', to: 'A02', kind: 'bad' }, { from: 't', to: 'A10' }],
        note: '<code class="inline">delete i</code> libère la zone du tas… mais <code class="inline">i</code> contient toujours l’ancienne adresse !' },
      { line: 4, boxes: [iVar('0x0A02'), tVar('0x0A10'), aInt('ghost', 'libéré'), aTab('ghost', 'libéré')], arrows: [{ from: 'i', to: 'A02', kind: 'bad' }, { from: 't', to: 'A10', kind: 'bad' }],
        note: 'Après <code class="inline">delete [] t</code>, les deux pointeurs « pendent » vers de la mémoire qui n’est plus réservée. Les variables <code class="inline">i</code> et <code class="inline">t</code> seront dépilées à la sortie du bloc.' }
    ]
  });

  /* Diagramme pile pour l'allocation automatique d'un int */
  const autoZone = { id: 'pile', x: 10, y: 10, w: 270, h: 160, label: 'pile (stack)', kind: 'zone', fs: 16 };
  const autoI = (lbl, kind) => ({ id: 'i', x: 80, y: 70, w: 170, h: 50, label: lbl, kind: kind || 'cell', tag: 'i', fs: 18, tagFs: 20 });
  const autoAdr = { id: 'adr', x: 320, y: 65, w: 130, h: 60, label: '&i\n0x7F10', kind: 'plain', fs: 17 };
  const autoSize = { x: 165, y: 150, text: 'sizeof(X) octets', anchor: 'middle', fs: 15, cls: 'muted' };
  const autoDiagram = H.diagram({
    w: 460, h: 180, maxw: 380,
    code: `
      {
          X i;     // i est allouée dans la pile
          // &i : adresse dans la pile où
          //      sizeof(X) octets sont réservés
      } // sortie du bloc : dépilement
    `,
    common: { boxes: [autoZone] },
    steps: [
      { line: 1, note: 'Entrée dans le bloc : rien n’est encore réservé pour <code class="inline">i</code>.' },
      { line: 2, boxes: [autoI('X')], texts: [autoSize],
        note: '<code class="inline">X i;</code> : <code class="inline">sizeof(X)</code> octets sont réservés <b>automatiquement</b> dans la pile (<code class="inline">X</code> : un type quelconque, par exemple une classe).' },
      { line: [3, 4], boxes: [autoI('X'), autoAdr], arrows: [{ from: 'adr', to: 'i' }], texts: [autoSize],
        note: '<code class="inline">&amp;i</code> est l’adresse de cette zone de la pile (ici <code class="inline">0x7F10</code>, valeur d’exemple).' },
      { line: 5, boxes: [autoI('dépilé', 'ghost'), autoAdr], arrows: [{ from: 'adr', to: 'i', kind: 'bad' }],
        note: 'Sortie du bloc : <b>dépilement</b>. L’adresse <code class="inline">&amp;i</code> n’est plus réservée.' }
    ]
  });

  Course.chapter({
    id: 'alloc',
    num: 2,
    title: 'Allocation',
    icon: '🧠',
    color: '#0ea5e9',
    intro: 'Pile ou tas ? Où vivent nos variables, et combien de temps.',
    sections: ['Automatique & dynamique', 'Typage', 'auto', 'Initialisation = et {}', 'L’essentiel'],
    slides: [
      {
        title: 'Fil rouge : un vecteur en C',
        section: 'Automatique & dynamique',
        html: `
          <p>Point de départ en C, que l’on fera évoluer en C++ au fil des notions.</p>
          <div class="cols" style="grid-template-columns: 41fr 52fr 40fr; gap: 14px">
            <div class="col">${H.code(`#ifndef VECTOR_H
#define VECTOR_H

typedef struct {
    int *values;
    int size;
} Vector;

Vector *vector_create(int size);
void vector_destroy(Vector *v);
int vector_get(const Vector *v, int i);
void vector_set(Vector *v, int i, int x);
Vector *vector_add(Vector *a, Vector *b);

#endif`, { title: 'Vector.h', small: true })}</div>
            <div class="col">${H.code(`#include <stdlib.h>
#include "Vector.h"

Vector *vector_create(int size) {
    Vector *v = malloc(sizeof(Vector));
    v->values = malloc(size * sizeof(int));
    v->size = size;
    return v;
}
void vector_destroy(Vector *v) {
    free(v->values);
    free(v);
}
int vector_get(const Vector *v, int i) {
    return v->values[i];
}
void vector_set(Vector *v, int i, int x) {
    v->values[i] = x;
}
Vector *vector_add(Vector *a, Vector *b) {
    if (a->size != b->size) return NULL;
    Vector *r = vector_create(a->size);
    for (int i = 0; i < a->size; i++)
        r->values[i] = a->values[i] + b->values[i];
    return r;
}`, { title: 'Vector.c', small: true })}</div>
            <div class="col">${H.code(`#include <stdio.h>
#include "Vector.h"

int main(void) {
    Vector *a = vector_create(3);
    Vector *b = vector_create(3);
    for (int i = 0; i < 3; i++) {
        vector_set(a, i, i);
        vector_set(b, i, 10 * i);
    }
    Vector *c = vector_add(a, b);
    printf("%d\\n", vector_get(c, 2));
    vector_destroy(a);
    vector_destroy(b);
    vector_destroy(c);
    return 0;
}`, { title: 'main.c', small: true })}</div>
          </div>
        `
      },
      {
        title: 'Allocation automatique',
        section: 'Automatique & dynamique',
        html: `
          <p class="lead">L’allocation automatique se fait dans la <strong>pile</strong>.</p>
          ${autoDiagram}
          ${H.list([
            'La variable <code class="inline">i</code> est allouée <strong>automatiquement</strong> dans la pile.',
            '<code class="inline">&amp;i</code> correspond à une adresse de la pile à laquelle <code class="inline">sizeof(X)</code> octets sont réservés.',
            'À la <strong>sortie du bloc</strong> où <code class="inline">i</code> est déclarée, il y a dépilement : l’adresse <code class="inline">&amp;i</code> n’est plus réservée.'
          ], { frag: true })}
          ${H.java('<mark><b>Un objet</b></mark> n’est <b>jamais</b> dans la pile : seules les variables primitives et les références y sont. En C++, un objet peut vivre dans la pile, comme un <code class="inline">X</code>.')}`
      },
      {
        title: 'Allocation dynamique',
        section: 'Automatique & dynamique',
        html: `
          <p class="lead">L’allocation dynamique en C++ se fait avec l’opérateur <code class="inline">new</code>.
          On distingue l’allocation <strong>d’un objet</strong> et celle <strong>d’un tableau</strong> d’objets.</p>
          ${H.cols(
            H.frag(`${H.code(`new int`, { title: 'un objet' })}
             <p>Réserve <code class="inline">sizeof(int)</code> octets dans le <strong>tas</strong> ; <code class="inline">new</code> retourne l’adresse de début de cette zone, de type <code class="inline">int *</code>.</p>`),
            H.frag(`${H.code(`new int[10]`, { title: 'un tableau' })}
             <p>Réserve <code class="inline">sizeof(int)*10</code> octets dans le tas ; <code class="inline">new</code> retourne l’adresse de début de cette zone, de type <code class="inline">int *</code>.</p>`)
          )}
          ${H.frag(H.info('La valeur retournée par <code class="inline">new</code> est <strong>typée</strong> : <code class="inline">new T</code> et <code class="inline">new T[n]</code> retournent un <code class="inline">T *</code> (alors qu’en C, <code class="inline">malloc</code> retourne un <code class="inline">void *</code>).'))}
          ${H.frag(H.key('Ces zones mémoire restent réservées <strong>tant que l’on n’a pas demandé explicitement</strong> leur libération avec <code class="inline">delete</code>.'))}
          ${H.frag(H.java('<code class="inline">new</code> alloue aussi dans le tas, mais le <b>ramasse-miettes</b> libère la mémoire quand plus rien ne la référence. En C++, il n’y a pas de ramasse-miettes : chaque <code class="inline">new</code> doit avoir son <code class="inline">delete</code>.'))}`
      },
      {
        title: 'Allocation dynamique : libération',
        section: 'Automatique & dynamique',
        html: `
          ${H.table(['Allocation', 'Libération'], [
            ['T *p = new T', H.c('delete p;')],
            ['T *p = new T[n]', H.c('delete [] p;')]
          ])}
          ${H.cols(
            H.code(`
              delete (new int);
              // ou
              int *i = new int;
              delete i;
            `, { title: 'un objet' }),
            H.code(`
              delete [] (new int[10]);
              // ou
              int *p = new int[10];
              delete [] p;
            `, { title: 'un tableau' })
          )}
          ${H.frag(H.warn('Ne mélangez jamais les deux formes : ce qui est alloué avec <code class="inline">new T[]</code> se libère avec <code class="inline">delete[]</code>. Une fois <code class="inline">delete</code> appelé, la mémoire à cette adresse n’est plus réservée.') +
            H.info('En C++, on utilise <code class="inline">nullptr</code> au lieu de <code class="inline">NULL</code>. <code class="inline">NULL</code> est une constante qui n’est <strong>pas typée comme un pointeur</strong> : en C++, c’est un <strong>entier</strong> nul (<code class="inline">0</code>). Avec <code class="inline">f(int)</code> et <code class="inline">f(char *)</code>, l’appel <code class="inline">f(NULL)</code> est ambigu (erreur de g++ 11). <code class="inline">nullptr</code> (C++11) est un vrai <strong>pointeur</strong> nul : <code class="inline">f(nullptr)</code> appelle <code class="inline">f(char *)</code>.'))}`
      },
      {
        title: 'Allocation : ce qui se passe en mémoire',
        section: 'Automatique & dynamique',
        html: `
          <p>Avancez pas à pas (<kbd>→</kbd> ou les boutons) pour suivre la pile et le tas.</p>
          ${allocDiagram}`
      },
      {
        title: 'Utiliser un pointeur après <code>delete</code>',
        section: 'Automatique & dynamique',
        html: `
          <p>Après <code class="inline">delete i</code>, <code class="inline">i</code> contient toujours l’ancienne adresse. S’en servir est une erreur… que le compilateur ne voit pas.</p>
          ${H.cols(
            H.code(`
              int main() {
                  int *i = new int;
                  delete i;
                  *i = 2;  // zone libérée !
              }
            `, { title: 'uaf.cpp', mark: { 4: 'err' } }),
            `${H.tip('Compilez avec <code class="inline">-fsanitize=address</code> (AddressSanitizer) : le programme s’arrête sur la ligne fautive et indique où la mémoire a été libérée.', 'Outil')}`
          )}
          ${H.asan(`
            $ g++ -g -fsanitize=address uaf.cpp -o uaf && ./uaf
            ==149199==ERROR: AddressSanitizer: heap-use-after-free
                #0 in main uaf.cpp:4
            freed by thread T0 here:
                #1 in main uaf.cpp:3
            ...
            SUMMARY: AddressSanitizer: heap-use-after-free uaf.cpp:4 in main
          `)}`
      },
      {
        title: 'Fil rouge : de <code>malloc</code> à <code>new</code>',
        section: 'Automatique & dynamique',
        html: `
          <p><code class="inline">malloc</code> / <code class="inline">free</code> deviennent <code class="inline">new</code> / <code class="inline">delete</code> (<code class="inline">delete[]</code> pour un tableau), <code class="inline">NULL</code> devient <code class="inline">nullptr</code>.</p>
          <div class="cols" style="grid-template-columns: 41fr 52fr 40fr; gap: 14px">
            <div class="col">${H.code(`#ifndef VECTOR_HPP
#define VECTOR_HPP

typedef struct {
    int *values;
    int size;
} Vector;

Vector *vector_create(int size);
void vector_destroy(Vector *v);
int vector_get(const Vector *v, int i);
void vector_set(Vector *v, int i, int x);
Vector *vector_add(Vector *a, Vector *b);

#endif`, { title: 'Vector.hpp', small: true, hl: [1, 2] })}</div>
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
int vector_get(const Vector *v, int i) {
    return v->values[i];
}
void vector_set(Vector *v, int i, int x) {
    v->values[i] = x;
}
Vector *vector_add(Vector *a, Vector *b) {
    if (a->size != b->size) return nullptr;
    Vector *r = vector_create(a->size);
    for (int i = 0; i < a->size; i++)
        r->values[i] = a->values[i] + b->values[i];
    return r;
}`, { title: 'Vector.cpp', small: true, hl: [1, 4, 5, 10, 11, 20] })}</div>
            <div class="col">${H.code(`#include <stdio.h>
#include "Vector.hpp"

int main(void) {
    Vector *a = vector_create(3);
    Vector *b = vector_create(3);
    for (int i = 0; i < 3; i++) {
        vector_set(a, i, i);
        vector_set(b, i, 10 * i);
    }
    Vector *c = vector_add(a, b);
    printf("%d\\n", vector_get(c, 2));
    vector_destroy(a);
    vector_destroy(b);
    vector_destroy(c);
    return 0;
}`, { title: 'main.cpp', small: true, hl: [2] })}</div>
          </div>
        `
      },
      {
        title: 'Typage',
        section: 'Typage',
        html: `
          <p>Comme le C, le C++ dispose des types primitifs : ${['int', 'float', 'double', 'char', 'wchar_t', 'bool', 'void'].map(t => ['wchar_t', 'bool'].includes(t) ? '<code class="inline" style="box-shadow: 0 0 0 2px var(--err)">' + t + '</code>' : H.c(t)).join(' ')}.
          À chacun est associée une <strong>taille en octets</strong>.</p>
          <p style="color: var(--text-2)">Encadrés en rouge : les types propres au C++ (en C, ils viennent de <code class="inline">&lt;stdbool.h&gt;</code> et <code class="inline">&lt;stddef.h&gt;</code>).</p>
          <p>S’y ajoutent les <strong>pointeurs</strong> : ${H.c('type *')}.</p>
          ${H.key('Quel que soit <code class="inline">type</code> <sup>(*)</sup>, un pointeur fait toujours la même taille : <strong>4 octets en 32 bits</strong> et <strong>8 octets en 64 bits</strong>.')}
          ${H.info('Toute variable doit être typée. Le type indique <b>le nombre d’octets réservés</b> (dans la pile ou le segment de données) et <b>l’interprétation</b> associée à ces octets.')}
          <p style="font-size: .8em; font-style: italic; color: var(--text-2)">(*) Sauf pour les pointeurs de méthode, une notion avancée qui n’est pas abordée dans ce cours (16 octets avec g++ en 64 bits).</p>`
      },
      {
        title: 'Le mot-clé <code>auto</code>',
        section: 'auto',
        html: `
          <p>La norme <strong>C++11</strong> donne un nouveau sens au mot-clé ${H.c('auto')} :
          il déclenche une <em class="term">inférence de type statique</em> (à la compilation) à partir de la valeur affectée à la déclaration.</p>
          ${H.code(`
            auto i = 0;        // i est de type int
            auto d = 10.0;     // d est de type double
            auto f = 2.0f;     // f est de type float
            auto s = "hello";  // s est de type const char *
          `)}`
      },
      {
        title: '<code>auto</code> et valeurs de retour',
        section: 'auto',
        html: `
          ${H.cols(
            `<p>Cela fonctionne aussi avec le type de retour d’une fonction :</p>
             ${H.code(`
               int f();
               auto i = f();          // i est de type int
               auto t = new int[10];  // t est de type int *
             `, { title: 'fonction' })}`,
            `<p>Et avec les tableaux :</p>
             ${H.code(`
               auto s = "hello"; // s est de type const char *
               auto c = s[0];    // c est de type char
                                 // et non const char !
             `, { title: 'tableau' })}`
          )}
          ${H.info('On reviendra plus tard sur <code class="inline">auto</code>.')}`
      },
      {
        title: 'Fil rouge : <code>auto</code>',
        section: 'auto',
        html: `
          <p>Le type de <code class="inline">r</code> et de <code class="inline">c</code> est déduit de la valeur de retour de la fonction (<code class="inline">Vector *</code>).</p>
          <div class="cols" style="grid-template-columns: 41fr 52fr 40fr; gap: 14px">
            <div class="col">${H.code(`#ifndef VECTOR_HPP
#define VECTOR_HPP

typedef struct {
    int *values;
    int size;
} Vector;

Vector *vector_create(int size);
void vector_destroy(Vector *v);
int vector_get(const Vector *v, int i);
void vector_set(Vector *v, int i, int x);
Vector *vector_add(Vector *a, Vector *b);

#endif`, { title: 'Vector.hpp', small: true })}</div>
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
int vector_get(const Vector *v, int i) {
    return v->values[i];
}
void vector_set(Vector *v, int i, int x) {
    v->values[i] = x;
}
Vector *vector_add(Vector *a, Vector *b) {
    if (a->size != b->size) return nullptr;
    auto r = vector_create(a->size);
    for (int i = 0; i < a->size; i++)
        r->values[i] = a->values[i] + b->values[i];
    return r;
}`, { title: 'Vector.cpp', small: true, hl: [21] })}</div>
            <div class="col">${H.code(`#include <stdio.h>
#include "Vector.hpp"

int main(void) {
    Vector *a = vector_create(3);
    Vector *b = vector_create(3);
    for (int i = 0; i < 3; i++) {
        vector_set(a, i, i);
        vector_set(b, i, 10 * i);
    }
    auto c = vector_add(a, b);
    printf("%d\\n", vector_get(c, 2));
    vector_destroy(a);
    vector_destroy(b);
    vector_destroy(c);
    return 0;
}`, { title: 'main.cpp', small: true, hl: [11] })}</div>
          </div>
        `
      },
      {
        title: 'Initialisation avec <code>=</code>',
        section: 'Initialisation = et {}',
        html: `
          <p>Lors de la déclaration d’une variable, on utilise <code class="inline">=</code> pour l’initialiser :</p>
          ${H.code(`
            int i = 0;
            int j = 12.2;   // j vaut 12
            char c = 'd';   // c vaut 100
            char d = 35.0;  // d vaut 35
            char e = 35.8;  // e vaut 35
            float f = 2.5;  // f vaut 2.5
          `)}
          ${H.warn('L’utilisation du <code class="inline">=</code> repose sur des mécanismes de <strong>conversion</strong> implicites… et silencieuses : <code class="inline">12.2</code> devient <code class="inline">12</code> sans prévenir.')}`
      },
      {
        title: 'Initialisation avec <code>{}</code>',
        section: 'Initialisation = et {}',
        html: `
          <p>Il est possible d’utiliser ${H.c('{}')} pour l’initialisation :</p>
          ${H.code(`
            int i{0};
            int j{12.2};    // ERREUR
            char c{'d'};    // c vaut 100
            char d{35.0};   // ERREUR
            float f{2.5};   // f vaut 2.5
            double x{3.0};
            float y{x};     // interdit par la norme ; g++ : warning
          `, { mark: { 2: 'err', 4: 'err', 7: 'warn' } })}
          ${H.warn('<code class="inline">float y{x};</code> est une conversion avec perte : la norme l’interdit. Pourtant g++ 11 n’émet qu’un <b>warning</b> (<code class="inline">-Wnarrowing</code>) quand la valeur n’est pas une constante, et une erreur sinon. Ne l’ignorez pas.')}
          ${H.info('Les <code class="inline">{}</code> impliquent un <strong>contrôle d’imbrication</strong> (pas de conversion avec perte) : un <code class="inline">float</code> peut être contenu dans un <code class="inline">double</code>, mais pas l’inverse.')}`
      },
      {
        title: '<code>=</code> ou <code>{}</code> ?',
        section: 'Initialisation = et {}',
        layout: 'center',
        html: `
          ${H.table(['Syntaxe', 'Conversions avec perte', 'Sécurité'], [
            ['int j = 12.2;', 'acceptées en silence', '<span class="no">faible</span>'],
            ['int j{12.2};', 'refusées à la compilation', '<span class="yes">forte</span>']
          ])}
          ${H.key('<code class="inline">{}</code> pour l’initialisation d’une variable est plus <strong>« sécurisé »</strong> que <code class="inline">=</code>.')}
          <p class="muted">Nous verrons d’autres usages de <code class="inline">{}</code> par la suite.</p>`
      },
      {
        title: 'L’essentiel',
        section: 'L’essentiel',
        html: `
          ${H.cols(
            `${H.list([
              'Variable locale → <b>pile</b>, libérée automatiquement à la sortie du bloc.',
              '<code class="inline">new</code> → <b>tas</b>, réservé jusqu’au <code class="inline">delete</code>.',
              '<code class="inline">new T[n]</code> ↔ <code class="inline">delete [] p</code> — jamais l’un sans l’autre.',
              'Préférez <code class="inline">{}</code> à <code class="inline">=</code> pour initialiser : pas de conversion avec perte.'
            ])}`,
            `${H.quiz({
              q: 'Dans <code class="inline">{ int *p = new int; }</code>, que devient l’entier alloué à la sortie du bloc ?',
              options: ['Il est libéré avec <code class="inline">p</code>', 'Il reste réservé : fuite mémoire', 'Le ramasse-miettes le libère'],
              answer: 1,
              explain: '<p>Seul le pointeur <code class="inline">p</code> (dans la pile) disparaît. L’entier du tas reste réservé et n’est plus accessible : c’est une <b>fuite mémoire</b>.</p>'
            })}`
          )}`
      }
    ]
  });
})();
