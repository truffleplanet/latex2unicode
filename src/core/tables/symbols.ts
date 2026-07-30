/**
 * `\command` -> Unicode, for commands that take no arguments.
 * Everything with arguments (fractions, roots, accents, fonts) lives in the parser.
 */
export const SYMBOLS: Record<string, string> = {
  // ── Greek, lowercase ─────────────────────────────────────────────
  alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ϵ', varepsilon: 'ε',
  zeta: 'ζ', eta: 'η', theta: 'θ', vartheta: 'ϑ', iota: 'ι', kappa: 'κ',
  varkappa: 'ϰ', lambda: 'λ', mu: 'μ', nu: 'ν', xi: 'ξ', omicron: 'ο',
  pi: 'π', varpi: 'ϖ', rho: 'ρ', varrho: 'ϱ', sigma: 'σ', varsigma: 'ς',
  tau: 'τ', upsilon: 'υ', phi: 'ϕ', varphi: 'φ', chi: 'χ', psi: 'ψ', omega: 'ω',
  digamma: 'ϝ',

  // ── Greek, uppercase ─────────────────────────────────────────────
  Alpha: 'Α', Beta: 'Β', Gamma: 'Γ', Delta: 'Δ', Epsilon: 'Ε', Zeta: 'Ζ',
  Eta: 'Η', Theta: 'Θ', Iota: 'Ι', Kappa: 'Κ', Lambda: 'Λ', Mu: 'Μ', Nu: 'Ν',
  Xi: 'Ξ', Omicron: 'Ο', Pi: 'Π', Rho: 'Ρ', Sigma: 'Σ', Tau: 'Τ',
  Upsilon: 'Υ', Phi: 'Φ', Chi: 'Χ', Psi: 'Ψ', Omega: 'Ω',
  varGamma: '𝛤', varDelta: '𝛥', varTheta: '𝛩', varLambda: '𝛬', varXi: '𝛯',
  varPi: '𝛱', varSigma: '𝛴', varUpsilon: '𝛶', varPhi: '𝛷', varPsi: '𝛹', varOmega: '𝛺',

  // ── Hebrew ───────────────────────────────────────────────────────
  aleph: 'ℵ', beth: 'ℶ', gimel: 'ℷ', daleth: 'ℸ',

  // ── Binary operators ─────────────────────────────────────────────
  pm: '±', mp: '∓', times: '×', div: '÷', cdot: '⋅', ast: '∗', star: '⋆',
  circ: '∘', bullet: '∙', oplus: '⊕', ominus: '⊖', otimes: '⊗', oslash: '⊘',
  odot: '⊙', circleddash: '⊝', circledast: '⊛', circledcirc: '⊚',
  dagger: '†', ddagger: '‡', amalg: '⨿', cap: '∩', cup: '∪', uplus: '⊎',
  sqcap: '⊓', sqcup: '⊔', vee: '∨', wedge: '∧', setminus: '∖',
  smallsetminus: '∖', wr: '≀', diamond: '⋄', Diamond: '◇',
  bigtriangleup: '△', bigtriangledown: '▽', triangleleft: '◁', triangleright: '▷',
  lhd: '⊲', rhd: '⊳', unlhd: '⊴', unrhd: '⊵',
  boxplus: '⊞', boxminus: '⊟', boxtimes: '⊠', boxdot: '⊡',
  ltimes: '⋉', rtimes: '⋊', leftthreetimes: '⋋', rightthreetimes: '⋌',
  curlywedge: '⋏', curlyvee: '⋎', divideontimes: '⋇', centerdot: '·',
  intercal: '⊺', dotplus: '∔', barwedge: '⊼', veebar: '⊻', doublebarwedge: '⩞',

  // ── Relations ────────────────────────────────────────────────────
  leq: '≤', le: '≤', geq: '≥', ge: '≥', neq: '≠', ne: '≠',
  equiv: '≡', nequiv: '≢', sim: '∼', nsim: '≁', simeq: '≃', approx: '≈',
  approxeq: '≊', cong: '≅', ncong: '≇', asymp: '≍', doteq: '≐',
  doteqdot: '≑', propto: '∝', prec: '≺', succ: '≻', nprec: '⊀', nsucc: '⊁',
  preceq: '⪯', succeq: '⪰', precsim: '≾', succsim: '≿',
  ll: '≪', gg: '≫', lll: '⋘', ggg: '⋙',
  subset: '⊂', supset: '⊃', subseteq: '⊆', supseteq: '⊇',
  subsetneq: '⊊', supsetneq: '⊋', nsubseteq: '⊈', nsupseteq: '⊉',
  nsubset: '⊄', nsupset: '⊅',
  sqsubset: '⊏', sqsupset: '⊐', sqsubseteq: '⊑', sqsupseteq: '⊒',
  in: '∈', ni: '∋', owns: '∋', notin: '∉',
  vdash: '⊢', dashv: '⊣', models: '⊨', vDash: '⊨', Vdash: '⊩', Vvdash: '⊪',
  nvdash: '⊬', nvDash: '⊭', perp: '⊥', mid: '∣', nmid: '∤',
  parallel: '∥', nparallel: '∦', shortmid: '∣',
  smile: '⌣', frown: '⌢', bowtie: '⋈', between: '≬', pitchfork: '⋔',
  lessdot: '⋖', gtrdot: '⋗', leqslant: '⩽', geqslant: '⩾',
  eqslantless: '⪕', eqslantgtr: '⪖', nless: '≮', ngtr: '≯', nleq: '≰', ngeq: '≱',
  lesssim: '≲', gtrsim: '≳', lessgtr: '≶', gtrless: '≷',
  lesseqgtr: '⋚', gtreqless: '⋛', triangleq: '≜',
  risingdotseq: '≓', fallingdotseq: '≒', eqcirc: '≖', circeq: '≗',
  therefore: '∴', because: '∵', eqsim: '≂',
  coloneqq: '≔', eqqcolon: '≕', Coloneqq: '⩴', colon: ':',
  leqq: '≦', geqq: '≧', lneq: '⪇', gneq: '⪈', lneqq: '≨', gneqq: '≩',
  lessapprox: '⪅', gtrapprox: '⪆', lesseqqgtr: '⪋', gtreqqless: '⪌',
  precapprox: '⪷', succapprox: '⪸', curlyeqprec: '⋞', curlyeqsucc: '⋟',
  precnsim: '⋨', succnsim: '⋩', lnsim: '⋦', gnsim: '⋧',
  thicksim: '∼', thickapprox: '≈', backsim: '∽', backsimeq: '⋍',
  Subset: '⋐', Supset: '⋑', subsetneqq: '⫋', supsetneqq: '⫌',
  Cap: '⋒', Cup: '⋓', doublecap: '⋒', doublecup: '⋓',
  vartriangleleft: '⊲', vartriangleright: '⊳',
  trianglelefteq: '⊴', trianglerighteq: '⊵',
  ntriangleleft: '⋪', ntriangleright: '⋫',
  ntrianglelefteq: '⋬', ntrianglerighteq: '⋭',
  nVdash: '⊮', nshortmid: '∤', shortparallel: '∥',
  smallfrown: '⌢', smallsmile: '⌣',

  // ── Arrows ───────────────────────────────────────────────────────
  to: '→', rightarrow: '→', Rightarrow: '⇒', leftarrow: '←', gets: '←',
  Leftarrow: '⇐', leftrightarrow: '↔', Leftrightarrow: '⇔',
  mapsto: '↦', longmapsto: '⟼', mapsfrom: '↤',
  longrightarrow: '⟶', longleftarrow: '⟵', Longrightarrow: '⟹',
  Longleftarrow: '⟸', longleftrightarrow: '⟷', Longleftrightarrow: '⟺',
  implies: '⟹', impliedby: '⟸', iff: '⟺',
  uparrow: '↑', downarrow: '↓', updownarrow: '↕',
  Uparrow: '⇑', Downarrow: '⇓', Updownarrow: '⇕',
  nearrow: '↗', searrow: '↘', swarrow: '↙', nwarrow: '↖',
  hookrightarrow: '↪', hookleftarrow: '↩',
  rightharpoonup: '⇀', rightharpoondown: '⇁',
  leftharpoonup: '↼', leftharpoondown: '↽',
  rightleftharpoons: '⇌', leftrightharpoons: '⇋',
  rightrightarrows: '⇉', leftleftarrows: '⇇', upuparrows: '⇈', downdownarrows: '⇊',
  rightleftarrows: '⇄', leftrightarrows: '⇆',
  rightarrowtail: '↣', leftarrowtail: '↢',
  twoheadrightarrow: '↠', twoheadleftarrow: '↞',
  nrightarrow: '↛', nleftarrow: '↚', nRightarrow: '⇏', nLeftarrow: '⇍',
  nleftrightarrow: '↮', nLeftrightarrow: '⇎',
  rightsquigarrow: '⇝', leadsto: '⇝', leftrightsquigarrow: '↭',
  curvearrowright: '↷', curvearrowleft: '↶',
  circlearrowright: '↻', circlearrowleft: '↺',
  Rrightarrow: '⇛', Lleftarrow: '⇚',
  upharpoonright: '↾', upharpoonleft: '↿',
  downharpoonright: '⇂', downharpoonleft: '⇃', multimap: '⊸',

  // ── Logic, sets, misc symbols ────────────────────────────────────
  infty: '∞', partial: '∂', nabla: '∇', forall: '∀', exists: '∃', nexists: '∄',
  emptyset: '∅', varnothing: '∅', neg: '¬', lnot: '¬', land: '∧', lor: '∨',
  top: '⊤', bot: '⊥', angle: '∠', measuredangle: '∡', sphericalangle: '∢',
  triangle: '△', square: '□', Box: '□', blacksquare: '■',
  lozenge: '◊', blacklozenge: '⧫', bigstar: '★', surd: '√',
  flat: '♭', natural: '♮', sharp: '♯',
  clubsuit: '♣', diamondsuit: '♢', heartsuit: '♡', spadesuit: '♠',
  Re: 'ℜ', Im: 'ℑ', wp: '℘', ell: 'ℓ', hbar: 'ℏ', hslash: 'ℏ',
  imath: 'ı', jmath: 'ȷ', Bbbk: '𝕜', complement: '∁', eth: 'ð', mho: '℧',
  Finv: 'Ⅎ', Game: '⅁', circledS: 'Ⓢ',
  prime: '′', backprime: '‵', dprime: '″', trprime: '‴',
  degree: '°', copyright: '©', textregistered: '®', texttrademark: '™',
  pounds: '£', yen: '¥', euro: '€', textyen: '¥', textsterling: '£',
  S: '§', P: '¶', dag: '†', ddag: '‡',
  checkmark: '✓', maltese: '✠', dashleftarrow: '⇠', dashrightarrow: '⇢',
  backslash: '\\', bigcirc: '◯',
  looparrowleft: '↫', looparrowright: '↬', restriction: '↾',
  blacktriangle: '▲', blacktriangledown: '▼',
  blacktriangleleft: '◀', blacktriangleright: '▶',
  vartriangle: '△', triangledown: '▽',
  diagup: '╱', diagdown: '╲', circledR: '®', increment: '∆',
  female: '♀', male: '♂', And: '&', lparen: '(', rparen: ')',
  intop: '∫', smallint: '∫',

  // ── Text-mode letters and symbols (common in prose) ─────────────
  ae: 'æ', AE: 'Æ', oe: 'œ', OE: 'Œ', ss: 'ß', aa: 'å', AA: 'Å',
  o: 'ø', O: 'Ø', l: 'ł', L: 'Ł', dh: 'ð', DH: 'Ð', th: 'þ', TH: 'Þ',
  dj: 'đ', DJ: 'Đ', ng: 'ŋ', NG: 'Ŋ',
  textwon: '₩', textcent: '¢', textdollar: '$', texteuro: '€',
  textdegree: '°', textmu: 'µ', textperthousand: '‰', permil: '‰',
  textbullet: '•', textemdash: '—', textendash: '–',
  textquotedblleft: '“', textquotedblright: '”',
  textquoteleft: '‘', textquoteright: '’', textellipsis: '…',
  textasciitilde: '~', textasciicircum: '^', textbackslash: '\\',
  textunderscore: '_', textbar: '|', textless: '<', textgreater: '>',
  textexclamdown: '¡', textquestiondown: '¿',
  guillemotleft: '«', guillemotright: '»',
  textonehalf: '½', textonequarter: '¼', textthreequarters: '¾',
  textordfeminine: 'ª', textordmasculine: 'º',
  textpm: '±', texttimes: '×', textdiv: '÷',
  textsection: '§', textparagraph: '¶', textperiodcentered: '·',
  textvisiblespace: '␣', textreferencemark: '※', textinterrobang: '‽',
  textcopyright: '©', textnumero: '№', textcelsius: '℃',

  // ── Upright greek (upgreek package) ──────────────────────────────
  upalpha: 'α', upbeta: 'β', upgamma: 'γ', updelta: 'δ', upepsilon: 'ϵ',
  upzeta: 'ζ', upeta: 'η', uptheta: 'θ', upiota: 'ι', upkappa: 'κ',
  uplambda: 'λ', upmu: 'μ', upnu: 'ν', upxi: 'ξ', upomicron: 'ο',
  uppi: 'π', uprho: 'ρ', upsigma: 'σ', uptau: 'τ', upupsilon: 'υ',
  upphi: 'ϕ', upvarphi: 'φ', upchi: 'χ', uppsi: 'ψ', upomega: 'ω',

  // ── Ellipses ─────────────────────────────────────────────────────
  ldots: '…', dots: '…', dotsc: '…', cdots: '⋯', dotsb: '⋯',
  vdots: '⋮', ddots: '⋱', dotsi: '⋯', dotso: '…', cdotp: '·',

  // ── Big operators (rendered inline; limits are handled separately) ─
  sum: '∑', prod: '∏', coprod: '∐',
  int: '∫', iint: '∬', iiint: '∭', iiiint: '⨌', idotsint: '∫⋯∫',
  oint: '∮', oiint: '∯', oiiint: '∰',
  bigcap: '⋂', bigcup: '⋃', bigsqcup: '⨆', bigvee: '⋁', bigwedge: '⋀',
  bigodot: '⨀', bigoplus: '⨁', bigotimes: '⨂', biguplus: '⨄',

  // ── Delimiters ───────────────────────────────────────────────────
  langle: '⟨', rangle: '⟩', lceil: '⌈', rceil: '⌉', lfloor: '⌊', rfloor: '⌋',
  lbrace: '{', rbrace: '}', lbrack: '[', rbrack: ']',
  vert: '|', Vert: '‖', lvert: '|', rvert: '|', lVert: '‖', rVert: '‖',
  llbracket: '⟦', rrbracket: '⟧', ulcorner: '⌜', urcorner: '⌝',
  llcorner: '⌞', lrcorner: '⌟',

  // ── Escaped literals and control symbols ─────────────────────────
  '%': '%', '&': '&', '#': '#', '_': '_', '$': '$', '{': '{', '}': '}',
  '|': '‖', // \| is the double vertical line

  // ── Spacing ──────────────────────────────────────────────────────
  quad: ' ', qquad: '  ',
  ',': ' ', ':': ' ', ';': ' ', '!': '', ' ': ' ',
  thinspace: ' ', enspace: ' ', negthinspace: '',
};

