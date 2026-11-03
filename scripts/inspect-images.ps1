Add-Type -AssemblyName System.Drawing

$img1 = [System.Drawing.Bitmap]::FromFile("$PSScriptRoot\..\src\assets\image copy.png")
Write-Host "image copy.png: $($img1.Width) x $($img1.Height)"
$img1.Dispose()

$img2 = [System.Drawing.Bitmap]::FromFile("$PSScriptRoot\..\src\assets\image.png")
Write-Host "image.png: $($img2.Width) x $($img2.Height)"
$img2.Dispose()

