$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$image = 'sha256:32e644f1599ac63427a9e545d643ad75adee6f14328c4b7d1be01e3bf728391d'
$running = & docker ps --filter 'name=^/fe-kingdoms$' --format '{{.ID}}'
if ($LASTEXITCODE -eq 0 -and $running) { Write-Host 'Already running: http://localhost:8765. Stop with: docker stop fe-kingdoms'; exit 0 }
Write-Host 'Building the native Fe engine with the pinned toolchain...'
& docker run --rm --network none -v "${root}:/work" -w /work $image python3 scripts/build.py
if ($LASTEXITCODE -ne 0) { throw 'Fe build failed.' }
Write-Host 'Open http://localhost:8765 in your browser. Press Ctrl+C here to stop.'
& docker run --rm --name fe-kingdoms -p 127.0.0.1:8765:8765 -v "${root}:/work:ro" -w /work $image python3 server.py --host 0.0.0.0
if ($LASTEXITCODE -ne 0) { throw 'Game server exited with an error.' }
