#Requires -RunAsAdministrator
# Windows PowerShell 5.1 / IIS 8+; run elevated.
# Usage: .\setup-foe-iis-auto-complete.ps1 -SiteName 'foe-manager.zreptil.de'
# Place .firebase-foe-manager-auth.json next to this script. Optional -FirebaseAuthSource overrides it.
[CmdletBinding(SupportsShouldProcess=$true, ConfirmImpact='Medium')]
param(
    [Parameter(Mandatory=$true)]
    [ValidateNotNullOrEmpty()]
    [string]$SiteName,

    [Parameter()]
    [string]$FirebaseAuthSource
)

$ErrorActionPreference = 'Stop'
Import-Module WebAdministration -ErrorAction Stop
# Load IIS management DLL from disk; it is not always registered by assembly name.
$administrationDll = Join-Path $env:windir 'System32\inetsrv\Microsoft.Web.Administration.dll'
if (-not (Test-Path -LiteralPath $administrationDll -PathType Leaf)) {
    throw "IIS-Verwaltungsbibliothek nicht gefunden: $administrationDll. IIS-Verwaltungstools pruefen."
}
Add-Type -Path $administrationDll -ErrorAction Stop

function Set-PrivateAcl([string]$path, [string]$principal, [string]$permission, [bool]$isDirectory) {
    $acl = Get-Acl -LiteralPath $path
    # Remove inherited ACEs, rather than copying broad permissions from ProgramData.
    $acl.SetAccessRuleProtection($true, $false)
    foreach ($rule in @($acl.Access)) { [void]$acl.RemoveAccessRuleSpecific($rule) }
    $inherit = if ($isDirectory) {
        [System.Security.AccessControl.InheritanceFlags]::ContainerInherit -bor
        [System.Security.AccessControl.InheritanceFlags]::ObjectInherit
    } else { [System.Security.AccessControl.InheritanceFlags]::None }
    $propagate = [System.Security.AccessControl.PropagationFlags]::None
    $allow = [System.Security.AccessControl.AccessControlType]::Allow
    foreach ($account in @('NT AUTHORITY\SYSTEM', 'BUILTIN\Administrators')) {
        $rule = New-Object System.Security.AccessControl.FileSystemAccessRule($account, 'FullControl', $inherit, $propagate, $allow)
        $acl.AddAccessRule($rule)
    }
    $rule = New-Object System.Security.AccessControl.FileSystemAccessRule($principal, $permission, $inherit, $propagate, $allow)
    $acl.AddAccessRule($rule)
    Set-Acl -LiteralPath $path -AclObject $acl
}
function SameText([string]$a, [string]$b) {
    return [string]::Equals($a, $b, [StringComparison]::OrdinalIgnoreCase)
}
function Set-FastCgiEnv($variables, [string]$name, [string]$value) {
    $matches = @($variables | Where-Object { SameText ([string]$_['name']) $name })
    if ($matches.Count -gt 1) { throw "Doppelte FastCGI-Variable: $name" }
    if ($matches.Count -eq 0) {
        $element = $variables.CreateElement('environmentVariable')
        $element['name'] = $name
        $element['value'] = $value
        $variables.Add($element)
    } else {
        $matches[0]['value'] = $value
    }
}

$appcmd = Join-Path $env:windir 'System32\inetsrv\appcmd.exe'
if (-not (Test-Path -LiteralPath $appcmd -PathType Leaf)) {
    throw "IIS appcmd.exe fehlt: $appcmd"
}

