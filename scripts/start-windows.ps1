# Build and start Prelegal in Docker at http://localhost:8000
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

$envArgs = @()
if (Test-Path ".env") { $envArgs = @("--env-file", ".env") }

docker build -t prelegal .
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
docker rm -f prelegal 2>$null | Out-Null
docker run -d --name prelegal -p 8000:8000 @envArgs prelegal
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "Prelegal is running at http://localhost:8000"
