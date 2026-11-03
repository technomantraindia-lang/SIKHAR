Add-Type -AssemblyName System.Drawing

$img = [System.Drawing.Bitmap]::FromFile("$PSScriptRoot\..\public\images\banner_indian_fleet.png")
Write-Host "Width: $($img.Width), Height: $($img.Height)"
$p1 = $img.GetPixel(50, 50)
$p2 = $img.GetPixel(800, 450)
$p3 = $img.GetPixel(1400, 700)
Write-Host ("p1: R={0} G={1} B={2}" -f $p1.R, $p1.G, $p1.B)
Write-Host ("p2: R={0} G={1} B={2}" -f $p2.R, $p2.G, $p2.B)
Write-Host ("p3: R={0} G={1} B={2}" -f $p3.R, $p3.G, $p3.B)
$img.Dispose()

