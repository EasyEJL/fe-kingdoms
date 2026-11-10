# Launch this isolated checkout, never replace an older live preview.
$ErrorActionPreference = 'Stop'
& (Join-Path $PSScriptRoot 'scripts\preview.ps1')
