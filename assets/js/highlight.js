/* Petit colorateur syntaxique C++ (sans dépendance). */
(function () {
  const KEYWORDS = new Set(('alignas alignof asm auto break case catch class const constexpr const_cast continue ' +
    'decltype default delete do dynamic_cast else enum explicit export extern false for friend goto if inline ' +
    'mutable namespace new noexcept nullptr operator private protected public register reinterpret_cast return ' +
    'sizeof static static_assert static_cast struct switch template this throw true try typedef typeid typename ' +
    'union using virtual volatile while override final NULL').split(' '));
  const TYPES = new Set(('void bool char wchar_t short int long float double signed unsigned size_t ssize_t ' +
    'std string vector list map set ostream istream iostream stringstream iterator').split(' '));

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function commentClass(text) {
    const t = text.toLowerCase();
    if (/erreur|error|faux|beurk|fuite|double free|!\s*$|ne marche pas/.test(t) && !/\bok\b/.test(t)) return 'c-err';
    if (/warning/.test(t)) return 'c-warn';
    if (/\bok\b|=>/.test(t)) return 'c-ok';
    return '';
  }

  function highlight(src) {
    let out = '';
    let i = 0;
    const n = src.length;
    let lineStart = true;
    while (i < n) {
      const c = src[i];
      const rest = src.slice(i);
      // préprocesseur
      if (lineStart && /^[ \t]*#/.test(rest)) {
        const m = rest.match(/^[ \t]*#[^\n]*/)[0];
        out += '<span class="t-pre">' + esc(m) + '</span>';
        i += m.length; lineStart = false; continue;
      }
      if (c === '\n') { out += '\n'; i++; lineStart = true; continue; }
      if (c !== ' ' && c !== '\t') lineStart = false;
      // commentaires
      if (rest.startsWith('//')) {
        const m = rest.match(/^\/\/[^\n]*/)[0];
        out += '<span class="t-com ' + commentClass(m) + '">' + esc(m) + '</span>';
        i += m.length; continue;
      }
      if (rest.startsWith('/*')) {
        let end = src.indexOf('*/', i + 2);
        end = end === -1 ? n : end + 2;
        const m = src.slice(i, end);
        out += '<span class="t-com ' + commentClass(m) + '">' + esc(m) + '</span>';
        i = end; continue;
      }
      // chaînes
      if (c === '"' || c === "'") {
        let j = i + 1;
        while (j < n && src[j] !== c && src[j] !== '\n') { if (src[j] === '\\') j++; j++; }
        const m = src.slice(i, j + 1);
        out += '<span class="t-str">' + esc(m) + '</span>';
        i = j + 1; continue;
      }
      // nombres
      let m = rest.match(/^(0x[0-9a-fA-F]+|\d+\.?\d*[fFlLuU]*)/);
      if (m && !/[A-Za-z_]/.test(src[i - 1] || '')) {
        out += '<span class="t-num">' + m[0] + '</span>';
        i += m[0].length; continue;
      }
      // identifiants
      m = rest.match(/^~?[A-Za-z_][A-Za-z0-9_]*/);
      if (m) {
        let w = m[0];
        if (w[0] === '~' && !/^[A-Z]/.test(w.slice(1))) { w = '~'; }
        const after = src.slice(i + w.length).match(/^\s*(\(|<)/);
        let cls = '';
        if (KEYWORDS.has(w)) cls = 't-kw';
        else if (TYPES.has(w)) cls = 't-type';
        else if (/^[A-Z]/.test(w) || /^~[A-Z]/.test(w)) cls = after && after[1] === '(' ? 't-ctor' : 't-class';
        else if (after && after[1] === '(') cls = 't-fn';
        out += cls ? '<span class="' + cls + '">' + esc(w) + '</span>' : esc(w);
        i += w.length; continue;
      }
      // opérateurs
      if (/[{}()\[\];,]/.test(c)) { out += '<span class="t-punc">' + esc(c) + '</span>'; i++; continue; }
      if (/[+\-*\/%=<>!&|^~?:.]/.test(c)) { out += '<span class="t-op">' + esc(c) + '</span>'; i++; continue; }
      out += esc(c); i++;
    }
    return out;
  }

  /* ---------- autres langages : shell, make, cmake, yaml, python, diff ---------- */
  const LANGS = {
    sh: { kw: 'if then else elif fi for while do done case esac in function return export local echo cd exit source alias unset set read shift', comment: '#', vars: /^\$(\{[^}]*\}|\(|[A-Za-z_][A-Za-z0-9_]*|[0-9@#?*$!])/ },
    make: { kw: '.PHONY include ifeq ifneq ifdef ifndef else endif define endef export', comment: '#', vars: /^\$(\([^)]*\)|\{[^}]*\}|[@<^*?%+])/ },
    cmake: { kw: 'if else elseif endif foreach endforeach while endwhile function endfunction macro endmacro PUBLIC PRIVATE INTERFACE REQUIRED STATIC SHARED', comment: '#', vars: /^\$\{[^}]*\}/ },
    yaml: { kw: 'true false null yes no', comment: '#', vars: /^\$\{?[A-Za-z_][A-Za-z0-9_]*\}?/ },
    py: { kw: 'def class return if elif else for while in not and or import from as with try except finally raise pass break continue lambda None True False print self', comment: '#', vars: null }
  };
  LANGS.bash = LANGS.sh; LANGS.shell = LANGS.sh; LANGS.makefile = LANGS.make; LANGS.python = LANGS.py; LANGS.yml = LANGS.yaml;

  function highlightGeneric(src, L, lang) {
    const kw = new Set(L.kw.split(' '));
    return src.split('\n').map(line => {
      let out = '', i = 0;
      // prompt de terminal
      if (lang === 'sh' || lang === 'bash' || lang === 'shell') {
        const pm = line.match(/^(\s*[\w@.~:\/-]*\$ )/);
        if (pm) { out += '<span class="t-pre">' + esc(pm[1]) + '</span>'; i = pm[1].length; }
      }
      if (lang === 'make' || lang === 'makefile') {
        const tm = line.match(/^([A-Za-z0-9_.%\/$() -]+)(:)(?!=)/);
        if (tm && !/^\t/.test(line)) { out += '<span class="t-fn">' + esc(tm[1]) + '</span>' + tm[2]; i = tm[0].length; }
      }
      if (lang === 'yaml' || lang === 'yml') {
        const km = line.match(/^(\s*-?\s*)([A-Za-z0-9_.-]+)(:)/);
        if (km) { out += esc(km[1]) + '<span class="t-kw">' + esc(km[2]) + '</span>' + km[3]; i = km[0].length; }
      }
      while (i < line.length) {
        const rest = line.slice(i), c = line[i];
        if (c === L.comment && (i === 0 || /\s/.test(line[i - 1]))) { out += '<span class="t-com">' + esc(rest) + '</span>'; break; }
        if (c === '"' || c === "'") {
          let j = i + 1; while (j < line.length && line[j] !== c) { if (line[j] === '\\') j++; j++; }
          out += '<span class="t-str">' + esc(line.slice(i, j + 1)) + '</span>'; i = j + 1; continue;
        }
        let m;
        if (L.vars && (m = rest.match(L.vars))) { out += '<span class="t-type">' + esc(m[0]) + '</span>'; i += m[0].length; continue; }
        if ((m = rest.match(/^--?[A-Za-z][\w-]*/)) && (i === 0 || /\s/.test(line[i - 1]))) { out += '<span class="t-op">' + esc(m[0]) + '</span>'; i += m[0].length; continue; }
        if ((m = rest.match(/^[A-Za-z_.][\w.]*/))) {
          const w = m[0];
          const call = lang === 'cmake' || lang === 'py' || lang === 'python' ? /^\s*\(/.test(line.slice(i + w.length)) : false;
          out += kw.has(w) ? '<span class="t-kw">' + esc(w) + '</span>' : call ? '<span class="t-fn">' + esc(w) + '</span>' : esc(w);
          i += w.length; continue;
        }
        if ((m = rest.match(/^\d+(\.\d+)?/))) { out += '<span class="t-num">' + m[0] + '</span>'; i += m[0].length; continue; }
        out += esc(c); i++;
      }
      return out;
    }).join('\n');
  }

  function highlightDiff(src) {
    return src.split('\n').map(l => {
      const e = esc(l);
      if (l === '---') return e;
      if (/^(\+\+\+|---)\s/.test(l)) return '<span class="t-kw">' + e + '</span>';
      if (/^@@/.test(l) || /^\d+(,\d+)?[acd]\d+(,\d+)?$/.test(l)) return '<span class="t-fn">' + e + '</span>';
      if (/^[+>]/.test(l)) return '<span class="t-com c-ok">' + e + '</span>';
      if (/^[-<]/.test(l)) return '<span class="t-com c-err">' + e + '</span>';
      return e;
    }).join('\n');
  }

  /* ---------- Sessions de débogage : gdb, valgrind, AddressSanitizer ---------- */
  const span = (cls, t) => '<span class="' + cls + '">' + esc(t) + '</span>';

  /* Tokenisation générique d'une ligne de sortie : règles essayées dans l'ordre à chaque position. */
  function tokLine(line, rules) {
    let out = '', i = 0;
    while (i < line.length) {
      let hit = false;
      for (const [re, cls] of rules) {
        re.lastIndex = i;
        const m = re.exec(line);
        if (m && m.index === i && m[0].length) {
          out += typeof cls === 'function' ? cls(m) : span(cls, m[0]);
          i += m[0].length; hit = true; break;
        }
      }
      if (!hit) { out += esc(line[i]); i++; }
    }
    return out;
  }
  const R = src => new RegExp(src, 'y');
  const ERR_WORDS = 'Program received signal|Segmentation fault|SIGSEGV|SIGABRT|SIGFPE|Invalid (?:read|write|free\\(\\)|size)|Conditional jump or move depends on uninitialised value\\(s\\)|Use of uninitialised value|Mismatched free\\(\\) / delete / delete \\[\\]|definitely lost|indirectly lost|possibly lost|ERROR SUMMARY|ERROR: AddressSanitizer|ERROR: LeakSanitizer|detected memory leaks|Direct leak|Indirect leak|heap-use-after-free|heap-buffer-overflow|stack-buffer-overflow|global-buffer-overflow|stack-overflow|attempting double-free|double-free|new-delete-type-mismatch|SEGV on unknown address|Aborted|core dumped';
  const COMMON = [
    [R('(?:' + ERR_WORDS + ')'), 'dbg-err'],
    [R('0x[0-9a-fA-F]+'), 't-num'],
    [R('[\\w./-]+\\.(?:c|h|cpp|hpp|cc|so(?:\\.\\d+)*)(?::\\d+)*(?![\\w.])'), 't-str'],
    [R('"(?:[^"\\\\]|\\\\.)*"'), 't-str'],
    [R("'(?:[^'\\\\]|\\\\.)*'"), 't-str'],
    [R('[A-Za-z_]\\w*(?=\\s*\\()'), 't-fn'],
    [R('-?\\d+(?:\\.\\d+)?'), 't-num'],
    [R('[A-Za-z_]\\w*'), m => esc(m[0])]
  ];
  const GDB_RULES = [
    [R('#\\d+'), 't-kw'],
    [R('\\$\\d+'), 't-type'],
    [R('(?:Breakpoint|Hardware watchpoint|Watchpoint|Temporary breakpoint|Continuing\\.|Starting program:|Run till exit from|Old value|New value|Value returned is|Num\\s+Type)'), 't-kw'],
    [R('\\b(?:at|in|from)\\b'), 't-op']
  ].concat(COMMON);
  const VG_RULES = [
    [R('(?:HEAP SUMMARY|LEAK SUMMARY|in use at exit|total heap usage|still reachable|suppressed|For lists of detected and suppressed errors|SUMMARY: AddressSanitizer)'), 't-kw'],
    [R('\\b(?:at|by)\\b(?= 0x)'), 't-op'],
    [R('#\\d+'), 't-kw'],
    [R("(?:Address|is \\d+ bytes (?:inside|after|before)|a block of size|alloc'd|free'd|freed by thread|previously allocated by thread|allocated by thread)"), 't-class']
  ].concat(COMMON);

  function shellLine(l) {
    const m = l.match(/^(\s*[\w@.~:\/-]*\$ )(.*)$/);
    return m ? '<span class="t-pre">' + esc(m[1]) + '</span>' + highlightGeneric(m[2], LANGS.sh, 'shx') : null;
  }
  function gdbLine(l) {
    const sh = shellLine(l);
    if (sh != null) return sh;
    let m = l.match(/^(\(gdb\))(\s?)(\S*)(.*)$/);
    if (m) {
      const rest = m[4].replace(/(\s#\s.*)$/, '');
      const com = m[4].slice(rest.length);
      return '<span class="dbg-prompt">' + esc(m[1]) + '</span>' + m[2] + span('dbg-cmd', m[3]) + tokLine(rest, COMMON) + (com ? span('t-com', com) : '');
    }
    m = l.match(/^(\d+)(\t|\s{2,})(.*)$/);           // ligne de source affichée par gdb (list, next, step…)
    if (m) return span('dbg-ln', m[1]) + m[2] + highlight(m[3]);
    return tokLine(l, GDB_RULES);
  }
  function vgLine(l) {
    const sh = shellLine(l);
    if (sh != null) return sh;
    const m = l.match(/^(==\d+==|\*\*\d+\*\*)(.*)$/);
    return m ? span('dbg-pid', m[1]) + tokLine(m[2], VG_RULES) : tokLine(l, VG_RULES);
  }
  const isGdb = src => /^\s*\(gdb\)/m.test(src);
  const isVg = src => /^\s*==\d+==/m.test(src) || /AddressSanitizer|LeakSanitizer/.test(src);
  function highlightDebug(src, kind) {
    return src.split('\n').map(kind === 'gdb' ? gdbLine : vgLine).join('\n');
  }

  /* Point d'entrée : langage C/C++ par défaut. */
  function highlightLang(src, lang) {
    if (!lang || lang === 'c' || lang === 'cpp' || lang === 'c++' || lang === 'h') return highlight(src);
    if (lang === 'gdb') return highlightDebug(src, 'gdb');
    if (lang === 'valgrind' || lang === 'asan' || lang === 'sanitizer') return highlightDebug(src, 'vg');
    // sorties de terminal : sessions gdb / valgrind / ASan reconnues automatiquement
    if (lang === 'text' || lang === 'txt' || lang === 'sh' || lang === 'bash' || lang === 'shell') {
      if (isGdb(src)) return highlightDebug(src, 'gdb');
      if (isVg(src)) return highlightDebug(src, 'vg');
    }
    if (lang === 'text' || lang === 'txt') return esc(src);
    if (lang === 'diff' || lang === 'patch') return highlightDiff(src);
    const L = LANGS[lang];
    return L ? highlightGeneric(src, L, lang) : esc(src);
  }

  /* Retire l'indentation commune et les lignes vides de début / fin. */
  function dedent(src, keepTabs) {
    // les Makefile exigent de vraies tabulations : on les conserve pour eux
    const lines = (keepTabs ? src : src.replace(/\t/g, '    ')).split('\n');
    while (lines.length && !lines[0].trim()) lines.shift();
    while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
    const ind = Math.min(...lines.filter(l => l.trim()).map(l => l.match(/^ */)[0].length));
    return lines.map(l => l.slice(isFinite(ind) ? ind : 0)).join('\n');
  }

  window.CppHighlight = { highlight, highlightLang, highlightDebug, isGdb, isVg, dedent, esc };
})();
