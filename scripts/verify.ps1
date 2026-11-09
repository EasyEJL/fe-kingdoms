$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$image = 'sha256:32e644f1599ac63427a9e545d643ad75adee6f14328c4b7d1be01e3bf728391d'
Set-Location $root
$actual = & docker image inspect $image --format '{{.Id}}'
if ($LASTEXITCODE -ne 0 -or $actual.Trim() -ne $image) { throw 'Pinned image unavailable.' }
& node tests/test_ui.js
if ($LASTEXITCODE -ne 0) { throw 'UI unit tests failed.' }
& docker run --rm --network none -v "${root}:/work" -w /work $image python3 scripts/verify.py
if ($LASTEXITCODE -ne 0) { throw 'Engine/HTTP verification failed.' }
Write-Host 'Verification passed. Browser interaction and human playtesting remain separate checks.'
