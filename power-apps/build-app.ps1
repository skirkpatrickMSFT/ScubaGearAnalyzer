<#
.SYNOPSIS
    Builds the ScubaGear Analyzer Power Apps canvas app by injecting custom
    screen YAML into a base .msapp, then optionally imports it.

.DESCRIPTION
    pac canvas pack cannot create apps from scratch — it requires internal
    binary metadata that only exists in a real .msapp. This script works around
    that limitation:

    1. Takes a base .msapp (blank canvas app you downloaded from Power Apps)
    2. Unpacks it with `pac canvas unpack`
    3. Replaces the screen YAML source files with the ones in canvas-src/Src/
    4. Repacks into a new .msapp
    5. Optionally prints import instructions

    If no base .msapp is provided, the script prints instructions for
    downloading one.

.PARAMETER BaseMsapp
    Path to a blank canvas app .msapp file downloaded from Power Apps.
    If omitted, the script looks for "base-app.msapp" in the power-apps folder.

.PARAMETER EnvironmentUrl
    (Optional) The Power Platform environment URL for import guidance.

.EXAMPLE
    # Step 1: Download a blank canvas tablet app from Power Apps as base-app.msapp
    # Step 2: Run the script
    .\build-app.ps1 -BaseMsapp .\base-app.msapp

.NOTES
    Prerequisites:
    - Power Platform CLI (pac): winget install Microsoft.PowerAppsCLI
    - A blank canvas app .msapp (see instructions below)
#>

param(
    [string]$BaseMsapp,
    [string]$EnvironmentUrl,
    [switch]$Import
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$SourceDir = Join-Path $ScriptDir "canvas-src"
$OutputFile = Join-Path $ScriptDir "ScubaGearAnalyzer.msapp"
$TempUnpackDir = Join-Path $ScriptDir "_temp_unpack"

# ── Resolve base .msapp ──────────────────────────────────────────────────
if (-not $BaseMsapp) {
    $BaseMsapp = Join-Path $ScriptDir "base-app.msapp"
}

if (-not (Test-Path $BaseMsapp)) {
    Write-Host @"

╔══════════════════════════════════════════════════════════════════════╗
║  Base .msapp file not found!                                        ║
║                                                                      ║
║  pac canvas pack cannot create apps from scratch. You need to        ║
║  provide a blank canvas app .msapp as a starting point.              ║
║                                                                      ║
║  How to get one (takes ~2 minutes):                                  ║
║                                                                      ║
║  1. Go to https://make.powerapps.com                                 ║
║  2. Click 'Create' in the left nav                                   ║
║  3. Click 'Blank app' > 'Blank canvas app'                          ║
║  4. Name it 'ScubaGear Base', choose 'Tablet' format, click Create  ║
║  5. Once the editor opens, press Ctrl+S to save                      ║
║  6. Click File > Save As > 'This computer' > Download               ║
║  7. Save the .msapp file as:                                         ║
║     $ScriptDir\base-app.msapp
║                                                                      ║
║  8. Re-run: .\build-app.ps1                                         ║
╚══════════════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Yellow
    exit 1
}

Write-Host "`n=== Base .msapp found: $BaseMsapp ===" -ForegroundColor Green

# ── Step 1: Check for pac CLI ─────────────────────────────────────────────
Write-Host "`n=== Checking for Power Platform CLI (pac) ===" -ForegroundColor Cyan

$pacCmd = Get-Command pac -ErrorAction SilentlyContinue
if (-not $pacCmd) {
    Write-Error @"
Power Platform CLI (pac) not found.

Install via:  winget install Microsoft.PowerAppsCLI
Or:           npm install -g @microsoft/power-apps-cli
"@
    exit 1
}

Write-Host "pac CLI found at: $($pacCmd.Source)" -ForegroundColor Green

# ── Step 2: Validate our custom screen YAML files ─────────────────────────
Write-Host "`n=== Validating custom screen YAML files ===" -ForegroundColor Cyan

$requiredYaml = @(
    "Src\App.fx.yaml",
    "Src\scrUpload.fx.yaml",
    "Src\scrControls.fx.yaml",
    "Src\scrChat.fx.yaml"
)

$missing = @()
foreach ($file in $requiredYaml) {
    $fullPath = Join-Path $SourceDir $file
    if (-not (Test-Path $fullPath)) {
        $missing += $file
    }
}

if ($missing.Count -gt 0) {
    Write-Error "Missing source files in canvas-src/:`n  $($missing -join "`n  ")"
    exit 1
}

Write-Host "All custom YAML files present." -ForegroundColor Green

# ── Step 3: Unpack the base .msapp ────────────────────────────────────────
Write-Host "`n=== Unpacking base .msapp ===" -ForegroundColor Cyan

if (Test-Path $TempUnpackDir) {
    Remove-Item $TempUnpackDir -Recurse -Force
}

pac canvas unpack --msapp $BaseMsapp --sources $TempUnpackDir 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to unpack base .msapp. Is the file valid?"
    exit 1
}

Write-Host "Unpacked to: $TempUnpackDir" -ForegroundColor Green

# ── Step 4: Replace screen YAML with our custom screens ───────────────────
Write-Host "`n=== Injecting custom screens ===" -ForegroundColor Cyan

$targetSrcDir = Join-Path $TempUnpackDir "Src"

# Remove existing screen YAML files (but keep App.fx.yaml base for metadata)
$existingScreens = Get-ChildItem -Path $targetSrcDir -Filter "*.fx.yaml" -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -ne "App.fx.yaml" }

