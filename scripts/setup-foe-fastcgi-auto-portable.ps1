#requires -Version 5.1
<#
.SYNOPSIS
  Configure the FoE IIS/Plesk PHP FastCGI application and bind the site's PHP handler to it.
.EXAMPLE
  .\setup-foe-fastcgi-auto-portable.ps1 -WhatIf
.EXAMPLE
  .\setup-foe-fastcgi-auto-portable.ps1
.NOTES
  Run in elevated Windows PowerShell 5.1. Does not modify global/shared PHP handlers.
#>
[CmdletBinding(SupportsShouldProcess=$true, ConfirmImpact='Medium')]
param(
    [string]$SiteName = 'foe-manager.zreptil.de',
    [string]$PrivateDirectory,
    [switch]$SkipBackup
)

$ErrorActionPreference = 'Stop'
Import-Module WebAdministration -ErrorAction Stop
try {
    Add-Type -AssemblyName Microsoft.Web.Administration -ErrorAction Stop
} catch {
    $dll = Join-Path $env:windir 'System32\inetsrv\Microsoft.Web.Administration.dll'
    if (-not (Test-Path -LiteralPath $dll -PathType Leaf)) { throw "IIS-Verwaltungsbibliothek fehlt: $dll" }
    Add-Type -Path $dll -ErrorAction Stop
}
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw 'PowerShell bitte als Administrator starten.'
}

$site = Get-Website -Name $SiteName -ErrorAction Stop
if ($null -eq $site) { throw "IIS-Website nicht gefunden: $SiteName" }
$siteId = [string]$site.ID

# Read effective PHP handlers, and only accept one unambiguous executable.
$handlers = @(Get-WebConfiguration -PSPath "IIS:\Sites\$SiteName" -Filter 'system.webServer/handlers/add' |
    Where-Object { ([string]$_.modules -match '(^|,)\s*FastCgiModule\s*(,|$)') -and
                   ([string]$_.path -match '\.php') -and
                   ([string]$_.scriptProcessor -match '(?i)php-cgi\.exe') })
# Plesk may register multiple matching PHP handlers. Prefer the known PHP-php
# handler, but never choose arbitrarily if that name is absent or duplicated.
$namedHandlers = @($handlers | Where-Object { [string]$_.name -eq 'PHP-php' })
if ($namedHandlers.Count -ne 1) {
    $details = ($handlers | ForEach-Object { "[$($_.name): $($_.path) -> $($_.scriptProcessor)]" }) -join '; '
    throw "PHP-Handler 'PHP-php' nicht eindeutig gefunden ($($namedHandlers.Count)); Kandidaten: $details"
}
$selectedHandler = $namedHandlers[0]
if ($handlers.Count -gt 1) {
    Write-Warning "Es wurden $($handlers.Count) PHP-FastCGI-Handler gefunden. Nur 'PHP-php' wird bearbeitet."
    foreach ($other in $handlers | Where-Object { [string]$_.name -ne 'PHP-php' }) {
        Write-Host "Unveraendert: $($other.name) ($($other.path)) -> $($other.scriptProcessor)"
    }
}
$handlerName = [string]$selectedHandler.name
$oldProcessor = [string]$selectedHandler.scriptProcessor
$parts = $oldProcessor -split '\|', 2
$phpExe = $parts[0]
$oldArgs = if ($parts.Count -gt 1) { $parts[1] } else { '' }
if (-not (Test-Path -LiteralPath $phpExe -PathType Leaf)) { throw "PHP-Programm fehlt: $phpExe" }

# The Plesk site-specific FastCGI registration must already exist. Never create or edit shared entries.
$apps = @(Get-WebConfiguration -PSPath 'MACHINE/WEBROOT/APPHOST' -Filter 'system.webServer/fastCgi/application')
$idRegex = '(?i)(?:^|\s)-d\s*siteId\s*=\s*' + [regex]::Escape($siteId) + '(?:\s|$)'
$siteApps = @($apps | Where-Object {
    ([string]$_.fullPath -ieq $phpExe) -and ([string]$_.arguments -match $idRegex)
})
if ($siteApps.Count -ne 1) { throw "FastCGI-Eintrag fuer Site-ID $siteId und PHP '$phpExe' nicht eindeutig ($($siteApps.Count)). Abbruch." }
$phpArgs = [string]$siteApps[0].arguments
if ($oldArgs -and $oldArgs -cne $phpArgs) {
    throw "PHP-Handler hat abweichende Argumente '$oldArgs'. Automatische Aenderung aus Sicherheitsgruenden abgebrochen."
}
$newProcessor = "$phpExe|$phpArgs"