$manager = New-Object Microsoft.Web.Administration.ServerManager
try {
    $site = $manager.Sites[$SiteName]
    if ($null -eq $site) { throw "IIS-Website nicht gefunden: $SiteName" }
    $siteId = [int64]$site.Id
    $app = $site.Applications['/']
    if ($null -eq $app) { throw 'Root-Anwendung der Website fehlt.' }
    $poolName = [string]$app.ApplicationPoolName
    $pool = $manager.ApplicationPools[$poolName]
    if ($null -eq $pool) { throw "Application Pool nicht gefunden: $poolName" }
    $identity = $pool.ProcessModel.IdentityType.ToString()
    switch ($identity) {
        'ApplicationPoolIdentity' { $phpPrincipal = 'IIS AppPool\' + $poolName }
        'SpecificUser' { $phpPrincipal = [string]$pool.ProcessModel.UserName }
        'NetworkService' { $phpPrincipal = 'NT AUTHORITY\NETWORK SERVICE' }
        'LocalService' { $phpPrincipal = 'NT AUTHORITY\LOCAL SERVICE' }
        'LocalSystem' { $phpPrincipal = 'NT AUTHORITY\SYSTEM' }
        default { throw "Unbekannte App-Pool-Identitaet: $identity" }
    }
    if ([string]::IsNullOrWhiteSpace($phpPrincipal)) { throw 'PHP-Prozesskonto konnte nicht ermittelt werden.' }
    # Fail before any changes if Windows cannot resolve the account.
    try {
        [void]([System.Security.Principal.NTAccount]$phpPrincipal).Translate([System.Security.Principal.SecurityIdentifier])
    } catch { throw "PHP-Prozesskonto nicht aufloesbar: $phpPrincipal" }
    $webConfig = $site.GetWebConfiguration()
    $handlerSection = $webConfig.GetSection('system.webServer/handlers')
    $handlers = $handlerSection.GetCollection()
    $phpHandlers = @($handlers | Where-Object {
        (SameText ([string]$_['path']) '*.php') -and
        ([string]$_['modules'] -match '(^|,)\s*FastCgiModule\s*(,|$)')
    })
    if ($phpHandlers.Count -ne 1) {
        throw "Erwartet genau einen wirksamen *.php/FastCgiModule-Handler, gefunden: $($phpHandlers.Count). Keine Aenderung."
    }
    $handler = $phpHandlers[0]
    $oldProcessor = [string]$handler['scriptProcessor']
    if ([string]::IsNullOrWhiteSpace($oldProcessor)) { throw 'PHP-Handler hat keinen scriptProcessor.' }
    $processorParts = $oldProcessor.Split([char]'|', 2)
    $phpExe = $processorParts[0].Trim('"').Trim()
    if (-not (Test-Path -LiteralPath $phpExe -PathType Leaf)) {
        throw "php-cgi.exe nicht gefunden: $phpExe"
    }
    if (-not (SameText ([IO.Path]::GetFileName($phpExe)) 'php-cgi.exe')) {
        throw "Handler verwendet nicht php-cgi.exe: $phpExe"
    }

    $globalConfig = $manager.GetApplicationHostConfiguration()
    $fastCgi = $globalConfig.GetSection('system.webServer/fastCgi').GetCollection()
    $currentArgs = if ($processorParts.Count -gt 1) { $processorParts[1] } else { '' }
    $existingEntry = $null
    foreach ($candidate in $fastCgi) {
        if ((SameText ([string]$candidate['fullPath']) $phpExe) -and
            ([string]$candidate['arguments'] -ceq $currentArgs)) {
            $existingEntry = $candidate
            break
        }
    }
    if ($null -eq $existingEntry) {
        throw "Der vorhandene PHP-Handler verweist auf keinen FastCGI-Eintrag: $oldProcessor"
    }

    # A site-specific argument distinguishes this FastCGI application from shared handlers.
    # Never change the settings of a shared FastCGI application.
    $dedicatedArgs = "-d siteId=$siteId"
    $dedicatedProcessor = "$phpExe|$dedicatedArgs"
    $entry = $null
    foreach ($candidate in $fastCgi) {
        if ((SameText ([string]$candidate['fullPath']) $phpExe) -and
            ([string]$candidate['arguments'] -ceq $dedicatedArgs)) {
            $entry = $candidate
            break
        }
    }

    # Avoid changing an entry that may already be used by a different site.
    foreach ($otherSite in $manager.Sites) {
        if ($otherSite.Id -eq $siteId) { continue }
        $otherHandlers = $otherSite.GetWebConfiguration().GetSection('system.webServer/handlers').GetCollection()
        foreach ($otherHandler in $otherHandlers) {
            if ((SameText ([string]$otherHandler['path']) '*.php') -and
                (SameText ([string]$otherHandler['scriptProcessor']) $dedicatedProcessor)) {
                throw "FastCGI-Ziel bereits von anderer Website verwendet: $($otherSite.Name). Abbruch."
            }
        }
    }

    # Private path derived from the requested website; never placed in its web root.
    $safeSite = [regex]::Replace($site.Name.ToLowerInvariant(), '[^a-z0-9._-]', '_')
    $privateRoot = Join-Path $env:ProgramData ("FoEManager\" + $safeSite)
    $authFile = Join-Path $privateRoot 'firebase-auth.json'
    $rateDir = Join-Path $privateRoot 'rate-limit'
    if ([string]::IsNullOrWhiteSpace($FirebaseAuthSource)) {
        $FirebaseAuthSource = Join-Path $PSScriptRoot '.firebase-foe-manager-auth.json'
    }
    $hasSource = Test-Path -LiteralPath $FirebaseAuthSource -PathType Leaf
    if (-not $hasSource -and -not (Test-Path -LiteralPath $authFile -PathType Leaf)) {
        throw "Firebase-Datei fehlt. Lege .firebase-foe-manager-auth.json neben das Skript: $PSScriptRoot"
    }
    if ($hasSource) {
        $sourceFull = [IO.Path]::GetFullPath($FirebaseAuthSource)
        if (-not (Test-Path -LiteralPath $sourceFull -PathType Leaf)) {
            throw "Firebase-Quelldatei nicht gefunden: $sourceFull"
        }
        if ([IO.Path]::GetFullPath($authFile).Equals($sourceFull, [StringComparison]::OrdinalIgnoreCase)) {
            throw 'Firebase-Quelldatei und Zieldatei sind identisch. Quelle weglassen.'
        }
        if ((Get-Item -LiteralPath $sourceFull).Length -eq 0) {
            throw 'Firebase-Quelldatei ist leer; Abbruch.'
        }
    }

    Write-Host "Website:       $($site.Name) (ID $siteId)"
    Write-Host "PHP:           $phpExe"
    Write-Host "Alter Handler: $oldProcessor"
    Write-Host "Neuer Handler: $dedicatedProcessor"
    Write-Host "Privatordner:  $privateRoot"
    Write-Host "App-Pool:      $poolName"
    Write-Host "Prozesskonto:  $phpPrincipal ($identity)"
    if ($hasSource) { Write-Host "Firebase-Quelle: $sourceFull" }
    if (Test-Path -LiteralPath $authFile -PathType Leaf) {
        Write-Host 'Firebase-Ziel: vorhanden (wird NICHT ueberschrieben)'
    } elseif ($hasSource) {
        Write-Host 'Firebase-Ziel: wird nach Absicherung des Privatordners kopiert'
    } else {
        Write-Host 'Firebase-Ziel vorhanden; keine Quelldatei erforderlich.'
    }
    Write-Warning 'FastCGI-Impersonation und Plesk-spezifische Prozesskonten muessen vor Produktivbetrieb separat geprueft werden.' 

    if (-not $PSCmdlet.ShouldProcess($site.Name, 'IIS-Backup, private Ordner und dedizierte FastCGI-Konfiguration erstellen')) {
        return
    }

    # Backup before mutating IIS; filesystem creation happens afterwards.
    $backupName = 'foe-' + $siteId + '-' + (Get-Date -Format 'yyyyMMdd-HHmmss-fff')
    & $appcmd add backup $backupName | Out-Host
    if ($LASTEXITCODE -ne 0) { throw 'IIS-Backup fehlgeschlagen; Abbruch.' }
    Write-Host "Backup: $backupName"

    New-Item -ItemType Directory -Force -Path $privateRoot, $rateDir | Out-Null
    # Secure the target directory BEFORE placing any credentials inside it.
    Set-PrivateAcl $privateRoot $phpPrincipal 'ReadAndExecute' $true
    Set-PrivateAcl $rateDir $phpPrincipal 'Modify' $true
    if (-not (Test-Path -LiteralPath $authFile -PathType Leaf)) {
        if ($hasSource) {
            # CreateNew is atomic: an existing token file can never be overwritten.
            $inputStream = [IO.File]::Open($sourceFull, [IO.FileMode]::Open, [IO.FileAccess]::Read, [IO.FileShare]::Read)
            try {
                $outputStream = [IO.File]::Open($authFile, [IO.FileMode]::CreateNew, [IO.FileAccess]::Write, [IO.FileShare]::None)
                try { $inputStream.CopyTo($outputStream) } finally { $outputStream.Dispose() }
            } finally { $inputStream.Dispose() }
            # The parent is protected; lock down the file explicitly as well.
            Set-PrivateAcl $authFile $phpPrincipal 'Modify' $false
            Write-Host 'Firebase-Datei sicher kopiert und Berechtigungen gesetzt.'
        } else {
            Write-Warning "Firebase-Datei fehlt: $authFile (mit -FirebaseAuthSource erneut ausfuehren)"
        }
    } else {
        Write-Host 'Firebase-Datei bereits vorhanden; nicht ueberschrieben.'
        Set-PrivateAcl $authFile $phpPrincipal 'Modify' $false
    }

    if ($null -eq $entry) {
        $entry = $fastCgi.CreateElement('application')
        $entry['fullPath'] = $phpExe
        $entry['arguments'] = $dedicatedArgs
        $fastCgi.Add($entry)
        Write-Host 'Dedizierte FastCGI-Anwendung angelegt.'
    } else {
        Write-Host 'Dedizierte FastCGI-Anwendung vorhanden; aktualisiere nur ihre FoE-Variablen.'
    }
    $vars = $entry.GetCollection('environmentVariables')
    Set-FastCgiEnv $vars 'FOE_FIREBASE_AUTH_FILE' $authFile
    Set-FastCgiEnv $vars 'FOE_RATE_LIMIT_DIR' $rateDir

    # Handler changes are site-scoped. If the effective handler is inherited and
    # IIS refuses to modify it at site scope, the commit fails rather than
    # silently editing the global handler.
    if (-not (SameText $oldProcessor $dedicatedProcessor)) {
        $handler['scriptProcessor'] = $dedicatedProcessor
    }
    $manager.CommitChanges()

    Write-Host 'IIS-Konfiguration gespeichert.'
    Write-Host "Website: $($site.Name) / ID $siteId"
    Write-Host "Firebase: $authFile"
    Write-Host "Rate-Limit: $rateDir"
    # Private ACLs and optional credential copy were applied before IIS commit.
    Write-Host 'NTFS-Berechtigungen fuer das ermittelte App-Pool-Konto eingerichtet.'
    Write-Warning 'Pruefe, ob PHP unter diesem Konto oder mit FastCGI-Impersonation laeuft, bevor du die API freigibst.' 
    Write-Warning 'Vor dem produktiven Einsatz: PHP-Handler, HTTPS, PHP-Version und API-Funktion pruefen.'
    Write-Warning 'Plesk kann bei PHP-Konfigurationsaenderungen den Website-Handler wiederherstellen.'
} finally {
    $manager.Dispose()
}
