# Publishes the Windows installer to GitHub Releases (linked from the site Download nav).
# One-time: gh auth login
# Then:  npm run dist:desktop
#        .\scripts\publish-desktop-release.ps1

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$version = '0.1.0'
$tag = "v$version"
$setup = Join-Path $root "desktop\release\ScrollsHub-Setup-$version.exe"
$legacySetup = Join-Path $root "desktop\release\ScrollsHub Setup $version.exe"

if (-not (Test-Path -LiteralPath $setup)) {
  if (Test-Path -LiteralPath $legacySetup) {
    Copy-Item -LiteralPath $legacySetup -Destination $setup -Force
  } else {
    throw "Installer not found. Run npm run dist:desktop first.`nExpected: $setup"
  }
}

gh release view $tag -R Painite69/Scrollshub 1>$null 2>$null
if ($LASTEXITCODE -eq 0) {
  Write-Host "Release $tag already exists — uploading/replacing asset..."
  gh release upload $tag $setup -R Painite69/Scrollshub --clobber
} else {
  Write-Host "Creating release $tag..."
  gh release create $tag $setup `
    -R Painite69/Scrollshub `
    --title "ScrollsHub $version" `
    --notes "Windows installer for ScrollsHub (overlay + desktop app)."
}

Write-Host "Done. Download URL:"
Write-Host "https://github.com/Painite69/Scrollshub/releases/download/$tag/ScrollsHub-Setup-$version.exe"
