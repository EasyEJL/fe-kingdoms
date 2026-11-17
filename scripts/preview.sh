#!/bin/sh
set -eu
root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
image=${1:-fe-kingdoms-toolchain:26.5.0}
port=${PORT:-8771}
cd "$root"
docker image inspect "$image" >/dev/null
docker run --rm --pull never --network none -v "$root:/work:ro" -w /work "$image" python3 scripts/check_toolchain.py
docker run --rm --pull never --network none -v "$root:/work" -w /work "$image" python3 scripts/build.py
printf 'Open http://localhost:%s (Ctrl+C stops this server).\n' "$port"
docker run --rm --pull never -p "127.0.0.1:$port:$port" -v "$root:/work:ro" -w /work "$image" python3 server.py --host 0.0.0.0 --port "$port"
