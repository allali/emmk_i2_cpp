/* Opérateurs : récapitulatif animé du fil rouge Vector (C → C++).
 * Les versions sont celles des diapos « Fil rouge : … » (Allocation, Classes, Opérateurs). */
Course.chapter({
  id: 'operateurs',
  sections: ['Fil rouge'],
  slides: [
    {
      title: 'Fil rouge : de C à C++, récapitulatif',
      section: 'Fil rouge',
      group: 'vector',
      html: `${H.widget('code-morph', {
        cols: '42fr 54fr 38fr',
        versions: [
        { note: 'Point de départ : le vecteur écrit en C.',
          files: [
            { name: 'Vector.h', code: `#ifndef VECTOR_H
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

#endif` },
            { name: 'Vector.c', code: `#include <stdlib.h>
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
}` },
            { name: 'main.c', code: `#include <stdio.h>
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
}` }
          ] },
        { note: '<code class="inline">malloc</code> / <code class="inline">free</code> → <code class="inline">new</code> / <code class="inline">delete</code>, <code class="inline">NULL</code> → <code class="inline">nullptr</code> ; fichiers C++.',
          files: [
            { name: 'Vector.hpp', code: `#ifndef VECTOR_HPP
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

#endif` },
            { name: 'Vector.cpp', code: `#include "Vector.hpp"

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
}` },
            { name: 'main.cpp', code: `#include <stdio.h>
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
}` }
          ] },
        { note: '<code class="inline">auto</code> : le type de <code class="inline">r</code> et de <code class="inline">c</code> est déduit.',
          files: [
            { name: 'Vector.hpp', code: `#ifndef VECTOR_HPP
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

#endif` },
            { name: 'Vector.cpp', code: `#include "Vector.hpp"

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
}` },
            { name: 'main.cpp', code: `#include <stdio.h>
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
}` }
          ] },
        { note: '<code class="inline">struct</code> sans <code class="inline">typedef</code> : le nom de la structure est un type.',
          files: [
            { name: 'Vector.hpp', code: `#ifndef VECTOR_HPP
#define VECTOR_HPP

struct Vector {
    int *values;
    int size;
};

Vector *vector_create(int size);
void vector_destroy(Vector *v);
int vector_get(const Vector *v, int i);
void vector_set(Vector *v, int i, int x);
Vector *vector_add(Vector *a, Vector *b);

#endif` },
            { name: 'Vector.cpp', code: `#include "Vector.hpp"

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
}` },
            { name: 'main.cpp', code: `#include <stdio.h>
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
}` }
          ] },
        { note: 'Les fonctions deviennent des méthodes : <code class="inline">Vector *v</code> devient <code class="inline">this</code> (implicite).',
          files: [
            { name: 'Vector.hpp', code: `#ifndef VECTOR_HPP
#define VECTOR_HPP

struct Vector {
    int *values;
    int size;

    int get(int i);
    void set(int i, int x);
    Vector *add(Vector *b);
};

Vector *vector_create(int size);
void vector_destroy(Vector *v);

#endif` },
            { name: 'Vector.cpp', code: `#include "Vector.hpp"

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
int Vector::get(int i) {
    return values[i];
}
void Vector::set(int i, int x) {
    values[i] = x;
}
Vector *Vector::add(Vector *b) {
    if (size != b->size) return nullptr;
    auto r = vector_create(size);
    for (int i = 0; i < size; i++)
        r->values[i] = values[i] + b->values[i];
    return r;
}` },
            { name: 'main.cpp', code: `#include <stdio.h>
#include "Vector.hpp"

int main(void) {
    Vector *a = vector_create(3);
    Vector *b = vector_create(3);
    for (int i = 0; i < 3; i++) {
        a->set(i, i);
        b->set(i, 10 * i);
    }
    auto c = a->add(b);
    printf("%d\\n", c->get(2));
    vector_destroy(a);
    vector_destroy(b);
    vector_destroy(c);
    return 0;
}` }
          ] },
        { note: 'Méthodes <code class="inline">const</code> et passage de <code class="inline">b</code> par référence constante.',
          files: [
            { name: 'Vector.hpp', code: `#ifndef VECTOR_HPP
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

#endif` },
            { name: 'Vector.cpp', code: `#include "Vector.hpp"

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
}` },
            { name: 'main.cpp', code: `#include <stdio.h>
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
}` }
          ] },
        { note: 'Le constructeur remplace <code class="inline">vector_create</code>.',
          files: [
            { name: 'Vector.hpp', code: `#ifndef VECTOR_HPP
#define VECTOR_HPP

struct Vector {
    int *values;
    int size;

    Vector(int size);
    int get(int i) const;
    void set(int i, int x);
    Vector *add(const Vector &b) const;
};

void vector_destroy(Vector *v);

#endif` },
            { name: 'Vector.cpp', code: `#include "Vector.hpp"

Vector::Vector(int size)
    : values(new int[size]), size(size) {
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
    auto r = new Vector(size);
    for (int i = 0; i < size; i++)
        r->values[i] = values[i] + b.values[i];
    return r;
}` },
            { name: 'main.cpp', code: `#include <stdio.h>
#include "Vector.hpp"

int main(void) {
    Vector *a = new Vector(3);
    Vector *b = new Vector(3);
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
}` }
          ] },
        { note: 'Le destructeur remplace <code class="inline">vector_destroy</code> ; <code class="inline">class</code> et attributs privés ; instances automatiques.',
          files: [
            { name: 'Vector.hpp', code: `#ifndef VECTOR_HPP
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

#endif` },
            { name: 'Vector.cpp', code: `#include "Vector.hpp"

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
}` },
            { name: 'main.cpp', code: `#include <stdio.h>
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
}` }
          ] },
        { note: 'Constructeur par recopie : <code class="inline">d</code> a son propre tableau.',
          files: [
            { name: 'Vector.hpp', code: `#ifndef VECTOR_HPP
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

#endif` },
            { name: 'Vector.cpp', code: `#include "Vector.hpp"

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
}` },
            { name: 'main.cpp', code: `#include <stdio.h>
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
}` }
          ] },
        { note: '<code class="inline">add</code> devient <code class="inline">operator+</code>, résultat renvoyé par valeur.',
          files: [
            { name: 'Vector.hpp', code: `#ifndef VECTOR_HPP
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
    Vector operator+(const Vector &b) const;
};

#endif` },
            { name: 'Vector.cpp', code: `#include <assert.h>
#include "Vector.hpp"

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
Vector Vector::operator+(const Vector &b) const {
    assert(size == b.size);
    Vector r(size);
    for (int i = 0; i < size; i++)
        r.values[i] = values[i] + b.values[i];
    return r;
}` },
            { name: 'main.cpp', code: `#include <stdio.h>
#include "Vector.hpp"

int main(void) {
    Vector a(3);
    Vector b(3);
    for (int i = 0; i < 3; i++) {
        a.set(i, i);
        b.set(i, 10 * i);
    }
    Vector d = a;   // recopie
    Vector c = a + b;
    printf("%d\\n", c.get(2));
    return 0;
}` }
          ] },
        { note: '<code class="inline">operator=</code> : affectation avec copie profonde.',
          files: [
            { name: 'Vector.hpp', code: `#ifndef VECTOR_HPP
#define VECTOR_HPP

class Vector {
    int *values;
    int size;

public:
    Vector(int size);
    Vector(const Vector &v);
    Vector &operator=(const Vector &v);
    ~Vector();
    int get(int i) const;
    void set(int i, int x);
    Vector operator+(const Vector &b) const;
};

#endif` },
            { name: 'Vector.cpp', code: `#include <assert.h>
#include "Vector.hpp"
Vector::Vector(int size)
    : values(new int[size]), size(size) {
}
Vector::Vector(const Vector &v)
    : values(new int[v.size]), size(v.size) {
    for (int i = 0; i < size; i++) values[i] = v.values[i];
}
Vector &Vector::operator=(const Vector &v) {
    if (this == &v) return *this;
    delete[] values;
    values = new int[v.size];
    size = v.size;
    for (int i = 0; i < size; i++) values[i] = v.values[i];
    return *this;
}
Vector::~Vector() { delete[] values; }
int Vector::get(int i) const { return values[i]; }
void Vector::set(int i, int x) { values[i] = x; }
Vector Vector::operator+(const Vector &b) const {
    assert(size == b.size);
    Vector r(size);
    for (int i = 0; i < size; i++)
        r.values[i] = values[i] + b.values[i];
    return r;
}` },
            { name: 'main.cpp', code: `#include <stdio.h>
#include "Vector.hpp"

int main(void) {
    Vector a(3);
    Vector b(3);
    for (int i = 0; i < 3; i++) {
        a.set(i, i);
        b.set(i, 10 * i);
    }
    Vector d = a;   // recopie
    Vector c = a + b;
    d = c;          // affectation
    printf("%d\\n", d.get(2));
    return 0;
}` }
          ] }
        ]
      })}`
    }
  ]
});
