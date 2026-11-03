Add-Type -AssemblyName System.Drawing

$src = [System.Drawing.Bitmap]::FromFile("$PSScriptRoot\..\src\assets\image.png")
$outDir = "$PSScriptRoot\..\public\images"
if (!(Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir }

# 1. Command Center image (right side of y ~ 940-1180)
# Let's crop the screen command center monitor
$rect1 = New-Object System.Drawing.Rectangle(400, 940, 479, 235)
$crop1 = $src.Clone($rect1, $src.PixelFormat)
$crop1.Save("$outDir\command_center_telemetry.png", [System.Drawing.Imaging.ImageFormat]::Png)
$crop1.Dispose()
Write-Host "Created command_center_telemetry.png: 479 x 235"

# 2. Mobile Tracking App Mockup (left side of y ~ 1190-1480)
$rect2 = New-Object System.Drawing.Rectangle(20, 1190, 420, 280)
$crop2 = $src.Clone($rect2, $src.PixelFormat)
$crop2.Save("$outDir\mobile_tracking_mockup.png", [System.Drawing.Imaging.ImageFormat]::Png)
$crop2.Dispose()
Write-Host "Created mobile_tracking_mockup.png: 420 x 280"

# 3. CTA Highway Banner (y ~ 1480-1635)
$rect3 = New-Object System.Drawing.Rectangle(15, 1480, 849, 150)
$crop3 = $src.Clone($rect3, $src.PixelFormat)
$crop3.Save("$outDir\cta_highway_banner.png", [System.Drawing.Imaging.ImageFormat]::Png)
$crop3.Dispose()
Write-Host "Created cta_highway_banner.png: 849 x 150"

# 4. Enterprise Logos strip (y ~ 515-565)
$rect4 = New-Object System.Drawing.Rectangle(30, 515, 820, 50)
$crop4 = $src.Clone($rect4, $src.PixelFormat)
$crop4.Save("$outDir\enterprise_logos.png", [System.Drawing.Imaging.ImageFormat]::Png)
$crop4.Dispose()
Write-Host "Created enterprise_logos.png: 820 x 50"

$src.Dispose()

