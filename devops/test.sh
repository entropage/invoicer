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

cd test

# Function to print test summary
print_summary() {
    echo -e "\nTest Summary:"
    echo "=============="
    echo "Total tests run: $1"
    echo "Passed: $2"
    echo "Failed: $3"
    echo "Skipped: $4"
}

# Run the tests based on arguments
if [ $# -eq 0 ]; then
    # Run all tests
    echo "Running all vulnerability tests..." | tee -a "../$log_file"
    PYTHONPATH=.. python -m pytest vulnerabilities/ -v --tb=short 2>&1 | tee -a "../$log_file"
elif [ $# -eq 1 ]; then
    # Run all tests for a specific vulnerability
    vuln_type=$1
    echo "Running all tests for vulnerability type: $vuln_type" | tee -a "../$log_file"
    PYTHONPATH=.. python -m pytest vulnerabilities/${vuln_type}/ -v --tb=short 2>&1 | tee -a "../$log_file"
else
    # Run specific test case for a vulnerability
    vuln_type=$1
    test_case=$2
    echo "Running test case '$test_case' for vulnerability type: $vuln_type" | tee -a "../$log_file"
    PYTHONPATH=.. python -m pytest vulnerabilities/${vuln_type}/test_${vuln_type}.py -v -k "$test_case" --tb=short 2>&1 | tee -a "../$log_file"
fi

test_status=$?
cd ..

echo "Tests completed at $(date)" | tee -a "$log_file"

# Display latest application and container log file
latest_container_log=$(ls -t logs/container_*.log | head -n1)
if [ -f "$latest_container_log" ]; then
    echo -e "\nLatest container log ($latest_container_log):" | tee -a "$log_file"
    tail -n 50 "$latest_container_log" | tee -a "$log_file"
fi

exit $test_status 