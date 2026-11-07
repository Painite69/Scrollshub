# Publishes the Windows installer to GitHub Releases (site Download nav).
#
# One-time setup:
#   gh auth login
#
# Each app update:
#   npm run dist:desktop
#   .\scripts\publish-desktop-release.ps1
#
# Optional version bump (also update Header.tsx DESKTOP_DOWNLOAD_URL + desktop/package.json version):
#   .\scripts\publish-desktop-release.ps1 -Version 0.1.1

param(
  [string]$Version = '0.1.0',
  [string]$Repo = 'Painite69/Scrollshub'
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$tag = "v$Version"
$setup = Join-Path $root "desktop\release\ScrollsHub-Setup-$Version.exe"
$legacySetup = Join-Path $root "desktop\release\ScrollsHub Setup $Version.exe"

if (-not (Test-Path -LiteralPath $setup)) {
  if (Test-Path -LiteralPath $legacySetup) {
    Copy-Item -LiteralPath $legacySetup -Destination $setup -Force
  } else {
    throw "Installer not found. Run npm run dist:desktop first.`nExpected: $setup"
  }
}

$exists = $false
gh release view $tag -R $Repo 1>$null 2>$null
if ($LASTEXITCODE -eq 0) { $exists = $true }

if ($exists) {
  Write-Host "Release $tag already exists — replacing ScrollsHub-Setup-$Version.exe ..."
  gh release upload $tag $setup -R $Repo --clobber
} else {
  Write-Host "Creating release $tag ..."
  gh release create $tag $setup `
    -R $Repo `
    --title "ScrollsHub $Version" `
    --notes "Windows installer for ScrollsHub (overlay + desktop app)."
}

Write-Host ""
Write-Host "Done. Site Download URL:"
Write-Host "https://github.com/$Repo/releases/download/$tag/ScrollsHub-Setup-$Version.exe"
