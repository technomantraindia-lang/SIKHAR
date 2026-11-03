Add-Type -AssemblyName System.Drawing

$img = [System.Drawing.Bitmap]::FromFile("$PSScriptRoot\..\public\images\hero_banner.png")
Write-Host "hero_banner.png dimensions: $($img.Width) x $($img.Height)"

# Sample left side (around x=200, y=300 where text would be if it's the full banner)
$pLeft = $img.GetPixel(150, 300)
Write-Host ("Left (150, 300): R={0} G={1} B={2}" -f $pLeft.R, $pLeft.G, $pLeft.B)

# Sample right side (around x=1200, y=500 where the car would be)
$pCar = $img.GetPixel(1200, 500)
Write-Host ("Right (1200, 500): R={0} G={1} B={2}" -f $pCar.R, $pCar.G, $pCar.B)

$img.Dispose()

