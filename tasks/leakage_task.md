# task

## 1. read through the code base and identify all sensitive data that needs to be protected given the application's context
Types of sensitive data to focus on:
- Authentication passwords/keys/tokens/credentials
    - API keys and tokens (AWS, Google Cloud, Azure, etc.)
    - Personal access tokens
    - OAuth tokens
    - Database connection strings
    - Private keys and certificates
    - Encryption keys
- PII (Personally Identifiable Information)
    - Financial data
    - Payment credentials/details
- Business metrics
- Environment variables
- Internal endpoints
- Any other sensitive data discovered during analysis

## 2. follow the data flow and identify all the places where the sensitive data is being processed, stored, or transmitted outside of the application's memory

## 3. for each of the cases, identify the potential risks and vulnerabilities
Consider compliance requirements including but not limited to:
- GDPR
- PCI DSS
- Other relevant standards based on best practices

## 4. summarize the findings in info_leakage.sarif
SARIF requirements:
- Use latest SARIF schema version
- Use CWE-200 (Information Exposure) and its child CWEs for categorization
- Include appropriate severity levels
- Include detailed rule IDs
