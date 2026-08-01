/**
 * Code spans are never notation, whatever notation the document uses: a block
 * full of `->` and `<=` is source, not mathematics. Both front-ends skip them
 * with these helpers so the two cannot disagree about what counts as code.
 */

/** End of the fenced block opening at `i`, or the end of the source. */
export function skipFence(src: string, i: number): number {
  const close = src.indexOf('```', i + 3);
  return close === -1 ? src.length : close + 3;
}

/**
 * End of the inline code span opening at `i`, or -1 when it never closes on
 * this line. CommonMark closes a span with a backtick run of the opening
 * length, so ``` ``a ` b`` ``` is one span.
 */
export function skipInlineCode(src: string, i: number): number {
  let run = 1;
  while (src[i + run] === '`') run++;
  const nl = src.indexOf('\n', i + run);
  const limit = nl === -1 ? src.length : nl;
  for (let j = i + run; j < limit; j++) {
    if (src[j] !== '`') continue;
    let k = 1;
    while (src[j + k] === '`') k++;
    if (k === run) return j + run;
    j += k - 1;
  }
  return -1;
}

/** Number of backticks opening a run at `i`. */
export function backtickRun(src: string, i: number): number {
  let run = 0;
  while (src[i + run] === '`') run++;
  return run;
}
