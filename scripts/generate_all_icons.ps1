# Script PowerShell de génération complète des icônes Android et Web FCT Automobile
Add-Type -AssemblyName System.Drawing

$sourcePath = "e:\Telechargement\fct-erp-&-crm-automobile---douala\f199adfe-8e56-4de8-8e25-5c69c96685af.jpg"
if (-not (Test-Path $sourcePath)) {
    Write-Error "Fichier source introuvable : $sourcePath"
    exit 1
}

$sourceImg = [System.Drawing.Image]::FromFile($sourcePath)

function Resize-Image($src, $w, $h, $destPath) {
    $parent = Split-Path $destPath -Parent
    if (-not (Test-Path $parent)) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }
    $bmp = New-Object System.Drawing.Bitmap($w, $h)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($src, 0, 0, $w, $h)
    $bmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Généré : $destPath ($w x $h)"
}

# 1. Web & Assets
Resize-Image $sourceImg 512 512 "e:\Telechargement\fct-erp-&-crm-automobile---douala\public\fct-logo.png"
Resize-Image $sourceImg 512 512 "e:\Telechargement\fct-erp-&-crm-automobile---douala\assets\icon.png"
Resize-Image $sourceImg 512 512 "e:\Telechargement\fct-erp-&-crm-automobile---douala\assets\icon-foreground.png"
Resize-Image $sourceImg 512 512 "e:\Telechargement\fct-erp-&-crm-automobile---douala\assets\icon-only.png"
Resize-Image $sourceImg 512 512 "e:\Telechargement\fct-erp-&-crm-automobile---douala\assets\logo.png"

# Copie vers fct-logo.jpg
Copy-Item $sourcePath "e:\Telechargement\fct-erp-&-crm-automobile---douala\public\fct-logo.jpg" -Force

# 2. Android Mipmaps
$densities = @{
    "ldpi" = 36
    "mdpi" = 48
    "hdpi" = 72
    "xhdpi" = 96
    "xxhdpi" = 144
    "xxxhdpi" = 192
}

foreach ($d in $densities.Keys) {
    $sz = $densities[$d]
    $dir = "e:\Telechargement\fct-erp-&-crm-automobile---douala\android\app\src\main\res\mipmap-$d"
    Resize-Image $sourceImg $sz $sz "$dir\ic_launcher.png"
    Resize-Image $sourceImg $sz $sz "$dir\ic_launcher_round.png"
    Resize-Image $sourceImg $sz $sz "$dir\ic_launcher_foreground.png"
}

# 3. Android Splash Screens
$splashSizes = @{
    "drawable\splash.png" = @(480, 800)
    "drawable-night\splash.png" = @(480, 800)
    "drawable-port-ldpi\splash.png" = @(200, 320)
    "drawable-port-mdpi\splash.png" = @(320, 480)
    "drawable-port-hdpi\splash.png" = @(480, 800)
    "drawable-port-xhdpi\splash.png" = @(720, 1280)
    "drawable-port-xxhdpi\splash.png" = @(960, 1600)
    "drawable-port-xxxhdpi\splash.png" = @(1280, 1920)
    "drawable-port-night-ldpi\splash.png" = @(200, 320)
    "drawable-port-night-mdpi\splash.png" = @(320, 480)
    "drawable-port-night-hdpi\splash.png" = @(480, 800)
    "drawable-port-night-xhdpi\splash.png" = @(720, 1280)
    "drawable-port-night-xxhdpi\splash.png" = @(960, 1600)
    "drawable-port-night-xxxhdpi\splash.png" = @(1280, 1920)
    "drawable-land-ldpi\splash.png" = @(320, 200)
    "drawable-land-mdpi\splash.png" = @(480, 320)
    "drawable-land-hdpi\splash.png" = @(800, 480)
    "drawable-land-xhdpi\splash.png" = @(1280, 720)
    "drawable-land-xxhdpi\splash.png" = @(1600, 960)
    "drawable-land-xxxhdpi\splash.png" = @(1920, 1280)
    "drawable-land-night-ldpi\splash.png" = @(320, 200)
    "drawable-land-night-mdpi\splash.png" = @(480, 320)
    "drawable-land-night-hdpi\splash.png" = @(800, 480)
    "drawable-land-night-xhdpi\splash.png" = @(1280, 720)
    "drawable-land-night-xxhdpi\splash.png" = @(1600, 960)
    "drawable-land-night-xxxhdpi\splash.png" = @(1920, 1280)
}

foreach ($item in $splashSizes.Keys) {
    $dims = $splashSizes[$item]
    $dest = "e:\Telechargement\fct-erp-&-crm-automobile---douala\android\app\src\main\res\$item"
    Resize-Image $sourceImg $dims[0] $dims[1] $dest
}

$sourceImg.Dispose()
Write-Host "Toutes les icônes et splash screens ont été générés avec succès !"
