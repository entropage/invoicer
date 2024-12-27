#!/bin/bash

# Create logs directory if it doesn't exist
mkdir -p logs

# Get timestamp for log files
timestamp=$(date +%Y%m%d_%H%M%S)
log_file="logs/test_${timestamp}.log"

echo "Starting tests at $(date)" | tee -a "$log_file"

# Activate virtual environment
source venv/bin/activate

# Wait for server to be ready
echo "Checking server health..." | tee -a "$log_file"
max_retries=30
retry_count=0

while ! curl -s http://localhost:3001/health > /dev/null; do
    if [ $retry_count -ge $max_retries ]; then
        echo "Server failed to become ready after $max_retries attempts" | tee -a "$log_file"
        exit 1
    fi
    echo "Waiting for server to be ready... (attempt $((retry_count + 1))/$max_retries)" | tee -a "$log_file"
    sleep 1
    retry_count=$((retry_count + 1))
done

echo "Server is ready, running tests..." | tee -a "$log_file"

# Run the tests
python test/test_prototype_pollution.py -v 2>&1 | tee -a "$log_file"

echo "Tests completed at $(date)" | tee -a "$log_file"

# Display latest application and container log file
latest_container_log=$(ls -t logs/container_*.log | head -n1)
if [ -f "$latest_container_log" ]; then
    echo -e "\nLatest container log ($latest_container_log):" | tee -a "$log_file"
    tail -n 50 "$latest_container_log" | tee -a "$log_file"
fi 