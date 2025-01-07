#!/bin/bash

# Run from project root
cd "$(dirname "$0")/../../.."

# Create logs directory if it doesn't exist
mkdir -p logs

# Get timestamp for log files
timestamp=$(date +%Y%m%d_%H%M%S)
log_file="logs/graphql_test_${timestamp}.log"

echo "Starting GraphQL tests at $(date)" | tee -a "$log_file"

# Activate virtual environment
source venv/bin/activate

# Run all GraphQL tests
echo "Running GraphQL feature tests..." | tee -a "$log_file"
PYTHONPATH=. python -m pytest test/vulnerabilities/graphql/test_graphql_features.py -v --capture=no --log-cli-level=INFO

echo "Running GraphQL IDOR vulnerability tests..." | tee -a "$log_file"
PYTHONPATH=. python -m pytest test/vulnerabilities/graphql/test_graphql_idor.py -v --capture=no --log-cli-level=INFO

test_status=$?

echo "GraphQL tests completed at $(date)" | tee -a "$log_file"

# Display latest application log file
latest_app_log=$(ls -t logs/app_*.log 2>/dev/null | head -n1)
if [ -f "$latest_app_log" ]; then
    echo -e "\nLatest application log ($latest_app_log):" | tee -a "$log_file"
    tail -n 50 "$latest_app_log" | tee -a "$log_file"
fi

exit $test_status 