if (-not $PrivateDirectory) {
    $root = [Environment]::ExpandEnvironmentVariables([string]$site.PhysicalPath)
    if ($root -notmatch '(?i)^(.*[\\/])websites[\\/]') {
        throw "Webroot '$root' liegt nicht unter 'websites'. Bitte -PrivateDirectory angeben."
    }
    $httpdocs = $Matches[1].TrimEnd('\','/')
    $PrivateDirectory = Join-Path (Join-Path $httpdocs 'App_Data') $SiteName
}
$PrivateDirectory = [IO.Path]::GetFullPath($PrivateDirectory)
$auth = Join-Path $PrivateDirectory '.firebase-foe-manager-auth.json'
$template = Join-Path $PrivateDirectory 'foe-city-template.json'
$rateDir = Join-Path $PrivateDirectory 'rate-limit'
foreach ($required in @($auth, $template)) {
    if (-not (Test-Path -LiteralPath $required -PathType Leaf)) { throw "Erforderliche Datei fehlt: $required" }
}
$values = [ordered]@{
    FOE_FIREBASE_AUTH_FILE = $auth
    FOE_CITY_TEMPLATE_FILE = $template
    FOE_RATE_LIMIT_DIR = $rateDir
}

Write-Host "Website:          $SiteName (ID $siteId)"
Write-Host "PHP-Handler:      $handlerName"
Write-Host "Aktueller Handler: $oldProcessor"
Write-Host "Ziel-Handler:     $newProcessor"
Write-Host "Privatordner:     $PrivateDirectory"

$manager = New-Object Microsoft.Web.Administration.ServerManager
try {
    $config = $manager.GetApplicationHostConfiguration()
    $fastCgi = $config.GetSection('system.webServer/fastCgi').GetCollection()
    $fastApp = $null
    foreach ($candidate in $fastCgi) {
        if (([string]$candidate['fullPath'] -ieq $phpExe) -and ([string]$candidate['arguments'] -ceq $phpArgs)) {
            $fastApp = $candidate; break
        }
    }
    if ($null -eq $fastApp) { throw 'Websitespezifische FastCGI-Anwendung in applicationHost.config nicht gefunden.' }
    $envs = $fastApp.GetChildElement('environmentVariables').GetCollection()
    $pending = @()
    foreach ($name in $values.Keys) {
        $existing = $null
        foreach ($entry in $envs) {
            if ([string]$entry['name'] -ceq $name) { $existing = $entry; break }
        }
        $target = [string]$values[$name]
        if ($null -eq $existing) {
            Write-Host "NEU:       $name = $target"
            $pending += [pscustomobject]@{ Name=$name; Value=$target; Existing=$null }
        } elseif ([string]$existing['value'] -cne $target) {
            Write-Host "AENDERN:   $name = $target"
            $pending += [pscustomobject]@{ Name=$name; Value=$target; Existing=$existing }
        } else {
            Write-Host "OK:        $name = $target"
        }
    }

    # This handler was shown by IIS as a site-specific applicationHost.config <location> entry.
    # Require that it is actually stored there, to avoid accidentally editing inherited/global handlers.
    if ([string]$selectedHandler.ConfigurationPathType -ne 'Location' -or
        [string]$selectedHandler.PSPath -ne "MACHINE/WEBROOT/APPHOST/$SiteName") {
        throw 'PHP-Handler ist nicht als websitespezifischer applicationHost.config-Location-Eintrag nachgewiesen. Abbruch.'
    }
    $handlerSection = $config.GetSection('system.webServer/handlers', $SiteName)
    $handlerCollection = $handlerSection.GetCollection()
    $handlerElement = $null
    foreach ($entry in $handlerCollection) {
        if ([string]$entry['name'] -ceq $handlerName) { $handlerElement = $entry; break }
    }
    if ($null -eq $handlerElement) { throw "PHP-Handler '$handlerName' im websitespezifischen Location-Abschnitt nicht gefunden." }
    if ([string]$handlerElement['scriptProcessor'] -cne $oldProcessor) {
        throw 'Handlerwert hat sich seit der Abfrage geaendert. Bitte erneut ausfuehren.'
    }
    $changeHandler = $oldProcessor -cne $newProcessor
    if ($changeHandler) { Write-Host "AENDERN:   PHP-Handler scriptProcessor -> $newProcessor" }
    else { Write-Host 'OK:        PHP-Handler verweist auf websitespezifischen FastCGI-Eintrag.' }

    $total = $pending.Count + [int]$changeHandler
    if ($total -eq 0) {
        Write-Host 'Keine IIS-Konfigurationsaenderungen erforderlich.'
    } elseif ($PSCmdlet.ShouldProcess("IIS-Website $SiteName", "$total Aenderung(en) an FastCGI und PHP-Handler speichern")) {
        if (-not $SkipBackup) {
            $backupName = 'FoEFastCGI-' + (Get-Date -Format 'yyyyMMdd-HHmmss')
            $appcmd = Join-Path $env:windir 'System32\inetsrv\appcmd.exe'
            & $appcmd add backup $backupName | Out-Host
            if ($LASTEXITCODE -ne 0) { throw 'IIS-Backup fehlgeschlagen. Keine Aenderung gespeichert.' }
        }
        if (-not (Test-Path -LiteralPath $rateDir -PathType Container)) {
            New-Item -ItemType Directory -Path $rateDir -Force | Out-Null
        }
        foreach ($change in $pending) {
            if ($null -eq $change.Existing) {
                $newItem = $envs.CreateElement('environmentVariable')
                $newItem['name'] = $change.Name
                $newItem['value'] = $change.Value
                [void]$envs.Add($newItem)
            } else {
                $change.Existing['value'] = $change.Value
            }
        }
        if ($changeHandler) { $handlerElement['scriptProcessor'] = $newProcessor }
        $manager.CommitChanges()
        Write-Host "Fertig: $total IIS-Konfigurationsaenderung(en) gespeichert."
    }
} finally {
    if ($null -ne $manager) { $manager.Dispose() }
}
Write-Host 'Hinweis: PHP-Prozess ggf. neu starten; Umgebungsvariablen mit temporärem PHP-Test pruefen.'
Write-Host 'Hinweis: NTFS-Rechte fuer Firebase-Token und Rate-Limit-Verzeichnis separat pruefen.'
Write-Host 'Hinweis: Plesk kann die Handlerzuordnung bei Rekonfiguration zuruecksetzen.'
