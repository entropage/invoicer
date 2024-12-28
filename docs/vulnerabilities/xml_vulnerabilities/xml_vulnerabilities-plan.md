# XML Vulnerabilities Integration Plan

## Overview
XML vulnerabilities in web applications can lead to various security issues including:
1. XML External Entity (XXE) Injection
2. XML Entity Expansion (Billion Laughs Attack)

## Benchmark Examples Analysis
Found two vulnerable implementations in benchmark-nodejs:

1. Direct XML String Parsing (`Libxmljs_ParseXmlString.ts`)
   ```typescript
   const doc = parseXmlString(req.body.toString(), {
       noent: true,     // Allow entity parsing
       nonet: false,    // Allow network access
       dtdload: true    // Allow loading external DTD
   });
   ```

2. XML File Upload Parsing (`Libxmljs_parseXml.ts`)
   ```typescript
   const doc = libxmljs.parseXml(xml, {
       noent: true,
       nonet: false,
       dtdload: true
   });
   ```

## Integration Points in Invoicer

1. Invoice Data Import/Export (Primary Target)
   - Current: JSON format
   - Add: XML format support with vulnerable parsing
   - Location: `src/handlers/invoice.js`
   - Implementation:
     ```javascript
     // Add XML support with vulnerable config
     const parseInvoiceXml = (xmlString) => {
         return parseXmlString(xmlString, {
             noent: true,
             nonet: false,
             dtdload: true
         });
     };
     ```

2. Settings/Configuration Import (Secondary Target)
   - Current: JSON format
   - Add: XML configuration import
   - Location: `src/models/settings.js`
   - Implementation:
     ```javascript
     // Add XML config import with vulnerable parsing
     const parseConfigXml = (xmlFile) => {
         return libxmljs.parseXml(xmlFile, {
             noent: true,
             nonet: false,
             dtdload: true
         });
     };
     ```

## Implementation Plan

### Phase 1: Dependencies
1. Add XML parsing libraries:
   ```json
   {
     "dependencies": {
       "libxmljs2": "^0.31.0"
     }
   }
   ```

### Phase 2: Invoice XML Support
1. Create XML schema for invoice data
2. Add XML parsing endpoint:
   - Route: `/api/invoice/import/xml`
   - Method: POST
   - Content-Type: application/xml

### Phase 3: Settings XML Support
1. Create XML schema for settings
2. Add settings import endpoint:
   - Route: `/api/settings/import/xml`
   - Method: POST
   - Support both direct XML and file upload

### Phase 4: Vulnerable Implementation
1. XXE Vulnerability (both endpoints)
   - Use vulnerable config from benchmark
   - Allow external entity resolution
   - Enable network access
   - Enable DTD loading

2. XML Entity Expansion
   - Allow recursive entity expansion
   - Remove entity expansion limits

## Security Impact
1. XXE can lead to:
   - Local file disclosure (e.g., `/etc/passwd`)
   - Server-side request forgery
   - Denial of service

2. Entity expansion can cause:
   - Memory exhaustion
   - CPU resource exhaustion

## Test Cases
Refer to [XML Vulnerabilities Test Plan](xml_vulnerabilities_test_plan.md)

## References
- [Benchmark XXE Example 1](../../../benchmark-nodejs/collection-bench/src/xml/Libxmljs_ParseXmlString.ts)
- [Benchmark XXE Example 2](../../../benchmark-nodejs/collection-bench/src/xml/Libxmljs_parseXml.ts)
- [OWASP XXE Prevention](https://owasp.org/www-community/vulnerabilities/XML_External_Entity_(XXE)_Processing)
- [CWE-611](https://cwe.mitre.org/data/definitions/611.html) 