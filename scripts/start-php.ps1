
$ErrorActionPreference = 'Stop'

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path

$php = 'C:\Users\msn\PhpstormProjects\php8.3.9\php.exe'
$php1 = 'php.exe'
$authFile = Join-Path $projectRoot '.firebase-foe-manager-auth.json'
$rateDir = Join-Path $env:TEMP 'foe-manager-rate-limit'

if (-not (Test-Path -LiteralPath $php -PathType Leaf)) {
    throw "PHP nicht gefunden: $php"
}

if (-not (Test-Path -LiteralPath $authFile -PathType Leaf)) {
    throw "Firebase-Datei nicht gefunden: $authFile"
}

New-Item -ItemType Directory -Path $rateDir -Force | Out-Null

$env:FOE_FIREBASE_AUTH_FILE = $authFile
$env:FOE_RATE_LIMIT_DIR = $rateDir

Write-Host "PHP:       $php"
Write-Host "Webroot:   $projectRoot"
Write-Host "API:       http://127.0.0.1:8000/foe_city_import_iis.php"
Write-Host "Firebase:  $authFile"
Write-Host "RateLimit: $rateDir"
$caBundle = 'C:\Users\msn\PhpstormProjects\php8.3.9\cacert.pem'

if (-not (Test-Path -LiteralPath $caBundle -PathType Leaf)) {
    throw "CA-Zertifikatsdatei nicht gefunden: $caBundle"
}

$env:FOE_CA_BUNDLE = $caBundle
$webRoot = Join-Path $projectRoot 'src'

& $php -S 127.0.0.1:8000 -t $webRoot

exit $LASTEXITCODE
