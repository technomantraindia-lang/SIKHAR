Add-Type -AssemblyName System.Drawing

$img = [System.Drawing.Bitmap]::FromFile("$PSScriptRoot\..\src\assets\image copy.png")
Write-Host "Width: $($img.Width), Height: $($img.Height)"
# Sample some pixels: top left, center, bottom right
$p1 = $img.GetPixel(10, 10)
$p2 = $img.GetPixel([int]($img.Width/2), [int]($img.Height/2))
$p3 = $img.GetPixel($img.Width - 10, $img.Height - 10)
Write-Host "Pixel (10,10): R=$($p1.R), G=$($p1.G), B=$($p1.B)"
Write-Host "Pixel (mid): R=$($p2.R), G=$($p2.G), B=$($p2.B)"
Write-Host "Pixel (bottom-right): R=$($p3.R), G=$($p3.G), B=$($p3.B)"
$img.Dispose()

