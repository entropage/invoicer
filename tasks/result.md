# Information Leakage Vulnerabilities Report

## Overview
This report documents the information leakage vulnerabilities discovered in the invoicer application. Each vulnerability has been verified with a proof of concept (POC) script.

## Vulnerabilities

### 1. Password Storage (CWE-522)
**Location**: `src/handlers/auth.js:32-34`
**Description**: Passwords are stored using base64 encoding instead of proper cryptographic hashing.
**Impact**: 
- Attackers can easily decode stored passwords
- No protection against rainbow table attacks
- Compromised database leads to immediate password exposure
**POC**: [poc_cwe522_password.py](poc_cwe522_password.py)

### 2. GraphQL Data Exposure (CWE-200)
**Location**: `src/handlers/graphql.js:194-246`
**Description**: GraphQL endpoint exposes sensitive user data including private information and password hashes.
**Impact**:
- Unauthorized access to user private data
- Exposure of sensitive business information
- Potential for data harvesting
**POC**: [poc_cwe200_graphql.py](poc_cwe200_graphql.py)

### 3. JWT Token Security (CWE-319)
**Location**: `src/plugins/jwt.js:5-12`
**Description**: JWT tokens are signed with a static secret key and weak algorithm.
**Impact**:
- Token forgery possible
- Privilege escalation
- No key rotation mechanism
**POC**: [poc_cwe319_jwt.py](poc_cwe319_jwt.py)

### 4. Template Error Exposure (CWE-209)
**Location**: `src/plugins/template.js:100-106`
**Description**: Template processing exposes detailed error messages and stack traces.
**Impact**:
- Internal implementation details leaked
- Stack traces exposed
- System path information disclosed
**POC**: [poc_cwe209_template.py](poc_cwe209_template.py)

### 5. Settings Data Exposure (CWE-200)
**Location**: `src/handlers/settings.js:77-82`
**Description**: Settings endpoint exposes sensitive configuration data through XML parsing.
**Impact**:
- XXE vulnerability allows file reading
- Prototype pollution possible
- Configuration data exposure
**POC**: [poc_cwe200_settings.py](poc_cwe200_settings.py)

### 6. File Template Exposure (CWE-200)
**Location**: `src/handlers/file.js:36-50`
**Description**: File handler exposes sensitive template files through path traversal.
**Impact**:
- Access to sensitive template files
- Path traversal to system files
- Configuration data exposure
**POC**: [poc_cwe200_files.py](poc_cwe200_files.py)

## Running the POCs

1. Ensure the application is running:
```bash
docker-compose up -d
```

2. Set up Python environment:
```bash
conda create -n invoicer_leakage python=3.9
conda activate invoicer_leakage
pip install requests pyjwt
```

3. Run individual POCs:
```bash
python poc_cwe522_password.py
python poc_cwe200_graphql.py
python poc_cwe319_jwt.py
python poc_cwe209_template.py
python poc_cwe200_settings.py
python poc_cwe200_files.py
```

## Recommendations

While this is an educational project and vulnerabilities are intentional, in a production environment you should:

1. Use proper password hashing (bcrypt, Argon2)
2. Implement GraphQL authorization checks
3. Use strong JWT algorithms and key rotation
4. Sanitize error messages
5. Validate and sanitize XML input
6. Implement proper file access controls

## Note
These vulnerabilities are intentionally present for educational purposes. Do not use this code in production. 