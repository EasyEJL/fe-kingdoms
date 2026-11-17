#!/bin/sh
set -eu
root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
image=${1:-fe-kingdoms-toolchain:26.5.0}
cd "$root"
docker image inspect "$image" >/dev/null
docker run --rm --pull never --network none -v "$root:/work:ro" -w /work "$image" python3 scripts/check_toolchain.py
node tests/test_ui.js
docker run --rm --pull never --network none -v "$root:/work" -w /work "$image" python3 scripts/verify.py
printf '%s\n' 'Verification passed. Browser interaction and human playtesting remain separate checks.'
