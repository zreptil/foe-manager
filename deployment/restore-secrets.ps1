#requires -Version 5.1
[CmdletBinding()]
param(
  [Parameter(Mandatory=$true)][string]$DestinationDirectory,
  [string]$AgeExe = 'age',
  [string]$ProjectRoot = (Split-Path -Parent $PSScriptRoot),
  [switch]$Overwrite
)
$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath($ProjectRoot)
$age = Get-Command $AgeExe -ErrorAction Stop
$sourceDir = Join-Path $root 'config\secrets'
$names = @('.firebase-andi-auth.json', '.firebase-foe-manager-auth.json')
if (-not (Test-Path -LiteralPath $DestinationDirectory -PathType Container)) { throw 'Zielverzeichnis existiert nicht. Bitte zuerst sicher anlegen.' }
$destinationDir = (Resolve-Path -LiteralPath $DestinationDirectory).Path
foreach ($name in $names) {
  $src = Join-Path $sourceDir ($name + '.age')
  $dest = Join-Path $destinationDir $name
  if (-not (Test-Path -LiteralPath $src -PathType Leaf)) { throw "Verschluesselte Datei fehlt: $src" }
  if ((Test-Path -LiteralPath $dest) -and -not $Overwrite) { throw "Zieldatei existiert bereits: $dest (nur mit -Overwrite ersetzen)" }
}
foreach ($name in $names) {
  $src = Join-Path $sourceDir ($name + '.age')
  $dest = Join-Path $destinationDir $name
  $tmp = Join-Path $destinationDir ([IO.Path]::GetRandomFileName() + '.restore.tmp')
  try {
    Write-Host "Entschluessele $name (Passphrase eingeben) ..."
    & $age.Source -d -o $tmp $src
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $tmp)) { throw "Entschluesselung fehlgeschlagen: $name" }
    $null = Get-Content -LiteralPath $tmp -Raw | ConvertFrom-Json
    Move-Item -LiteralPath $tmp -Destination $dest -Force
    Write-Host "OK: $dest"
  } finally { if (Test-Path -LiteralPath $tmp) { Remove-Item -LiteralPath $tmp -Force } }
}
Write-Host 'Wiederherstellung abgeschlossen. Klartextdateien niemals committen.'
