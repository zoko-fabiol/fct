$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$outDir = "E:\Telechargement\fct-erp-&-crm-automobile---douala\scripts\presentation_pdf\screenshots"

if (-not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Force -Path $outDir | Out-Null
}

$modules = @(
    "dashboard",
    "vehicles",
    "showroom",
    "rentals",
    "sales",
    "billing",
    "cash",
    "maintenance",
    "drivers",
    "crm",
    "stock",
    "reservations",
    "documents",
    "reports",
    "notifications",
    "users",
    "audit",
    "help",
    "settings"
)

Write-Host ">>> Demarrage capture ERP (19 modules)..."
foreach ($m in $modules) {
    $outFile = "$outDir\$m.png"
    $url = "http://localhost:3000/?demo=true&module=$m"
    Write-Host "Capture module: $m"
    $tmpDir = "C:\Users\Claus\AppData\Local\Temp\edge_cap_$m"
    Start-Process -FilePath $edge -ArgumentList "--headless", "--user-data-dir=$tmpDir", "--window-size=1600,1050", "--screenshot=$outFile", $url -Wait
    Start-Sleep -Milliseconds 400
}

$webPages = @(
    @{ name = "web_home"; url = "http://localhost:3001/#/home" },
    @{ name = "web_rentals"; url = "http://localhost:3001/#/location" },
    @{ name = "web_sales"; url = "http://localhost:3001/#/vente" },
    @{ name = "web_showroom"; url = "http://localhost:3001/#/showroom/veh_001" },
    @{ name = "web_health"; url = "http://localhost:3001/#/carnet-sante" },
    @{ name = "web_portal"; url = "http://localhost:3001/#/espace-client" },
    @{ name = "web_agency"; url = "http://localhost:3001/#/agence" }
)

Write-Host ">>> Demarrage capture Website (7 pages)..."
foreach ($w in $webPages) {
    $name = $w.name
    $url = $w.url
    $outFile = "$outDir\$name.png"
    Write-Host "Capture web: $name"
    $tmpDir = "C:\Users\Claus\AppData\Local\Temp\edge_cap_$name"
    Start-Process -FilePath $edge -ArgumentList "--headless", "--user-data-dir=$tmpDir", "--window-size=1600,1050", "--screenshot=$outFile", $url -Wait
    Start-Sleep -Milliseconds 400
}

Write-Host ">>> Termine !"