foreach ($screen in $existingScreens) {
    Write-Host "  Removing default screen: $($screen.Name)" -ForegroundColor DarkGray
    Remove-Item $screen.FullName -Force
}

# Remove existing EditorState files for removed screens
$editorStateDir = Join-Path $targetSrcDir "EditorState"
if (Test-Path $editorStateDir) {
    $existingEditorState = Get-ChildItem -Path $editorStateDir -Filter "*.editorstate.json" -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -ne "App.editorstate.json" }
    foreach ($es in $existingEditorState) {
        Write-Host "  Removing editor state: $($es.Name)" -ForegroundColor DarkGray
        Remove-Item $es.FullName -Force
    }
}

# Copy our custom screen YAML files
foreach ($yamlFile in $requiredYaml) {
    $srcFile = Join-Path $SourceDir $yamlFile
    $destFile = Join-Path $TempUnpackDir $yamlFile
    Write-Host "  Copying: $yamlFile" -ForegroundColor White
    Copy-Item $srcFile $destFile -Force
}

# Update Other/Src metadata files
$otherSrcDir = Join-Path $TempUnpackDir "Other\Src"
if (Test-Path $otherSrcDir) {
    # Remove old screen pa.yaml files (e.g. Screen1.pa.yaml)
    $oldPaYaml = Get-ChildItem -Path $otherSrcDir -Filter "*.pa.yaml" |
        Where-Object { $_.Name -ne "App.pa.yaml" -and $_.Name -ne "_EditorState.pa.yaml" }
    foreach ($old in $oldPaYaml) {
        Write-Host "  Removing old metadata: $($old.Name)" -ForegroundColor DarkGray
        Remove-Item $old.FullName -Force
    }

    # Create pa.yaml for each new screen
    $screenNames = @("scrUpload", "scrControls", "scrChat")
    foreach ($name in $screenNames) {
        $paContent = @"
# Generated by build-app.ps1
Screens:
  ${name}:
    Properties:
      LoadingSpinnerColor: =RGBA(56, 96, 178, 1)
"@
        $paFile = Join-Path $otherSrcDir "$name.pa.yaml"
        Set-Content -Path $paFile -Value $paContent -Encoding UTF8
        Write-Host "  Created: Other\Src\$name.pa.yaml" -ForegroundColor White
    }

    # Update _EditorState.pa.yaml with our screen order
    $editorStateContent = @"
# Generated by build-app.ps1
EditorState:
  ScreensOrder:
    - scrUpload
    - scrControls
    - scrChat
"@
    $editorStatePath = Join-Path $otherSrcDir "_EditorState.pa.yaml"
    Set-Content -Path $editorStatePath -Value $editorStateContent -Encoding UTF8
    Write-Host "  Updated: Other\Src\_EditorState.pa.yaml" -ForegroundColor White
}

