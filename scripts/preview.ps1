# Isolated local visual preview. Does not stop or replace the main game.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$port = 8767
$name = 'fe-kingdoms-campaign'
$image = (Get-Content (Join-Path $root 'toolchain.lock.json') | ConvertFrom-Json).measured_image_id
$running = & docker ps --filter "name=^/$name`$" --format '{{.ID}}'
if ($LASTEXITCODE -ne 0) { throw 'Docker is unavailable.' }
if ($running) {
    $info = (& docker inspect $name | ConvertFrom-Json)[0]
    if ($info.Mounts[0].Source -ne $root) { throw 'Preview name is already used by another checkout; leave it running and inspect it.' }
    Write-Host "Preview already running: http://localhost:$port. Existing games on ports 8765 and 8766 are unchanged."
    exit 0
}
if (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) { throw "Port $port is in use; no existing process was stopped." }
& docker run --rm --pull never --network none -v "${root}:/work" -w /work $image python3 scripts/build.py
if ($LASTEXITCODE -ne 0) { throw 'Fe preview build failed.' }
Write-Host "Open http://localhost:$port. This origin has separate browser saves from ports 8765 and 8766."
Write-Host 'Use Save replay in the original game, then Load replay here to copy a match. No automatic transfer is performed.'
& docker run --rm --pull never --name $name -p "127.0.0.1:${port}:$port" -v "${root}:/work:ro" -w /work $image python3 server.py --host 0.0.0.0 --port $port
if ($LASTEXITCODE -ne 0) { throw 'Preview server exited with an error.' }
