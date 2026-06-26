# Build and run the Prelegal container, serving the app at http://localhost:8000
$ErrorActionPreference = "Stop"

Set-Location (Join-Path $PSScriptRoot "..")

docker build -t prelegal:latest .
docker rm -f prelegal *> $null

# Pass the OpenRouter key (and any other vars) into the container if present.
$envArgs = if (Test-Path .env) { @("--env-file", ".env") } else { @() }
docker run -d --name prelegal -p 8000:8000 @envArgs prelegal:latest

Write-Host "Prelegal is running at http://localhost:8000"
