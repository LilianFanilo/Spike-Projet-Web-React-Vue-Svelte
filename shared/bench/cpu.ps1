# Échantillonnage CPU / GPU d'OBS et de ses processus de rendu navigateur (research R8).
# Classes WMI indépendantes de la langue de Windows (Get-Counter échoue en fr-FR avec les noms anglais).
# Compatible Windows PowerShell 5.1.
#
# Usage : powershell -File shared/bench/cpu.ps1 -Framework react -Scenario alertes -Duration 30 -ObsFps 30 -Acceleration on

param(
  [Parameter(Mandatory = $true)][ValidateSet("react", "vue", "svelte", "temoin", "reference")][string]$Framework,
  [Parameter(Mandatory = $true)][ValidateSet("reference", "repos", "alertes", "3d")][string]$Scenario,
  [int]$Duration = 60,
  [int]$ObsFps = 0,
  [ValidateSet("on", "off")][string]$Acceleration = "on"
)

$ErrorActionPreference = "Stop"
$OutputEncoding = [Text.UTF8Encoding]::new($false)

if ($Scenario -eq "reference") { $Framework = "reference" }

if (-not (Get-Process -Name obs64 -ErrorAction SilentlyContinue)) {
  Write-Error "OBS n'est pas lancé (aucun processus obs64) : rien à mesurer."
  exit 1
}

$coeurs = (Get-CimInstance Win32_ComputerSystem).NumberOfLogicalProcessors

function Get-ObsProcess {
  Get-CimInstance Win32_PerfFormattedData_PerfProc_Process |
    Where-Object { $_.Name -eq "obs64" -or $_.Name -like "obs-browser-page*" }
}

$cpu = New-Object System.Collections.Generic.List[double]
$gpu = New-Object System.Collections.Generic.List[double]

Write-Host "Mesure $Scenario ($Framework) pendant $Duration s…"
Get-ObsProcess | Out-Null # premier appel : les compteurs formatés s'amorcent
Start-Sleep -Seconds 1

for ($i = 0; $i -lt $Duration; $i++) {
  $debut = Get-Date
  $procs = @(Get-ObsProcess)
  $somme = ($procs | Measure-Object -Property PercentProcessorTime -Sum).Sum
  if ($null -eq $somme) { $somme = 0 }
  $cpu.Add([double]$somme / $coeurs)

  $pids = $procs | ForEach-Object { "pid_$($_.IDProcess)_" }
  $moteurs = Get-CimInstance Win32_PerfFormattedData_GPUPerformanceCounters_GPUEngine |
    Where-Object { $_.Name -like "*engtype_3D" }
  $charge = 0
  foreach ($m in $moteurs) {
    foreach ($p in $pids) {
      if ($m.Name.StartsWith($p)) { $charge += $m.UtilizationPercentage; break }
    }
  }
  $gpu.Add([double]$charge)

  $reste = 1000 - ((Get-Date) - $debut).TotalMilliseconds
  if ($reste -gt 0) { Start-Sleep -Milliseconds ([int]$reste) }
}

function Resume($serie) {
  $m = $serie | Measure-Object -Average -Maximum
  [pscustomobject]@{ moyenne = [math]::Round($m.Average, 2); max = [math]::Round($m.Maximum, 2) }
}

$c = Resume $cpu
$g = Resume $gpu
$obs = $null
if ($ObsFps -gt 0) { $obs = $ObsFps }
$conditions = @{ obsFps = $obs; accelerationMaterielle = $Acceleration; coeursLogiques = $coeurs; dureeS = $Duration }

$entrees = @(
  @{ framework = $Framework; mesure = "cpu-$Scenario"; valeur = $c.moyenne; unite = "%"; conditions = $conditions; details = @{ max = $c.max; echantillons = $cpu.Count } },
  @{ framework = $Framework; mesure = "gpu-$Scenario"; valeur = $g.moyenne; unite = "%"; conditions = $conditions; details = @{ max = $g.max; echantillons = $gpu.Count } }
)

$record = Join-Path $PSScriptRoot "record.ts"
ConvertTo-Json -InputObject $entrees -Depth 5 -Compress | node $record
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
