/** What to do with a construct Unicode cannot express. */
export type FallbackPolicy = 'keep' | 'flatten';

/**
 * Which notation the input is written in. Chosen explicitly, never guessed:
 * misreading prose as notation corrupts the document silently.
 */
export type Mode = 'latex' | 'ascii';

export interface ConvertOptions {
  /** The notation to read. */
  mode: Mode;
  /** Applied to every unconvertible construct that has no explicit override. */
  defaultPolicy: FallbackPolicy;
  /** Per-construct overrides, keyed by the stable issue id. */
  overrides: Record<string, FallbackPolicy>;
  /** Render math-mode hyphens as U+2212 MINUS SIGN. */
  prettyMinus: boolean;
  /** Convert bare `\command` occurrences found outside math delimiters. */
  convertBareCommands: boolean;
  /** Convert TeX prose idioms (`---`, `--`, ``` `` ''  ```) in the surrounding text. */
  textLigatures: boolean;
}

export const defaultOptions: ConvertOptions = {
  mode: 'latex',
  defaultPolicy: 'keep',
  overrides: {},
  prettyMinus: true,
  convertBareCommands: true,
  textLigatures: false,
};

/** A contiguous run of output text, tagged with where it came from. */
export interface Piece {
  text: string;
  /** `text` = untouched prose, `math` = converted, `fallback` = could not convert. */
  kind: 'text' | 'math' | 'fallback';
  /** Set on `fallback` pieces; links back to an {@link Issue}. */
  issueId?: string;
}

/**
 * Why a construct could not be converted. Stable identifiers so a UI can
 * present its own wording — the core stays language-neutral.
 */
export type IssueCode =
  | 'unknown-command'
  | 'operator-limits'
  | 'script-base'
  | 'no-superscript'
  | 'no-subscript'
  | 'stacked-fraction'
  | 'binomial'
  | 'radical-degree'
  | 'radicand'
  | 'accent-base'
  | 'accent-body'
  | 'style-alphabet'
  | 'env-grid'
  | 'env-lines';

export interface Issue {
  /** Stable across re-conversions of the same input, so overrides survive. */
  id: string;
  /** Machine-readable cause, for localised or custom messages. */
  code: IssueCode;
  /**
   * The specific thing that failed — a command name, the characters with no
   * script form, a grid size. Interpolated into presentation messages.
   */
  detail: string;
  /** Human-readable explanation of why Unicode cannot express this. */
  reason: string;
  /** The original LaTeX source of the construct. */
  source: string;
  /** 1-based line number in the original input. */
  line: number;
  /** The policy that was applied for this run. */
  policy: FallbackPolicy;
  /** What `keep` produces (the original source). */
  keepPreview: string;
  /** What `flatten` produces. */
  flattenPreview: string;
}

export interface ConvertResult {
  pieces: Piece[];
  issues: Issue[];
  /** Final plain-text output. */
  text: string;
  stats: {
    /** Number of LaTeX regions detected. */
    segments: number;
    /** Number of unconvertible constructs. */
    issues: number;
    /** Source characters in notation regions whose rendered output changed. */
    convertedChars: number;
  };
}
