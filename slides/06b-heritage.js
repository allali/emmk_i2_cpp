(function () {
  /* ---------- Schémas de vtable ---------- */
  const stack = { id: 'pile', x: 15, y: 25, w: 160, h: 250, label: 'pile', kind: 'zone' };
  const code = { id: 'code', x: 225, y: 25, w: 405, h: 250, label: 'code et static', kind: 'zone' };
  /* vptr : pointeur caché, un par instance ; vtable : table des fonctions virtuelles, une par classe */
  function vtDiagrams() {
    const bCell = { id: 'b', x: 75, y: 85, w: 85, h: 34, label: 'vptr', tag: 'b' };
    const fCell = (tag) => ({ id: 'f', x: 75, y: 185, w: 85, h: 34, label: 'vptr', tag: tag || 'f' });
    const tBase = { id: 'TB', x: 245, y: 60, w: 140, h: 80, label: 'vtable Base', kind: 'cls', fs: 13 };
    const eBase = { id: 'tb', x: 260, y: 92, w: 110, h: 32, label: 'toString', fs: 13 };
    const tF = { id: 'TF', x: 245, y: 165, w: 140, h: 80, label: 'vtable F', kind: 'cls', fs: 13 };
    const eF = (k) => ({ id: 'tf', x: 260, y: 197, w: 110, h: 32, label: 'toString', fs: 13, kind: k });
    const fnB = (k) => ({ id: 'fb', x: 440, y: 91, w: 170, h: 34, label: 'Base::toString()', kind: k || 'obj', fs: 13 });
    const fnF = (k) => ({ id: 'ff', x: 440, y: 196, w: 170, h: 34, label: 'F::toString()', kind: k || 'obj', fs: 13 });
    // schéma de la diapo « Suivre un appel virtuel » : le code y utilise la classe Fille
    const tFille = Object.assign({}, tF, { label: 'vtable Fille' });
    const fnFille = (k) => Object.assign(fnF(k), { label: 'Fille::toString()' });

    const vtableDiagram = H.diagram({
      w: 640, h: 290,
      code: `
        class Base {
        public:
            virtual std::string toString() const {
                return "Base";
            }
        };
        class F : public Base {
        public:
        };

        Base b;
        F f;
      `,
      codeTitle: 'vtable.cpp',
      common: { boxes: [stack, code] },
      steps: [
        { line: 12, boxes: [bCell, tBase, eBase, fnB()], arrows: [{ from: 'b', to: 'TB' }, { from: 'tb', to: 'fb' }],
          note: 'La classe <code class="inline">Base</code> possède <b>une</b> table des fonctions virtuelles, sa <b>vtable</b> (stockée avec le code). L’instance <code class="inline">b</code> ne contient qu’un <b>pointeur caché</b> vers cette table : son <b>vptr</b>.' },
        { line: 13, boxes: [bCell, fCell(), tBase, eBase, tF, eF(), fnB()],
          arrows: [{ from: 'b', to: 'TB' }, { from: 'tb', to: 'fb' }, { from: 'f', to: 'TF' }, { from: 'tf', to: 'fb', bend: -30 }],
          note: 'Une vtable est créée pour la classe <code class="inline">F</code>, initialement construite par <b>« recopie »</b> de celle de <code class="inline">Base</code> : <code class="inline">toString</code> pointe encore vers <code class="inline">Base::toString()</code>. Les constructeurs initialisent le <b>vptr</b> (l’attribut caché) pour qu’il pointe vers la vtable du type de l’instance.' }
      ]
    });

    const redefDiagram = H.diagram({
      w: 640, h: 290,
      code: `
        class F : public Base {
        public:
            virtual std::string toString() const {
                return "Fille";
            }
        };

        Base b;
        F f;
      `,
      codeTitle: 'redefinition.cpp',
      common: { boxes: [stack, code] },
      steps: [
        { line: [8, 9], boxes: [bCell, fCell(), tBase, eBase, tF, eF(), fnB()],
          arrows: [{ from: 'b', to: 'TB' }, { from: 'tb', to: 'fb' }, { from: 'f', to: 'TF' }, { from: 'tf', to: 'fb', bend: -30 }],
          note: 'Point de départ : la vtable de <code class="inline">F</code> est une copie de celle de <code class="inline">Base</code>…' },
        { line: [3, 4, 5], boxes: [bCell, fCell(), tBase, eBase, tF, eF('heap'), fnB(), fnF('heap')],
          arrows: [{ from: 'b', to: 'TB' }, { from: 'tb', to: 'fb' }, { from: 'f', to: 'TF' }, { from: 'tf', to: 'ff' }],
          note: '…mais <code class="inline">F</code> <b>redéfinit</b> <code class="inline">toString</code> (même nom, mêmes arguments) : l’entrée correspondante de la vtable de <code class="inline">F</code> est modifiée. Le code des méthodes ne change pas, c’est <b>la façon de les appeler</b> qui change.' }
      ]
    });

    const callDiagram = H.diagram({
      w: 640, h: 290,
      code: `
        Fille f;
        Base &r = f;

        r.toString();
        // ≡ r.vptr["toString"]();
      `,
      codeTitle: 'appel.cpp',
      common: { boxes: [stack, code] },
      steps: [
        { line: [1, 2], boxes: [fCell('f / r'), tFille, eF(), tBase, eBase, fnB()],
          arrows: [{ from: 'f', to: 'TF' }, { from: 'tf', to: 'fb', bend: -30 }, { from: 'tb', to: 'fb' }],
          note: '<b>Cas 1 :</b> <code class="inline">toString</code> n’est <b>pas</b> redéfinie dans <code class="inline">Fille</code>. <code class="inline">r</code> est une référence de type <code class="inline">Base&amp;</code> sur une instance de <code class="inline">Fille</code>.' },
        { line: [4, 5], boxes: [fCell('f / r'), tFille, eF('err'), tBase, eBase, fnB('heap')],
          arrows: [{ from: 'f', to: 'TF', kind: 'bad' }, { from: 'tf', to: 'fb', bend: -30, kind: 'bad' }, { from: 'tb', to: 'fb' }],
          note: 'L’appel suit le <b>vptr</b> de l’<b>instance</b> jusqu’à la vtable de <code class="inline">Fille</code>, puis l’entrée <code class="inline">toString</code> : c’est <code class="inline">Base::toString()</code> qui est appelée, car la méthode n’a pas été redéfinie.' },
        { line: [1, 2], boxes: [fCell('f / r'), tFille, eF(), tBase, eBase, fnB(), fnFille()],
          arrows: [{ from: 'f', to: 'TF' }, { from: 'tf', to: 'ff' }, { from: 'tb', to: 'fb' }],
          note: '<b>Cas 2 :</b> <code class="inline">toString</code> <b>est</b> redéfinie dans <code class="inline">Fille</code> : l’entrée de la vtable de <code class="inline">Fille</code> pointe vers <code class="inline">Fille::toString()</code>.' },
        { line: [4, 5], boxes: [fCell('f / r'), tFille, eF('err'), tBase, eBase, fnB(), fnFille('heap')],
          arrows: [{ from: 'f', to: 'TF', kind: 'bad' }, { from: 'tf', to: 'ff', kind: 'bad' }, { from: 'tb', to: 'fb' }],
          note: 'Le même appel <code class="inline">r.toString()</code> exécute maintenant <code class="inline">Fille::toString()</code> : c’est le <b>type réel de l’instance</b> qui compte, pas celui de la variable. C’est le polymorphisme !' }
      ]
    });
    return { vtableDiagram, redefDiagram, callDiagram };
  }
  const { vtableDiagram, redefDiagram, callDiagram } = vtDiagrams();

  /* ---------- Héritage multiple ---------- */
  const cls = (id, x, y, w) => ({ id, x, y, w: w || 70, h: 44, label: id, kind: 'cls', fs: 15, rx: 4 });
  const clsC = { id: 'C', x: 140, y: 200, w: 70, h: 44, label: 'C', fs: 15 };
  const multiDiagram = H.diagram({
    w: 600, h: 280, maxw: 680,
    common: {
      boxes: [{ id: 'I1', x: 30, y: 30, w: 70, h: 44, label: 'I1', fs: 15 }, { id: 'B', x: 140, y: 30, w: 70, h: 44, label: 'B', fs: 15 },
        { id: 'I2', x: 250, y: 30, w: 70, h: 44, label: 'I2', fs: 15 }, clsC],
      arrows: [{ from: 'C', to: 'I1', kind: 'inherit' }, { from: 'C', to: 'B', kind: 'inherit' }, { from: 'C', to: 'I2', kind: 'inherit' }]
    },
    steps: [
      { note: 'Le diagramme de classes : <code class="inline">C</code> hérite de trois classes de base.' },
      { boxes: [{ id: 'mem', x: 390, y: 15, w: 190, h: 255, label: 'instance de C', kind: 'zone', fs: 13 },
        { id: 'mB', x: 410, y: 50, w: 150, h: 50, label: 'partie B', kind: 'obj', fs: 13 },
        { id: 'mI1', x: 410, y: 110, w: 150, h: 50, label: 'partie I1', kind: 'obj', fs: 13 },
        { id: 'mI2', x: 410, y: 170, w: 150, h: 50, label: 'partie I2', kind: 'obj', fs: 13 },
        { id: 'mC', x: 410, y: 228, w: 150, h: 32, label: 'attributs de C', kind: 'heap', fs: 12 }],
        note: 'En mémoire, une instance de <code class="inline">C</code> contient bout à bout une partie <code class="inline">B</code>, une partie <code class="inline">I1</code>, une partie <code class="inline">I2</code>, puis ses propres attributs.' }
    ]
  });

  const diamondDiagram = H.diagram({
    w: 600, h: 280,
    common: {
      boxes: [{ id: 'I', x: 140, y: 20, w: 70, h: 44, label: 'I', fs: 15 }, { id: 'I1', x: 30, y: 115, w: 70, h: 44, label: 'I1', fs: 15 },
        { id: 'I2', x: 250, y: 115, w: 70, h: 44, label: 'I2', fs: 15 }, { id: 'C', x: 140, y: 215, w: 70, h: 44, label: 'C', fs: 15 }],
      arrows: [{ from: 'I1', to: 'I', kind: 'inherit' }, { from: 'I2', to: 'I', kind: 'inherit' },
        { from: 'C', to: 'I1', kind: 'inherit' }, { from: 'C', to: 'I2', kind: 'inherit' }]
    },
    steps: [
      { note: 'Héritage « en losange » : <code class="inline">I1</code> et <code class="inline">I2</code> héritent tous deux de <code class="inline">I</code>.' },
      { boxes: [{ id: 'mem', x: 380, y: 10, w: 200, h: 262, label: 'instance de C', kind: 'zone', fs: 13 },
        { id: 'p1', x: 395, y: 40, w: 170, h: 105, label: 'I1', kind: 'cls', fs: 13 },
        { id: 'p1i', x: 410, y: 72, w: 140, h: 34, label: 'I : _value', kind: 'err', fs: 13 },
        { id: 'p2', x: 395, y: 155, w: 170, h: 105, label: 'I2', kind: 'cls', fs: 13 },
        { id: 'p2i', x: 410, y: 187, w: 140, h: 34, label: 'I : _value', kind: 'err', fs: 13 }],
        note: 'Sans précaution, une instance de <code class="inline">C</code> contient <b>deux</b> instances de <code class="inline">I</code>, donc <b>deux</b> attributs <code class="inline">_value</code> !' }
    ]
  });

  const vbox = (id, x, y) => ({ id, x, y, w: 64, h: 40, label: id, fs: 14 });
  const virtualDiagram = H.diagram({
    w: 720, h: 290, maxw: 820,
    common: {
      boxes: [vbox('I', 150, 15), vbox('I1', 30, 110), vbox('I2', 150, 110), vbox('I3', 270, 110), vbox('C', 70, 225), vbox('D', 230, 225)],
      arrows: [{ from: 'I1', to: 'I', kind: 'inherit' }, { from: 'I2', to: 'I', kind: 'inherit' },
        { from: 'I3', to: 'I', kind: 'inherit' }, { from: 'C', to: 'I1', kind: 'inherit' }, { from: 'C', to: 'I2', kind: 'inherit' },
        { from: 'D', to: 'I1', kind: 'inherit' }, { from: 'D', to: 'I3', kind: 'inherit' }],
      texts: [{ x: 70, y: 78, text: 'virtual', fs: 12, cls: 'muted' }, { x: 188, y: 88, text: 'virtual', fs: 12, cls: 'muted' }]
    },
    steps: [
      { note: '<code class="inline">I1</code> et <code class="inline">I2</code> héritent <b>virtuellement</b> de <code class="inline">I</code> ; <code class="inline">I3</code> en hérite normalement.' },
      { boxes: [{ id: 'mc', x: 380, y: 10, w: 150, h: 270, label: 'instance de C', kind: 'zone', fs: 12 },
        { id: 'ci', x: 395, y: 40, w: 120, h: 40, label: 'I (partagé)', kind: 'heap', fs: 12 },
        { id: 'c1', x: 395, y: 95, w: 120, h: 40, label: 'I1', kind: 'obj', fs: 13 },
        { id: 'c2', x: 395, y: 150, w: 120, h: 40, label: 'I2', kind: 'obj', fs: 13 },
        { id: 'md', x: 550, y: 10, w: 160, h: 270, label: 'instance de D', kind: 'zone', fs: 12 },
        { id: 'd1', x: 562, y: 38, w: 136, h: 110, label: 'I1', kind: 'cls', fs: 12 },
        { id: 'd1i', x: 575, y: 68, w: 110, h: 34, label: 'I', kind: 'err', fs: 12 },
        { id: 'd3', x: 562, y: 158, w: 136, h: 110, label: 'I3', kind: 'cls', fs: 12 },
        { id: 'd3i', x: 575, y: 188, w: 110, h: 34, label: 'I', kind: 'err', fs: 12 }],
        note: '<code class="inline">C</code> ne contient <b>qu’un seul</b> <code class="inline">I</code>, partagé par <code class="inline">I1</code> et <code class="inline">I2</code>. <code class="inline">D</code> en contient <b>deux</b> : <code class="inline">I3</code> n’a pas accepté de partager.' }
    ]
  });

  // diagramme de classes de la diapo « Héritage virtuel : lever les ambiguïtés »
  const vbox2 = (id, x, y, kind) => ({ id, x, y, w: 64, h: 40, label: id, fs: 17, kind });
  const ambigDiagram = H.diagram({
    w: 480, h: 280, maxw: 520,
    common: {
      boxes: [vbox2('I', 208, 12), vbox2('I3', 40, 118), vbox2('I1', 208, 118), vbox2('I2', 376, 118),
        vbox2('D', 110, 228), vbox2('E', 208, 228), vbox2('C', 306, 228)],
      arrows: [{ from: 'I1', to: 'I', kind: 'inherit' }, { from: 'I2', to: 'I', kind: 'inherit' }, { from: 'I3', to: 'I', kind: 'inherit' },
        { from: 'D', to: 'I3', kind: 'inherit' }, { from: 'D', to: 'I1', kind: 'inherit' },
        { from: 'C', to: 'I1', kind: 'inherit' }, { from: 'C', to: 'I2', kind: 'inherit' },
        { from: 'E', to: 'I1', kind: 'inherit' }, { from: 'E', to: 'I', kind: 'inherit', bend: -120 }],
      texts: [{ x: 280, y: 38, text: 'm() = 0', fs: 15 }, { x: 280, y: 144, text: 'm()', fs: 15 }, { x: 40, y: 178, text: 'm()', fs: 15 },
        { x: 246, y: 92, text: 'virtual', fs: 14, cls: 'muted' }, { x: 340, y: 72, text: 'virtual', fs: 14, cls: 'muted' }]
    },
    steps: [{ note: 'À côté de chaque classe : la méthode <code class="inline">m</code> qu’elle définit.' }]
  });

  Course.chapter({
    id: 'heritage',
    sections: ['Polymorphisme & vtable', 'Virtuelle pure & redéfinition', 'Résolution des appels', 'Classes abstraites', 'Héritage multiple'],
    slides: [
      /* ============ Polymorphisme & vtable ============ */
      {
        title: 'Héritage et polymorphisme',
        section: 'Polymorphisme & vtable',
        html: `
          <p class="lead">Jusqu’à présent, l’héritage permet la <strong>factorisation de code</strong>, mais pas le <strong>polymorphisme</strong>.</p>
          ${H.key('Pour qu’il y ait polymorphisme, la méthode appelée sur une instance doit être celle du <b>type réel de l’instance</b>, et non celle du <b>type de la variable</b> qui la manipule.')}
          ${H.list([
            'Il faut donc utiliser <strong>l’instance elle-même</strong> pour connaître son type.',
            'C’est implanté grâce à un <em class="term">attribut caché</em> de chaque instance, appelé <code class="inline">vptr</code> (<i>virtual pointer</i>).',
            'C’est un <strong>pointeur</strong> vers la <code class="inline">vtable</code> (<i>virtual table</i>) de sa classe : une table référençant toutes les méthodes pour lesquelles le polymorphisme doit être mis en œuvre.'
          ], { frag: true })}
          <p style="font-size: .8em; font-style: italic; color: var(--text-2)"><code class="inline">vptr</code> et <code class="inline">vtable</code> sont les noms usuels de ce mécanisme chez les compilateurs (g++, clang++, MSVC) : la norme C++ n’impose pas cette implémentation.</p>`
      },
      {
        title: 'Le mot-clé <code>virtual</code>',
        section: 'Polymorphisme & vtable',
        html: `
          <p>Il faut d’abord indiquer quelles méthodes sont <em class="term">virtuelles</em>, c’est-à-dire pour lesquelles on veut du polymorphisme :</p>
          ${H.code(`
            class Base {
            public:
                virtual std::string toString() const {
                    return "Base";
                }
            };
          `, { hl: [3] })}
          ${H.cols(
            H.info('Ceci crée une <b>table associée à la classe</b> <code class="inline">Base</code>, sa <b>vtable</b> : une table de <b>pointeurs de fonctions</b>, les méthodes virtuelles.'),
            H.warn('Le <b>vptr</b> (pointeur caché vers la vtable) fait « grossir » les instances : ici on passe de <b>1 octet</b> (classe vide) à <b>4 octets</b> sur une machine 32 bits (8 en 64 bits) — la taille d’un pointeur.')
          )}`
      },
      {
        title: 'La vtable en mémoire',
        section: 'Polymorphisme & vtable',
        html: `
          <p>Avancez pas à pas : une <b>vtable</b> par <b>classe</b>, un pointeur caché, le <b>vptr</b>, par <b>instance</b>.</p>
          ${vtableDiagram}`
      },
      {
        title: 'Question : une vtable par instance ?',
        section: 'Polymorphisme & vtable',
        layout: 'center',
        html: `
          ${H.quiz({
            q: 'Chaque instance d’une classe ayant des méthodes virtuelles possède une table des méthodes virtuelles ?',
            options: ['Vrai', 'Faux'],
            answer: 1,
            explain: '<p><strong>Faux.</strong> La table est associée à la <b>classe</b> (elle est unique et stockée avec le code). Chaque instance ne possède qu’un <b>pointeur caché</b>, son <b>vptr</b>, vers la vtable de sa classe.</p>'
          })}`
      },
      {
        title: 'Redéfinition et vtable',
        section: 'Polymorphisme & vtable',
        html: `
          <p>Cas où l’on <strong>redéfinit</strong> la méthode dans la classe <code class="inline">F</code> :</p>
          ${redefDiagram}`
      },
      {
        title: 'Appel d’une méthode virtuelle',
        section: 'Polymorphisme & vtable',
        html: `
          ${H.cols(
            H.code(`
              Fille f;
              Base &r = f;

              r.toString();
            `),
            `<p>Le compilateur commence par chercher la méthode dans la classe correspondant au <b>type de la variable</b> (ici <code class="inline">Base</code>). Une fois trouvée, deux possibilités :</p>`
          )}
          ${H.cols(
            `<div class="card"><h4>❌ Non virtuelle</h4><p>C’est la méthode du <b>type de la variable</b> qui est appelée : <code class="inline">Base::toString</code>. Résolution à la compilation.</p></div>`,
            `<div class="card"><h4>✅ Virtuelle</h4><p>C’est la méthode dont l’adresse est dans la <b>vtable</b> pointée par le <b>vptr de l’instance</b> qui est appelée : cela dépend de si elle a été redéfinie.</p></div>`
          )}`
      },
      {
        title: 'Suivre un appel virtuel',
        section: 'Polymorphisme & vtable',
        html: `
          <p>L’appel <code class="inline">r.toString()</code> peut être vu comme <code class="inline">r.vptr["toString"]()</code> (pseudo-code) : on suit le vptr de l’instance jusqu’à la vtable, et on y lit l’entrée <code class="inline">toString</code>. Comparez les deux cas :</p>
          ${callDiagram}`
      },

      /* ============ Virtuelle pure & redéfinition ============ */
      {
        title: 'Méthode virtuelle pure',
        section: 'Virtuelle pure & redéfinition',
        html: `
          <p>Une méthode est dite <em class="term">virtuelle pure</em> si elle n’est <strong>pas implémentée</strong> dans la classe où elle est déclarée :</p>
          ${H.code(`
            class Base {
            public:
                virtual std::string toString() const = 0;
            };
          `, { hl: [3] })}
          ${H.info('Le <code class="inline">= 0</code> est bien compréhensible : cela correspond à mettre à <b>0 le pointeur</b> dans la table des fonctions virtuelles !')}
          ${H.key('Une classe n’est <b>instanciable</b> que si sa table des fonctions virtuelles ne comporte <b>pas de 0</b>. Ici <code class="inline">Base</code> n’est pas instanciable, et une sous-classe ne le sera que si elle redéfinit <code class="inline">toString</code>.')}`
      },
      {
        title: 'Question : qui est instanciable ?',
        section: 'Virtuelle pure & redéfinition',
        html: `
          ${H.code(`
            class Base {
            public:
                virtual void m(const Base &) = 0;
            };

            class Fille : public Base {
            public:
                virtual void m(const Fille &) {}
            };
          `)}
          ${H.quiz({
            q: 'Quelle affirmation est vraie ?',
            options: ['<code class="inline">Base</code> est instanciable.', '<code class="inline">Fille</code> est instanciable.', 'Base et Fille sont instanciables.', 'Aucune n’est instanciable.'],
            answer: 3,
            explain: '<p><strong>Aucune.</strong> <code class="inline">Fille::m(const Fille &amp;)</code> n’a pas le même type d’argument que <code class="inline">Base::m(const Base &amp;)</code> : ce n’est <b>pas une redéfinition</b> mais une nouvelle méthode (surcharge). L’entrée <code class="inline">m(const Base&amp;)</code> reste à 0 dans la table de <code class="inline">Fille</code>.</p>'
          })}`
      },
      {
        title: 'La redéfinition',
        section: 'Virtuelle pure & redéfinition',
        html: `
          <p>La <em class="term">redéfinition</em> d’une méthode consiste à écrire, dans une classe dérivée, une méthode qui :</p>
          ${H.list([
            'porte le <strong>même nom</strong> ;',
            'a le <strong>même nombre et type d’arguments</strong> ;',
            'a comme type de retour le <strong>même type</strong> ou un <strong>sous-type</strong> du type de retour de la méthode redéfinie.'
          ], { ordered: true, frag: true })}
          ${H.code(`
            class Base {
            public:
                virtual Base *clone() const;
            };
            class F : public Base {
            public:
                virtual F *clone() const;  // ok : F * est un sous-type de Base *
            };
          `)}`
      },
      {
        title: 'Le mot-clé <code>override</code>',
        section: 'Virtuelle pure & redéfinition',
        layout: 'center',
        html: `
          ${H.code(`
            class Fille : public Base {
            public:
                void m(const Fille &) override {}
            };
          `, { hl: [3] })}
          ${H.tip(`Comme <code class="inline">@Override</code> en Java, le mot-clé <code class="inline">override</code> (C++11) demande au compilateur de <b>vérifier</b> qu’il s’agit bien d’une redéfinition. Sur la question précédente, l’erreur aurait été détectée :
            ${H.cmd(`
              $ g++ -c question.cpp
              error: 'void Fille::m(const Fille&)' marked 'override', but does not override
            `)}`, '<code>override</code> : le réflexe à prendre')}`
      },
      {
        title: 'Question : méthode sur une instance nullptr',
        section: 'Virtuelle pure & redéfinition',
        html: `
          ${H.quiz({
            q: 'L’appel à une méthode <b>non virtuelle</b> sur une instance <code class="inline">nullptr</code> génère systématiquement un SEGFAULT ?',
            options: ['Vrai', 'Faux'],
            answer: 1,
            explain: `<p><strong>Faux.</strong> Un appel non virtuel est un simple appel de fonction avec <code class="inline">this</code> en paramètre caché : il n’y a pas besoin de lire l’instance pour trouver la méthode. Ça ne plante que si la méthode <b>accède aux attributs</b> (ou appelle une méthode virtuelle).</p>
              ${H.code(`
                struct A {
                    int v;
                    void hello() { puts("hello"); }  // n'utilise pas this
                    int get() { return v; }           // lit this->v
                };
                A *p = nullptr;
                p->hello(); // affiche souvent "hello"...
                p->get();   // SEGFAULT
              `)}
              <p>C’est un <b>comportement indéfini</b> : à ne jamais faire !</p>`
          })}`
      },
      {
        title: 'Valeurs par défaut des arguments',
        section: 'Virtuelle pure & redéfinition',
        html: `
          <p>En C++, les arguments des fonctions et méthodes peuvent prendre des <strong>valeurs par défaut</strong> :</p>
          ${H.code(`
            void f(int = 0) {}

            f(); // appel f(0);
          `)}
          ${H.list([
            'Les valeurs par défaut doivent être précisées dans la <strong>déclaration</strong> : elles indiquent au compilateur comment compléter l’appel.',
            'Elles doivent être données <strong>du dernier argument vers le premier</strong>, afin d’éviter toute ambiguïté.'
          ])}
          ${H.code(`
            void g(int a, int b = 1, int c = 2);  // ok
            void h(int a = 0, int b);             // Erreur !
          `)}`
      },
      {
        title: 'Valeurs par défaut et héritage',
        section: 'Virtuelle pure & redéfinition',
        html: `
          ${H.variants([
            { label: 'Valeurs différentes', code: `
              class M {
              public:
                  virtual ~M() {}
                  virtual void h(int = 0) = 0;
              };
              class F : public M {
              public:
                  virtual void h(int i = 1) {}
              };

              int main() {
                  F x;
                  M &y = x;
                  y.h(); // appel de F::h(0) !
                  x.h(); // appel de F::h(1)
              }
            `, hl: [14],
              note: 'Bien que l’appel soit virtuel (c’est <code class="inline">F::h</code> qui s’exécute), c’est le <b>type de la variable</b> qui détermine les valeurs par défaut !' },
            { label: 'Pas de défaut dans F', code: `
              class M {
              public:
                  virtual ~M() {}
                  virtual void h(int = 0) = 0;
              };
              class F : public M {
              public:
                  virtual void h(int i) {}
              };

              int main() {
                  F x;
                  M &y = x;
                  y.h(); // appel de F::h(0)
                  x.h(); // Erreur !
              }
            `, hl: [15],
              note: 'À travers une variable de type <code class="inline">F</code>, aucune valeur par défaut n’est connue : l’appel sans argument ne compile pas.' }
          ])}
          ${H.rule('On évitera de mélanger <b>redéfinition</b>, <b>surcharge</b> et <b>valeurs par défaut</b> : le comportement attendu doit toujours être « limpide » (c’est aussi valable pour les opérateurs, les exceptions…).')}`
      },

      /* ============ Résolution des appels ============ */
      {
        title: 'Redéfinition + surcharge = surprises',
        section: 'Résolution des appels',
        html: `
          ${H.cols(
            H.code(`
              class M {
              public:
                  void h(const M &);
              };
              class F : public M {
              public:
                  void h(const F &);
              };
            `),
            H.code(`
              F x, y;
              M &p = x, &q = y;
              x.h(y); // 1. ok
              p.h(q); // 2. ok
              p.h(x); // 3. ok
              x.h(p); // 4. erreur !
            `, { mark: { 6: 'err' } })
          )}
          ${H.quiz({
            q: 'Quelle méthode est appelée par <code class="inline">p.h(x);</code> ?',
            options: ['<code class="inline">M::h</code>', '<code class="inline">F::h</code>'],
            answer: 0,
            explain: '<p><strong>M::h</strong> : <code class="inline">p</code> est de type <code class="inline">M&amp;</code>, la recherche se fait dans <code class="inline">M</code>, et <code class="inline">h</code> n’est pas virtuelle.</p><p>Pour le cas 4, comme <code class="inline">F</code> hérite de <code class="inline">M</code>, on pourrait s’attendre à ce que <code class="inline">M::h</code> soit appelée… mais <code class="inline">F::h</code> <b>masque</b> <code class="inline">M::h</code> : seule <code class="inline">F::h(const F&amp;)</code> est examinée, et un <code class="inline">M&amp;</code> n’est pas un <code class="inline">F&amp;</code>.</p>'
          })}
          ${H.rule('Évitez de <b>mélanger surcharge et redéfinition</b> (même nom, arguments différents dans la classe fille). <span class="muted">Détails de la résolution des appels dans les diapos suivantes.</span>')}`
      },
      {
        title: 'Algorithme de résolution',
        section: 'Résolution des appels',
        html: `
          <p>Appel d’une méthode <code class="inline">m</code> sur une variable <code class="inline">v</code> de type <code class="inline">V</code> (pointeur ou référence) désignant une instance de type <code class="inline">I</code> :</p>
          ${H.cols(
            `<div class="card"><h4>① Recherche par nom (compilation)</h4>
              ${H.list([
                'Existe-t-il des méthodes de nom <code class="inline">m</code> dans la classe <code class="inline">V</code> ? (⇒ <code class="inline">using</code>)',
                '<b>Oui</b> : parmi elles, le compilateur choisit celle dont les arguments <b>correspondent le mieux</b> à l’appel (surcharge) ; aucune ne convient → <span class="hl-err">erreur</span> ; plusieurs conviennent aussi bien → <span class="hl-err">ambiguïté</span>.',
                '<b>Non</b> : on remonte la hiérarchie de <code class="inline">V</code> ; dès qu’on trouve des <code class="inline">m</code>, on applique la règle ci-dessus.'
              ])}</div>`,
            `<div class="card"><h4>② Appel (exécution)</h4>
              ${H.list([
                'Une méthode a été trouvée (sinon erreur).',
                'Non virtuelle : appel direct de la méthode trouvée.',
                'Virtuelle : appel <b>via la vtable</b> — si redéfinie dans <code class="inline">I</code>, c’est <code class="inline">I::m</code>, sinon celle du plus proche parent.'
              ])}</div>`
          )}
          ${H.key('La recherche <b>s’arrête à la première classe</b> qui contient une méthode de ce nom, même si ses arguments ne conviennent pas.')}`
      },
      {
        title: 'Résolution à la compilation',
        section: 'Résolution des appels',
        layout: 'center',
        html: `
          ${H.key('Si une variable <code class="inline">v</code> de type <code class="inline">T</code> n’est <b>ni une référence ni un pointeur</b>, alors la résolution se fait <b>à la compilation</b>. Même si la méthode appelée est virtuelle, il n’y a <b>pas d’utilisation de la vtable</b>.')}
          ${H.code(`
            Fille f;
            f.toString();      // pas de vtable : Fille::toString connue à la compilation
            Base &r = f;
            r.toString();      // vtable
          `)}`
      },
      {
        title: 'Appel avec l’opérateur de portée',
        section: 'Résolution des appels',
        html: `
          <p>Avec l’opérateur de portée, l’appel inspecte la classe <b>indiquée</b>, <b>sans tenir compte du <code class="inline">virtual</code></b>.</p>
          ${H.cols(
            H.code(`
              struct A {
                  virtual void m() {}
              };
              struct B : A {
              };
              struct C : B {
                  virtual void m() {}
              };
            `),
            H.code(`
              C z;
              A &x = z;
              B &y = z;
              x.m();
              z.B::m();
              y.m();
              y.B::m();
            `)
          )}
          ${H.reveal('Quelle méthode est appelée à chaque ligne ?', `
            ${H.table(['Appel', 'Méthode', 'Pourquoi'], [
              ['x.m();', H.c('C::m'), 'virtuelle, via le vptr de l’instance (un C) : vtable de C'],
              ['z.B::m();', H.c('A::m'), 'B n’a pas de m : on trouve celle héritée de A, sans vtable'],
              ['y.m();', H.c('C::m'), 'virtuelle, via la vtable'],
              ['y.B::m();', H.c('A::m'), 'opérateur de portée : pas de vtable']
            ], { cls: 'left' })}
            <p>Les appels avec opérateur de portée ne passent pas par la vtable : la résolution se fait à la compilation.</p>
          `)}`
      },
      {
        title: 'Héritage et <code>using</code>',
        section: 'Résolution des appels',
        html: `
          <p>Le mot-clé <code class="inline">using</code> permet d’inclure des méthodes du parent dans les méthodes à inspecter :</p>
          ${H.cols(
            H.code(`
              class M {
              public:
                  void h(const M &);
              };
              class F : public M {
              public:
                  using M::h;
                  void h(const F &);
              };
            `, { hl: [7] }),
            H.code(`
              F x, y;
              x.h(y); // 1. ok
              M &p = x, &q = y;
              p.h(q); // 2. ok
              p.h(x); // 3. ok
              x.h(p); // 4. ok
            `, { mark: { 6: 'ok' } })
          )}
          ${H.info('<code class="inline">using M::h;</code> dans la classe <code class="inline">F</code> indique au compilateur d’inclure la ou les méthodes de nom <code class="inline">h</code> de <code class="inline">M</code> dans l’algorithme de résolution.')}`
      },
      {
        title: 'Question : <code>using</code> et surcharge',
        section: 'Résolution des appels',
        layout: 'center',
        html: `
          ${H.quiz({
            q: 'À ce stade du cours, l’utilisation de <code class="inline">using</code> dans une classe fille par rapport à une méthode mère suppose l’usage de la surcharge ?',
            options: ['Vrai', 'Faux'],
            answer: 0,
            explain: '<p><strong>Vrai.</strong> Le <code class="inline">using</code> n’a d’intérêt que si la classe fille déclare une méthode de <b>même nom</b> mais de <b>signature différente</b> (une surcharge) qui masquerait celles du parent.</p>'
          })}`
      },

      /* ============ Classes abstraites ============ */
      {
        title: 'Classe abstraite et interface',
        section: 'Classes abstraites',
        html: `
          ${H.cols(
            `<div class="card"><div class="ci">🧩</div><h4>Classe abstraite</h4><p>Classe ayant <b>au moins une</b> méthode virtuelle pure.</p></div>`,
            `<div class="card"><div class="ci">🔌</div><h4>Interface</h4><p>Pas de définition dans la norme ; on appellera interface une classe n’ayant <b>que</b> des méthodes virtuelles pures (et un destructeur virtuel).</p></div>`
          )}
          ${H.list([
            'Les classes abstraites et les interfaces <strong>ne sont pas instanciables</strong>.',
            'Elles ne peuvent pas servir de type de retour <b>par recopie</b>, ni d’argument <b>par valeur</b>.',
            'On ne peut utiliser que des <strong>pointeurs</strong> et des <strong>références</strong> sur ces types.'
          ], { frag: true })}
          ${H.java('<code class="inline">abstract class</code> ↔ classe ayant au moins une méthode <code class="inline">= 0</code> ; <code class="inline">interface</code> ↔ classe dont toutes les méthodes sont <code class="inline">= 0</code> ; <code class="inline">implements I</code> ↔ <code class="inline">: public I</code>. Il n’y a pas de mot-clé dédié en C++.')}`
      },
      {
        title: 'Exemple d’interface',
        section: 'Classes abstraites',
        html: `
          ${H.code(`
            class Usager {
            public:
                virtual ~Usager() {}
                virtual std::string nom() const = 0;
                virtual void monterDans(Transport &) = 0;
            };
          `)}
          ${H.quiz({
            q: 'Soit <code class="inline">I</code> une interface : quelles syntaxes sont invalides ?',
            options: ['<code class="inline">I *i;</code>', '<code class="inline">I &amp;i = j;</code>', '<code class="inline">I i;</code>', '<code class="inline">I &amp;*i = p;</code>'],
            answer: [2, 3],
            explain: '<p><b>C</b> : <code class="inline">I i;</code> tente d’instancier une classe abstraite — interdit.</p><p><b>D</b> : <code class="inline">I &amp;*i</code> déclare un <b>pointeur sur référence</b>, qui n’existe pas en C++.</p><p>Pointeurs et références sur <code class="inline">I</code> (A et B) sont parfaitement valides.</p>'
          })}`
      },
      {
        title: 'Exemple de classe abstraite',
        section: 'Classes abstraites',
        html: `
          ${H.code(`
            class PassagerAbstrait {
            protected:
                std::string _nom;
                int _etat;
                int _destination;
                // ...
                virtual void choixPlaceMontee(Bus &b) = 0;
                // ...
            public:
                virtual ~PassagerAbstrait() {}
                bool estDebout() const {
                    return _etat == DEBOUT;
                }
            };
          `, { hl: [7] })}
          ${H.info('Contrairement à une interface, une classe abstraite peut contenir des <b>attributs</b> et des méthodes <b>implémentées</b> : elle factorise le code commun et laisse aux sous-classes les choix spécifiques.')}`
      },
      {
        title: 'Héritage et destructeur virtuel',
        section: 'Classes abstraites',
        html: `
          ${H.rule('Si une classe va être dérivée, alors elle doit avoir un <b>destructeur virtuel</b> (implémenté).')}
          ${H.variants([
            { label: 'Destruction automatique', code: `
              class A {
              };
              class B : public A {
                  std::string s;
              public:
                  B() : s("hello") {}
              };
              // ...
              {
                  B b;
              } // ok : le destructeur de B appelle
                // le destructeur de std::string sur s
            `, note: 'La variable est de type <code class="inline">B</code> : le bon destructeur est appelé.' },
            { label: 'Avant : bug', code: `
              class A {
              };
              class B : public A {
                  std::string s;
              public:
                  B() : s("hello") {}
              };
              // ...
              A *a = new B;
              delete a; // Erreur : ~B() n'est pas appelé,
                        // ni le destructeur de std::string
            `, hl: [10], note: '<code class="inline">~A</code> n’est pas virtuel : <code class="inline">delete a</code> appelle le destructeur du <b>type de la variable</b> (<code class="inline">A</code>), jamais celui de <code class="inline">B</code>.' },
            { label: 'Après : correct', code: `
              class A {
              public:
                  virtual ~A() {}
              };
              class B : public A {
                  std::string s;
              public:
                  B() : s("hello") {}
              };
              // ...
              A *a = new B;
              delete a; // ok : ~B() puis ~A()
            `, hl: [3], mark: { 12: 'ok' }, note: 'Le destructeur virtuel passe par la vtable : <code class="inline">~B()</code> est appelé, puis <code class="inline">~A()</code> en cascade.' }
          ])}`
      },
      {
        title: 'Le bug vu par AddressSanitizer',
        section: 'Classes abstraites',
        html: `
          <p>Compilons la version <b>sans</b> destructeur virtuel avec <code class="inline">-fsanitize=address</code> et exécutons-la :</p>
          ${H.asan(`
            $ g++ -g -fsanitize=address dtor.cpp -o dtor && ./dtor
            ==149440==ERROR: AddressSanitizer: new-delete-type-mismatch on 0x503000000040
              object passed to delete has wrong type:
              size of the allocated type:   32 bytes;
              size of the deallocated type: 1 bytes.
                #0 ... in operator delete(void*, unsigned long)
                #1 0x6367d13354ae in main dtor.cpp:11
            allocated by thread T0 here:
                #1 0x6367d1335483 in main dtor.cpp:10
            SUMMARY: AddressSanitizer: new-delete-type-mismatch
          `)}
          ${H.key('<code class="inline">delete a;</code> (ligne 11) détruit l’objet comme un <code class="inline">A</code> (1 octet) alors que c’est un <code class="inline">B</code> de 32 octets alloué ligne 10. C’est un <b>comportement indéfini</b>, pas seulement une fuite : ne jamais dériver d’une classe sans destructeur virtuel.')}`
      },

      /* ============ Héritage multiple ============ */
      {
        title: 'Héritage multiple',
        section: 'Héritage multiple',
        html: `
          <p>En C++, une classe peut avoir <strong>plusieurs classes de base</strong>, abstraites ou non :</p>
          ${H.cols(H.code(`
            class I1 { ... };
            class I2 { ... };
            class B { ... };
            class C : public B, public I1, public I2 {
                // implémentation de toutes les méthodes
                // virtuelles pures.
            };
          `, { hl: [4] }),
          H.java('Une classe n’a qu’<b>une</b> classe mère (<code class="inline">extends</code>) et peut implémenter plusieurs interfaces. En C++, on peut hériter de <b>plusieurs classes</b>, et c’est aussi ainsi que l’on « implémente » plusieurs interfaces.'))}
          ${multiDiagram}`
      },
      {
        title: 'Héritage multiple : lever les ambiguïtés',
        section: 'Héritage multiple',
        html: `
          <p>L’opérateur de portée et le <code class="inline">using</code> sont très utiles pour lever les ambiguïtés :</p>
          ${H.variants([
            { label: 'Opérateur de portée', code: `
              class I1 {
              public:
                  void m();
              };
              class I2 {
              public:
                  void m();
              };

              class F : public I1, public I2 {
                  // ...
                  m();     // Erreur !
                  I1::m(); // ok
                  // ...
              };
            `, mark: { 12: 'err', 13: 'ok' } },
            { label: 'using', code: `
              class I1 {
              public:
                  void m();
              };
              class I2 {
              public:
                  void m();
              };

              class F : public I1, public I2 {
                  // ...
                  using I2::m;
                  m();     // ok : I2::m
                  I1::m(); // ok
                  // ...
              };
            `, hl: [12], mark: { 13: 'ok', 14: 'ok' } }
          ])}`
      },
      {
        title: 'Héritage en losange',
        section: 'Héritage multiple',
        html: `
          ${H.cols(
            `<p>Une classe peut posséder <b>plusieurs fois</b> une même classe comme classe de base :</p>
             ${H.code(`
               class I { public: int _value; };

               class I1 : public I {};

               class I2 : public I {};

               class C : public I1, public I2 {};
             `)}`,
            diamondDiagram
          )}`
      },
      {
        title: 'Losange : ambiguïté',
        section: 'Héritage multiple',
        html: `
          <p>Une instance de la classe <code class="inline">C</code> a donc <strong>deux</strong> attributs <code class="inline">_value</code> :</p>
          ${H.cols(
            H.code(`
              C c;
              c._value; // Erreur !
            `, { mark: { 2: 'err' } }),
            `<p>L’opérateur de portée permet de lever cette ambiguïté :</p>
             ${H.code(`
               C c;
               c.I1::_value;    // Ok
               c.I1::I::_value; // Ok
               c.I2::_value;    // Ok
             `)}`
          )}`
      },
      {
        title: 'Héritage virtuel',
        section: 'Héritage multiple',
        html: `
          <p>Dans un losange, <code class="inline">I1</code> et <code class="inline">I2</code> pourraient vouloir <strong>partager</strong> leur classe de base <code class="inline">I</code> : on utilise l’<em class="term">héritage virtuel</em>.
          Une classe indique qu’elle est prête à partager une de ses bases avec une autre classe qui aurait fait de même.</p>
          ${H.cols(
            H.code(`
              class I {};
              class I1 : public virtual I {};
              class I2 : public virtual I {};
              class I3 : public I {};
              class C : public I1, public I2 {};
              class D : public I1, public I3 {};
            `, { hl: [2, 3] }),
            `${H.list(['Une instance de <code class="inline">C</code> ne contient <b>qu’un seul</b> <code class="inline">I</code>.', 'Une instance de <code class="inline">D</code> en possède <b>deux</b>.'])}`
          )}
          ${virtualDiagram}`
      },
      {
        title: 'Héritage virtuel : lever les ambiguïtés',
        section: 'Héritage multiple',
        html: `
          <div class="cols" style="grid-template-columns:minmax(0,1.55fr) minmax(0,1fr)"><div class="col">${
            H.code(`
              class I { public: virtual ~I() {} virtual void m() = 0; };
              class I1 : public virtual I { public: virtual void m() {} };
              class I2 : public virtual I {};

              class I3 : public I { public: virtual void m() {} };

              class C : public I1, public I2 {};
              class D : public I1, public I3 {};
              class E : public I, public I1 {};
            `) + H.code(`
              int main() {
                  C c;
                  c.m(); // ok
                  D d;
                  d.m(); // Erreur : ambiguïté entre I1::m et I3::m
                  E e;   // Erreur : abstraite
                  return 1;
              }
            `, { mark: { 3: 'ok', 5: 'err', 6: 'err' } })}</div><div class="col">${ambigDiagram}</div></div>
          ${H.rule('On utilisera <b>systématiquement l’héritage virtuel</b> lors de l’héritage d’une <b>interface</b>.')}`
      },
      {
        title: 'Quand utiliser l’héritage virtuel ?',
        section: 'Héritage multiple',
        html: `
          ${H.warn('On n’utilisera pas l’héritage virtuel si la classe de base possède des <b>attributs pouvant changer</b>.')}
          ${H.info('Si l’héritage virtuel concerne une classe de base ayant des attributs, un <b>attribut caché</b> est ajouté par le compilateur (un peu comme le vptr) : il y a donc un <b>coût mémoire</b>.')}
          ${H.tip('On pourra s’autoriser l’héritage virtuel si la classe de base est :<ul class="bullets"><li>une <b>interface</b> ;</li><li>ou une classe ne possédant que des méthodes virtuelles pures, un constructeur par défaut et des attributs dont la valeur est fixée lors de la construction.</li></ul>', 'Cas autorisés')}`
      },

      /* ============ L’essentiel ============ */
      {
        title: 'L’essentiel : héritage & polymorphisme',
        section: 'L’essentiel',
        html: `
          ${H.list([
            'Sans <code class="inline">virtual</code>, c’est le <b>type de la variable</b> qui choisit la méthode (≠ Java). Avec <code class="inline">virtual</code>, c’est le <b>type réel</b> de l’instance, via la vtable.',
            'Le polymorphisme ne joue qu’à travers un <b>pointeur</b> ou une <b>référence</b> ; une copie par valeur « découpe » l’objet.',
            'Une classe destinée à être dérivée a un <b>destructeur virtuel</b>.',
            'Marquez chaque redéfinition avec <code class="inline">override</code> : le compilateur vérifie la signature.',
            'Pour une classe polymorphe, supprimez la copie : <code class="inline">A(const A&amp;) = delete;</code> et <code class="inline">A&amp; operator=(const A&amp;) = delete;</code>.'
          ], { ordered: true })}
          ${H.cols(
            H.quiz({
              q: '<code class="inline">Base &amp;r = f;</code> où <code class="inline">f</code> est une <code class="inline">Fille</code> qui redéfinit <code class="inline">m()</code>, <b>non virtuelle</b> dans <code class="inline">Base</code>. <code class="inline">r.m()</code> appelle :',
              options: ['<code class="inline">Base::m</code>', '<code class="inline">Fille::m</code>'],
              answer: 0,
              explain: '<p>Sans <code class="inline">virtual</code>, c’est le type de la variable (<code class="inline">Base&amp;</code>) qui décide.</p>'
            }),
            H.quiz({
              q: '<code class="inline">Base *p = new Fille; delete p;</code> est correct si :',
              options: ['<code class="inline">Fille</code> a un destructeur', '<code class="inline">~Base</code> est virtuel'],
              answer: 1,
              explain: '<p>Sans destructeur virtuel dans <code class="inline">Base</code>, <code class="inline">~Fille</code> n’est jamais appelé : comportement indéfini.</p>'
            })
          )}`
      }
    ]
  });
})();
