# Stop and remove the Prelegal container.
$ErrorActionPreference = "Stop"

docker rm -f prelegal *> $null

Write-Host "Prelegal stopped."
