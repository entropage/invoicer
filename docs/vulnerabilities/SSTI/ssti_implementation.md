# SSTI Vulnerability Implementation

## Overview
The Server-Side Template Injection (SSTI) vulnerability has been implemented in the template handler using Fusion.js. The implementation allows for arbitrary code execution through template evaluation.

## Implementation Details

### Template Handler
The template handler is implemented in `src/plugins/template.js` and includes:
- Template creation endpoint (`POST /api/template`)
- Template retrieval endpoint (`GET /api/template/:id`)
- Template rendering endpoint (`POST /api/template/render`)

### Vulnerability Details
The vulnerability is intentionally introduced in the `processTemplate` function:
```javascript
function processTemplate(template, data) {
  try {
    const fn = new Function('data', `
      const require = global.require || module.require;
      with (data) {
        try {
          const result = eval(\`${template}\`);
          if (result && typeof result.then === 'function') {
            return result;
          }
          return result;
        } catch (e) {
          if (e instanceof ReferenceError && /global/.test(e.message)) {
            return undefined;
          }
          throw e;
        }
      }
    `);
    return fn(data);
  } catch (error) {
    console.error('Template processing error:', error);
    throw error;
  }
}
```

The vulnerability allows for:
1. Code execution via `eval`
2. File system access via `require('fs')`
3. Network access via `require('http')`
4. Command execution via `require('child_process')`

### Test Cases
Test cases in `test/test_ssti.py` verify:
- Basic template rendering
- Code execution capabilities
- File system access
- Network access
- Various template syntax variations

## Current Status
- Basic template rendering works
- Code execution tests pass
- File system access tests pass
- Network access tests are failing due to connectivity issues
- Template syntax variations need improvement

## Known Issues
1. Network access tests fail with ECONNREFUSED
2. Template syntax variations need better error handling
3. Server crashes when handling certain template operations

## Next Steps
1. Fix network access by ensuring proper host resolution
2. Improve error handling in template evaluation
3. Add better logging for debugging template operations
4. Document additional test cases and exploitation methods 