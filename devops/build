#!/bin/bash

# Create logs directory if it doesn't exist
mkdir -p logs

# Get timestamp for log files
timestamp=$(date +%Y%m%d_%H%M%S)
log_file="logs/build_${timestamp}.log"

echo "Starting build process at $(date)" | tee -a "$log_file"

# Stop any running containers
echo "Stopping existing containers..." | tee -a "$log_file"
docker-compose down >> "$log_file" 2>&1

# Build the Docker image
echo "Building Docker image..." | tee -a "$log_file"
docker build -t invoicer:test . >> "$log_file" 2>&1

echo "Build completed at $(date)" | tee -a "$log_file" 