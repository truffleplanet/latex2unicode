#!/usr/bin/env bash
# Rebuild src/fonts/sheet-sans.woff2 — a subset of Pretendard covering only the
# glyphs this UI's chrome uses.
#
# Why subset at all: the full Korean variable font is 2 MB, and even Pretendard's
# own dynamic-subset files transfer ~350 KB for this page, because Hangul
# syllables scatter across many unicode-range chunks. The glyphs we actually
# need fit in ~70 KB.
#
# Why the name changes: under the SIL Open Font License 1.1, a subset is a
# "Modified Version", and clause 3 forbids a Modified Version from presenting
# itself under the reserved name "Pretendard". The family is therefore
# "Sheet Sans"; the design is Pretendard's and is credited in
# src/fonts/LICENSE.txt, the README, and the page footer.
#
# Run after adding Korean text to the UI:
#   npm run font
#
# Requires: pip install fonttools brotli
set -euo pipefail

cd "$(dirname "$0")/.."

VERSION="${PRETENDARD_VERSION:-1.3.9}"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

echo "fetching pretendard@$VERSION"
npm pack "pretendard@$VERSION" --pack-destination "$WORK" >/dev/null
tar xzf "$WORK"/pretendard-*.tgz -C "$WORK" \
  package/dist/web/variable/woff2/PretendardVariable.woff2 \
  package/dist/LICENSE.txt

echo "subsetting to scripts/font-charset.txt"
mkdir -p src/fonts
pyftsubset "$WORK/package/dist/web/variable/woff2/PretendardVariable.woff2" \
  --output-file=src/fonts/sheet-sans.woff2 \
  --flavor=woff2 \
  --layout-features='*' \
  --no-hinting \
  --unicodes='U+0020-007E' \
  --text-file=scripts/font-charset.txt

# The OFL requires the licence to travel with the font.
{
  cat <<'NOTICE'
"Sheet Sans" is a subset of Pretendard, reduced to the glyphs used by this
project's interface. It is a Modified Version under the SIL Open Font License
1.1, and therefore does not carry the reserved font name "Pretendard".

Original font: Pretendard by Kil Hyung-jin
  https://github.com/orioncactus/pretendard
Rebuild with: npm run font   (see scripts/subset-font.sh)

────────────────────────────────────────────────────────────────────────────

NOTICE
  cat "$WORK/package/dist/LICENSE.txt"
} > src/fonts/LICENSE.txt

ls -l src/fonts/sheet-sans.woff2