# Create editorstate.json for each new screen
$editorStateDir = Join-Path $TempUnpackDir "Src\EditorState"
foreach ($name in $screenNames) {
    $esFile = Join-Path $editorStateDir "$name.editorstate.json"
    if (-not (Test-Path $esFile)) {
        $esContent = @"
{
  "ControlStates": {
    "$name": {
      "AllowAccessToGlobals": true,
      "ControlPropertyState": [
        "Fill",
        "ImagePosition",
        "Height",
        "Width",
        "Size",
        "Orientation",
        "LoadingSpinner",
        "LoadingSpinnerColor"
      ],
      "IsAutoGenerated": false,
      "IsComponentDefinition": false,
      "IsDataControl": false,
      "IsFromScreenLayout": false,
      "IsGroupControl": false,
      "IsLocked": false,
      "LayoutName": "",
      "MetaDataIDKey": "",
      "Name": "$name",
      "OptimizeForDevices": "Off",
      "ParentIndex": 0,
      "PersistMetaDataIDKey": false,
      "Properties": [
        {
          "Category": "Design",
          "PropertyName": "Fill",
          "RuleProviderType": "Unknown"
        },
        {
          "Category": "Design",
          "PropertyName": "ImagePosition",
          "RuleProviderType": "Unknown"
        },
        {
          "Category": "Design",
          "PropertyName": "Height",
          "RuleProviderType": "Unknown"
        },
        {
          "Category": "Design",
          "PropertyName": "Width",
          "RuleProviderType": "Unknown"
        },
        {
          "Category": "Design",
          "PropertyName": "Size",
          "RuleProviderType": "Unknown"
        },
        {
          "Category": "Design",
          "PropertyName": "Orientation",
          "RuleProviderType": "Unknown"
        },
        {
          "Category": "Design",
          "PropertyName": "LoadingSpinner",
          "RuleProviderType": "Unknown"
        },
        {
          "Category": "Design",
          "PropertyName": "LoadingSpinnerColor",
          "RuleProviderType": "Unknown"
        }
      ],
      "StyleName": "defaultScreenStyle",
      "Type": "ControlInfo"
    }
  }
}
"@
        Set-Content -Path $esFile -Value $esContent -Encoding UTF8
        Write-Host "  Created: Src\EditorState\$name.editorstate.json" -ForegroundColor White
    }
}

Write-Host "Custom screens injected." -ForegroundColor Green

# ── Step 5: Repack into .msapp ────────────────────────────────────────────
Write-Host "`n=== Repacking into .msapp ===" -ForegroundColor Cyan

if (Test-Path $OutputFile) {
    Remove-Item $OutputFile -Force
}

pac canvas pack --sources $TempUnpackDir --msapp $OutputFile 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "pac canvas pack failed during repack."
    exit 1
}

# Clean up temp directory
Remove-Item $TempUnpackDir -Recurse -Force
Write-Host "Temp files cleaned up." -ForegroundColor DarkGray

$fileSize = (Get-Item $OutputFile).Length / 1KB
Write-Host "`nSuccessfully created: $OutputFile ($([math]::Round($fileSize, 1)) KB)" -ForegroundColor Green

# ── Step 6: Next steps ───────────────────────────────────────────────────
Write-Host @"

=== Next Steps ===
1. Import the .msapp file into Power Apps:
   - Go to https://make.powerapps.com
   - Click 'Apps' in the left nav
   - Click 'Import canvas app' (or ... menu > Import)
   - Upload: $OutputFile

2. After import, open the app in Edit mode and add your Custom Connector:
   - Data panel (left) > + Add data > search for 'ScubaGear'
   - The connector name in formulas must match 'ScubaGearAnalyzerAPI'

3. Test with test-subset.json from this repo (10 controls, 20% pass rate)

"@ -ForegroundColor Yellow

Write-Host "Done!" -ForegroundColor Green
