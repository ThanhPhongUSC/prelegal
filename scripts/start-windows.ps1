# Build and run the Prelegal container, serving the app at http://localhost:8000
$ErrorActionPreference = "Stop"

Set-Location (Join-Path $PSScriptRoot "..")

docker build -t prelegal:latest .
docker rm -f prelegal *> $null
docker run -d --name prelegal -p 8000:8000 prelegal:latest

Write-Host "Prelegal is running at http://localhost:8000"
