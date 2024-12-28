#!/bin/bash

# Create logs directory if it doesn't exist
mkdir -p logs

# Get timestamp for log files
timestamp=$(date +%Y%m%d_%H%M%S)
log_file="logs/test_${timestamp}.log"
test_output_file="logs/test_output_${timestamp}.log"

echo "Starting tests at $(date)" | tee -a "$log_file"

# Activate virtual environment
source venv/bin/activate

# Wait for server to be ready
echo "Checking server health..." | tee -a "$log_file"
max_retries=30
retry_count=0

while ! curl -s http://localhost:3001/api/template/test > /dev/null; do
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

# Run the tests based on arguments
if [ $# -eq 0 ]; then
    # Run all tests
    echo "Running all vulnerability tests..." | tee -a "../$log_file"
    PYTHONPATH=.. python -m pytest vulnerabilities/ -v --capture=no --log-cli-level=INFO 2>&1 | tee "../$test_output_file"
elif [ $# -eq 1 ]; then
    # Run all tests for a specific vulnerability
    vuln_type=$1
    echo "Running all tests for vulnerability type: $vuln_type" | tee -a "../$log_file"
    PYTHONPATH=.. python -m pytest "vulnerabilities/${vuln_type}/" -v --capture=no --log-cli-level=INFO 2>&1 | tee "../$test_output_file"
else
    # Run specific test case for a vulnerability
    vuln_type=$1
    shift
    echo "Running specific test for vulnerability type: $vuln_type" | tee -a "../$log_file"
    PYTHONPATH=.. python -m pytest "vulnerabilities/${vuln_type}/" "$@" -v --capture=no --log-cli-level=INFO 2>&1 | tee "../$test_output_file"
fi

test_status=$?
cd ..

echo "Tests completed at $(date)" | tee -a "$log_file"

# Display test output
if [ -f "$test_output_file" ]; then
    echo -e "\nTest Output:" | tee -a "$log_file"
    cat "$test_output_file" | tee -a "$log_file"
fi

# Display latest application log file
latest_app_log=$(ls -t logs/app_*.log 2>/dev/null | head -n1)
if [ -f "$latest_app_log" ]; then
    echo -e "\nLatest application log ($latest_app_log):" | tee -a "$log_file"
    tail -n 50 "$latest_app_log" | tee -a "$log_file"
fi

exit $test_status 