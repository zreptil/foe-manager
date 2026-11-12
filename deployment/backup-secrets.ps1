#requires -Version 5.1
[CmdletBinding()]
param(
  [Parameter(Mandatory=$true)][string]$SourceDirectory,
  [string]$AgeExe = 'age',
  [string]$ProjectRoot = (Split-Path -Parent $PSScriptRoot)
)
$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath($ProjectRoot)
$source = (Resolve-Path -LiteralPath $SourceDirectory).Path
$gitignore = Join-Path $root '.gitignore'
if (-not (Test-Path -LiteralPath $gitignore)) { throw '.gitignore fehlt.' }
$ignore = Get-Content -LiteralPath $gitignore -Raw
if ($ignore -notmatch '(?m)^\s*(?:\*\*/)?\.firebase-\*-auth\.json\s*$') {
    throw 'Sicherheitsstopp: Firebase-Dateien sind nicht ausreichend ausgeschlossen.'
}
$age = Get-Command $AgeExe -ErrorAction Stop
$destinationDir = Join-Path $root 'config\secrets'
$names = @('.firebase-andi-auth.json', '.firebase-foe-manager-auth.json')
foreach ($name in $names) {
  $path = Join-Path $source $name
  if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { throw "Quelldatei fehlt: $path" }
  $null = Get-Content -LiteralPath $path -Raw | ConvertFrom-Json
}
New-Item -ItemType Directory -Path $destinationDir -Force | Out-Null
foreach ($name in $names) {
  $src = Join-Path $source $name
  $dest = Join-Path $destinationDir ($name + '.age')
  $tmp = Join-Path $destinationDir ([IO.Path]::GetRandomFileName() + '.age.tmp')
  try {
    Write-Host "Verschluessele $name (Passphrase eingeben) ..."
    & $age.Source -p -o $tmp $src
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $tmp) -or (Get-Item -LiteralPath $tmp).Length -eq 0) { throw "Verschluesselung fehlgeschlagen: $name" }
    # age passphrase files have an age-encryption.org header; do not print ciphertext or source.
    $header = [IO.File]::ReadAllLines($tmp)[0]
    if ($header -ne 'age-encryption.org/v1') { throw "Unerwartetes Dateiformat: $name" }
    Move-Item -LiteralPath $tmp -Destination $dest -Force
    Write-Host "OK: $dest"
  } finally { if (Test-Path -LiteralPath $tmp) { Remove-Item -LiteralPath $tmp -Force } }
}
Write-Host 'Fertig. Vor einem Commit nur die beiden .age-Dateien auswaehlen und die Aenderungsliste pruefen.'
