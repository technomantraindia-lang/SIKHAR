Add-Type -AssemblyName System.Drawing

$img = [System.Drawing.Bitmap]::FromFile("$PSScriptRoot\..\src\assets\image.png")
Write-Host "Width: $($img.Width), Height: $($img.Height)"

for ($y = 0; $y -lt $img.Height; $y += 30) {
    $p = $img.GetPixel(40, $y)
    Write-Host ("y={0,4}: R={1,3} G={2,3} B={3,3}" -f $y, $p.R, $p.G, $p.B)
}
$img.Dispose()

