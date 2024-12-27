#!/bin/bash

# Create logs directory if it doesn't exist
mkdir -p logs

# Get timestamp for log files
timestamp=$(date +%Y%m%d_%H%M%S)
log_file="logs/run_${timestamp}.log"
container_log="logs/container_${timestamp}.log"

echo "Starting application at $(date)" | tee -a "$log_file"

# Start the containers
echo "Starting containers..." | tee -a "$log_file"
docker-compose up -d >> "$log_file" 2>&1

# Wait for containers to be ready
echo "Waiting for containers to initialize..." | tee -a "$log_file"
sleep 5

# Capture initial container logs
echo "Capturing container logs..." | tee -a "$log_file"
docker logs invoicer-invoicer-1 > "$container_log" 2>&1

echo "Application started at $(date)" | tee -a "$log_file"
echo "Container logs available at: $container_log" 