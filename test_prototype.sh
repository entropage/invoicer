#!/bin/bash

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Change to the project directory
cd "$SCRIPT_DIR"

# Create logs directory if it doesn't exist
mkdir -p logs

# Start logging
exec 1> >(tee -a "logs/test_$(date +%Y%m%d_%H%M%S).log")
exec 2>&1

echo "Starting test process at $(date)"
echo "Working directory: $(pwd)"

# Wait for the server to be ready
echo "Waiting for server to be ready..."
max_attempts=30
attempt=1
while ! curl -s http://localhost:3001/health > /dev/null; do
    if [ $attempt -gt $max_attempts ]; then
        echo "Server failed to start after $max_attempts attempts"
        exit 1
    fi
    echo "Attempt $attempt: Server not ready yet..."
    sleep 1
    ((attempt++))
done
echo "Server is ready!"

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Run the tests
echo "Running prototype pollution tests..."
cd test && python test_prototype_pollution.py

# Show the latest application log file
echo -e "\nLatest application log file contents:"
echo "----------------------------------------"
latest_app_log=$(ls -t logs/app-*.log 2>/dev/null | head -1)
if [ -f "$latest_app_log" ]; then
    echo "Contents of $latest_app_log:"
    cat "$latest_app_log"
else
    echo "No application log file found"
fi

# Show the latest container log file
echo -e "\nLatest container log file contents:"
echo "----------------------------------------"
latest_container_log=$(ls -t logs/container_*.log 2>/dev/null | head -1)
if [ -f "$latest_container_log" ]; then
    echo "Contents of $latest_container_log:"
    cat "$latest_container_log"
else
    echo "No container log file found"
fi

echo "Test process completed at $(date)" 