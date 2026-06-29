#!/bin/bash

# Bootstrapper for Enterprise Private AI Assistant Platform
set -e

# Design variables
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "=========================================================="
echo "      Enterprise Private AI Assistant Platform Boot"
echo "=========================================================="
echo -e "${NC}"

# Check for Docker installation
if ! [ -x "$(command -v docker)" ]; then
    echo -e "${RED}[ERROR] Docker is not installed on this host. Please install Docker first.${NC}" >&2
    exit 1
fi

# Check for Docker Compose (v2 or legacy docker-compose)
COMPOSE_CMD=""
if docker compose version >/dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
    COMPOSE_CMD="docker-compose"
else
    echo -e "${RED}[ERROR] Docker Compose is not installed. Please install the Docker Compose plugin.${NC}" >&2
    exit 1
fi

echo -e "${GREEN}[OK] Docker and Compose dependencies detected.${NC}"

# Creating persistent host volume attachments locally
echo -e "${CYAN}[INFO] Setting up persistent directories...${NC}"
mkdir -p uploads

# Build and start services
echo -e "${CYAN}[INFO] Running container compilation ($COMPOSE_CMD up --build -d)...${NC}"
$COMPOSE_CMD -f docker/docker-compose.yml up --build -d

echo -e "${GREEN}"
echo "=========================================================="
echo "    Deployment initiated successfully!"
echo "=========================================================="
echo -e "${NC}"
echo -e "Web Application Access:     ${CYAN}http://localhost${NC}"
echo -e "API Endpoint Access:       ${CYAN}http://localhost/api/v1${NC}"
echo -e "API Swagger Documentation:  ${CYAN}http://localhost/api/v1/docs${NC}"
echo -e "Local Model Engine Status:  ${CYAN}http://localhost:11434${NC}"
echo ""
echo -e "${YELLOW}Deployer Note: Ensure you download and run your local model (e.g. 'docker exec -it private_ai_ollama ollama run llama3') before starting chats.${NC}"
echo ""
