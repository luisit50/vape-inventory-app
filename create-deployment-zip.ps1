# DisCloud Deployment ZIP Creator
# This script creates a ZIP file with all necessary files for DisCloud deployment

$rootPath = "c:\Users\Gamer\Desktop\Phone app"
$backendPath = Join-Path $rootPath "backend"
$outputZip = Join-Path $rootPath "discloud-deployment.zip"

Write-Host "Creating DisCloud deployment ZIP..." -ForegroundColor Cyan

# Remove old ZIP if it exists
if (Test-Path $outputZip) {
    Remove-Item $outputZip -Force
    Write-Host "Removed existing ZIP file" -ForegroundColor Yellow
}

# Create a temporary directory for staging files
$tempDir = Join-Path $env:TEMP "discloud-deploy-$(Get-Random)"
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

try {
    # Copy discloud.config from root
    Copy-Item (Join-Path $rootPath "discloud.config") -Destination $tempDir
    Write-Host "✓ Added discloud.config" -ForegroundColor Green

    # Copy backend files
    Copy-Item (Join-Path $backendPath "server.js") -Destination $tempDir
    Write-Host "✓ Added server.js" -ForegroundColor Green

    Copy-Item (Join-Path $backendPath "package.json") -Destination $tempDir
    Write-Host "✓ Added package.json" -ForegroundColor Green

    Copy-Item (Join-Path $backendPath "eng.traineddata") -Destination $tempDir
    Write-Host "✓ Added eng.traineddata" -ForegroundColor Green

    # Copy folders
    Copy-Item (Join-Path $backendPath "routes") -Destination $tempDir -Recurse
    Write-Host "✓ Added routes/ folder" -ForegroundColor Green

    Copy-Item (Join-Path $backendPath "models") -Destination $tempDir -Recurse
    Write-Host "✓ Added models/ folder" -ForegroundColor Green

    Copy-Item (Join-Path $backendPath "middleware") -Destination $tempDir -Recurse
    Write-Host "✓ Added middleware/ folder" -ForegroundColor Green

    # Create the ZIP file
    Compress-Archive -Path "$tempDir\*" -DestinationPath $outputZip -CompressionLevel Optimal
    Write-Host "`n✓ ZIP file created successfully!" -ForegroundColor Green
    Write-Host "Location: $outputZip" -ForegroundColor Cyan
    
    # Show ZIP contents
    Write-Host "`nZIP Contents:" -ForegroundColor Yellow
    $zip = [System.IO.Compression.ZipFile]::OpenRead($outputZip)
    $zip.Entries | ForEach-Object { Write-Host "  - $($_.FullName)" }
    $zip.Dispose()

    # Show file size
    $size = (Get-Item $outputZip).Length / 1MB
    Write-Host "`nZIP Size: $([math]::Round($size, 2)) MB" -ForegroundColor Cyan

} finally {
    # Clean up temp directory
    if (Test-Path $tempDir) {
        Remove-Item $tempDir -Recurse -Force
    }
}

Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Go to https://discloudbot.com/dashboard" -ForegroundColor White
Write-Host "2. Click 'Upload App'" -ForegroundColor White
Write-Host "3. Upload: $outputZip" -ForegroundColor White
Write-Host "4. Set environment variables in dashboard" -ForegroundColor White