/** Named functions: rendered upright, and a space is kept before a following letter. */
export const FUNCTIONS = new Set([
  'sin', 'cos', 'tan', 'cot', 'sec', 'csc',
  'arcsin', 'arccos', 'arctan', 'arccot',
  'sinh', 'cosh', 'tanh', 'coth',
  'log', 'ln', 'lg', 'exp',
  'det', 'dim', 'ker', 'deg', 'gcd', 'hom', 'Pr', 'arg', 'mod', 'bmod',
]);

/** Operators that take limits above/below — those limits cannot go inline. */
export const LIMIT_OPS = new Set([
  'sum', 'prod', 'coprod',
  'int', 'iint', 'iiint', 'iiiint', 'oint', 'oiint', 'oiiint',
  'bigcap', 'bigcup', 'bigsqcup', 'bigvee', 'bigwedge',
  'bigodot', 'bigoplus', 'bigotimes', 'biguplus',
  'lim', 'limsup', 'liminf', 'max', 'min', 'sup', 'inf',
  'argmax', 'argmin', 'injlim', 'projlim', 'varliminf', 'varlimsup',
  'varinjlim', 'varprojlim',
]);

/** Limit operators that are words rather than glyphs. */
export const LIMIT_OP_TEXT: Record<string, string> = {
  lim: 'lim', limsup: 'lim sup', liminf: 'lim inf',
  max: 'max', min: 'min', sup: 'sup', inf: 'inf',
  argmax: 'arg max', argmin: 'arg min',
  injlim: 'inj lim', projlim: 'proj lim',
  varliminf: 'lim inf', varlimsup: 'lim sup',
  varinjlim: 'inj lim', varprojlim: 'proj lim',
};

/** Commands that only affect layout and can be dropped without loss. */
export const IGNORED_COMMANDS = new Set([
  'left', 'right', 'middle',
  'big', 'Big', 'bigg', 'Bigg',
  'bigl', 'Bigl', 'biggl', 'Biggl',
  'bigr', 'Bigr', 'biggr', 'Biggr',
  'bigm', 'Bigm', 'biggm', 'Biggm',
  'limits', 'nolimits', 'displaystyle', 'textstyle',
  'scriptstyle', 'scriptscriptstyle',
  'mathstrut', 'strut',
  'notag', 'nonumber', 'nolinebreak', 'allowbreak',
  'mathopen', 'mathclose', 'mathrel', 'mathbin', 'mathord', 'mathpunct',
]);

/** Commands whose single argument is discarded along with the command. */
export const DISCARD_ARG_COMMANDS = new Set([
  'phantom', 'hphantom', 'vphantom', 'label', 'tag', 'hspace', 'vspace',
]);

/** Total number of no-argument commands recognised. */
export const SYMBOL_COUNT = Object.keys(SYMBOLS).length + FUNCTIONS.size;
