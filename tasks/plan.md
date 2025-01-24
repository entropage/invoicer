# Bearer Security Scanning Task

## Objective
Set up and configure an automated security scanning process using Bearer to analyze the invoicer repo for security vulnerabilities.

## Current Setup

### Environment
- Docker-based execution
- Default Bearer rules
- Required proxy: `http://192.168.1.100:7890` (mandatory for internet access)

### Target Repository
- Repository: "invoicer"
- Location: `.`
- Type: Simple login application with intentional security vulnerabilities

### Scanning Configuration
- Scanners: SAST, Secrets, Dependencies
- Format: SARIF
- All severity levels included
- Output: sarif-report.sarif

## Plan
1. [x] Create docker-compose.yml:
   - Base image: bearer/bearer
   - Configure proxy settings
   - Mount source code volume: `.:/app`

2. [ ] Run Bearer scan:
   - Command: `docker-compose up bearer`
   - Verify SARIF report generation

## Success Criteria
- Successfully generated SARIF report matching reference format
- All severity levels captured
- Proxy connection successful 