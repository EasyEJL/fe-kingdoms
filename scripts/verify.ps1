param([string]$Image = 'sha256:32e644f1599ac63427a9e545d643ad75adee6f14328c4b7d1be01e3bf728391d')
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
& docker image inspect $Image --format '{{.Id}}' | Out-Null
if ($LASTEXITCODE -ne 0) { throw "Toolchain image unavailable: $Image" }
& docker run --rm --pull never --network none -v "${root}:/work:ro" -w /work $Image python3 scripts/check_toolchain.py
if ($LASTEXITCODE -ne 0) { throw 'Toolchain validation failed.' }
& node tests/test_ui.js
if ($LASTEXITCODE -ne 0) { throw 'UI unit tests failed.' }
& docker run --rm --pull never --network none -v "${root}:/work" -w /work $Image python3 scripts/verify.py
if ($LASTEXITCODE -ne 0) { throw 'Engine/HTTP verification failed.' }
Write-Host 'Verification passed. Browser interaction and human playtesting remain separate checks.'
