# Publishes the Windows installer + auto-update metadata to GitHub Releases.
#
# One-time:  gh auth login
#
# Each update (after bumping desktop/package.json version + Header.tsx URL):
#   npm run dist:desktop
#   .\scripts\publish-desktop-release.ps1
#
# Or pass version explicitly:
#   .\scripts\publish-desktop-release.ps1 -Version 0.1.1

param(
  [string]$Version = '',
  [string]$Repo = 'Painite69/Scrollshub'
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot

if (-not $Version) {
  $pkg = Get-Content (Join-Path $root 'desktop\package.json') -Raw | ConvertFrom-Json
  $Version = [string]$pkg.version
}

$tag = "v$Version"
$releaseDir = Join-Path $root 'desktop\release'
$setup = Join-Path $releaseDir "ScrollsHub-Setup-$Version.exe"
$blockmap = Join-Path $releaseDir "ScrollsHub-Setup-$Version.exe.blockmap"
$latestYml = Join-Path $releaseDir 'latest.yml'

if (-not (Test-Path -LiteralPath $setup)) {
  throw "Installer not found. Run npm run dist:desktop first.`nExpected: $setup"
}
if (-not (Test-Path -LiteralPath $latestYml)) {
  throw "latest.yml missing (needed for auto-update). Run npm run dist:desktop first.`nExpected: $latestYml"
}

$assets = @($setup, $latestYml)
if (Test-Path -LiteralPath $blockmap) { $assets += $blockmap }

$exists = $false
$prevEap = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
gh release view $tag -R $Repo 1>$null 2>$null
if ($LASTEXITCODE -eq 0) { $exists = $true }
$ErrorActionPreference = $prevEap

if ($exists) {
  Write-Host "Release $tag already exists — replacing assets..."
  gh release upload $tag @assets -R $Repo --clobber
} else {
  Write-Host "Creating release $tag ..."
  gh release create $tag @assets `
    -R $Repo `
    --title "ScrollsHub $Version" `
    --notes @"
Windows installer for ScrollsHub (overlay + desktop app).

Installed copies check GitHub Releases for updates automatically.
"@
}

Write-Host ""
Write-Host "Done. Site Download URL:"
Write-Host "https://github.com/$Repo/releases/download/$tag/ScrollsHub-Setup-$Version.exe"
Write-Host "Auto-update feed: latest.yml on this release (GitHub /releases/latest)"
