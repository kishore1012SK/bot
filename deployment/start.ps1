# PowerShell Bootstrapper for Enterprise Private AI Assistant Platform
$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "      Enterprise Private AI Assistant Platform Boot" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# Check for Docker installation
$dockerCheck = Get-Command docker -ErrorAction SilentlyContinue
if (-not $dockerCheck) {
    Write-Host "[ERROR] Docker Desktop is not installed or not in PATH." -ForegroundColor Red
    Write-Host "Please install Docker Desktop for Windows: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    Exit 1
}

# Check for Docker Compose
$composeCheck = docker compose version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Docker Compose plugin is not detected in your Docker installation." -ForegroundColor Red
    Exit 1
}

Write-Host "[OK] Docker and Docker Compose detected." -ForegroundColor Green

# Creating persistent uploads directory locally
Write-Host "[INFO] Setting up persistent uploads directory..." -ForegroundColor Cyan
if (-not (Test-Path -Path "uploads")) {
    New-Item -ItemType Directory -Path "uploads" | Out-Null
}

# Build and start services
Write-Host "[INFO] Running container build and startup..." -ForegroundColor Cyan
docker compose -f docker/docker-compose.yml up --build -d

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "    Deployment initiated successfully!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Web Application Access:     http://localhost" -ForegroundColor Cyan
Write-Host "API Endpoint Access:       http://localhost/api/v1" -ForegroundColor Cyan
Write-Host "API Swagger Documentation:  http://localhost/api/v1/docs" -ForegroundColor Cyan
Write-Host "Local Model Engine Status:  http://localhost:11434" -ForegroundColor Cyan
Write-Host ""
Write-Host "Deployer Note: Ensure you download and run your local model inside the container:" -ForegroundColor Yellow
Write-Host "  docker exec -it private_ai_ollama ollama run llama3" -ForegroundColor Yellow
Write-Host "  docker exec -it private_ai_ollama ollama pull nomic-embed-text" -ForegroundColor Yellow
Write-Host ""
