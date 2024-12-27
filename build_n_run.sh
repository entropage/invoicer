#!/bin/bash

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Change to the project directory
cd "$SCRIPT_DIR"

# Create logs directory if it doesn't exist
mkdir -p logs

# Start logging
exec 1> >(tee -a "logs/build_$(date +%Y%m%d_%H%M%S).log")
exec 2>&1

echo "Starting build and run process at $(date)"
echo "Working directory: $(pwd)"

# Stop any running containers
echo "Stopping existing containers..."
docker-compose down

# Build the image with test tag
echo "Building Docker image..."
docker build -t invoicer:test .

# Start the containers
echo "Starting containers..."
docker-compose up -d

# Wait for services to be ready
echo "Waiting for services to start..."
sleep 5

# Capture container logs
echo "Capturing initial container logs..."
docker logs invoicer-invoicer-1 > "logs/container_$(date +%Y%m%d_%H%M%S).log" 2>&1

# Show logs only if requested
if [ "$1" = "--logs" ]; then
    echo "Tailing container logs..."
    docker logs invoicer-invoicer-1 -f
fi

echo "Build and run process completed at $(date)" 