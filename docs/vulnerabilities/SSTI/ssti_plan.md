# SSTI (Server-Side Template Injection) Vulnerability Plan

[Test Plan](ssti_test_plan.md)

## Source Analysis (benchmark-nodejs)
The SSTI vulnerability in benchmark-nodejs is implemented through:
- Template engine: Uses template literals or string interpolation
- Direct user input injection into templates
- No input validation or sanitization
- Template execution in unsafe context

## Target Analysis (invoicer)
The invoicer application will implement SSTI through the invoice template system:
- Natural integration point as invoices need customizable templates
- Templates are used for invoice generation
- PDF generation already requires template processing

## Implementation Plan

### Template System Implementation
Location: `src/models/template.js`

1. Add template processing functionality:
```javascript
function processTemplate(template, data) {
  // SSTI vulnerability: Direct template string evaluation
  return new Function('data', `with(data) { return \`${template}\`; }`)(data);
}
```

2. Add template endpoints:
```javascript
// Template storage and retrieval
app.post('/api/template', saveTemplate);
app.get('/api/template/:id', getTemplate);
app.post('/api/template/render', renderTemplate);
```

3. Template Data Model:
```javascript
{
  id: String,
  name: String,
  content: String,  // Raw template content
  created: Date,
  modified: Date
}
```

## Security Notes
This vulnerability is for educational purposes only:
- No template sanitization
- Direct template execution
- Unsafe context evaluation
- No input validation

## Implementation Steps

1. Create Template Model
   ```javascript
   // Add template schema
   // Add template storage functions
   ```

2. Add Template Processing
   ```javascript
   // Add template engine
   // Implement without sanitization
   ```

3. Add Template Endpoints
   ```javascript
   // Add API routes
   // Add template CRUD operations
   ```

4. Update Invoice Generation
   ```javascript
   // Integrate template processing
   // Add template selection
   ```

5. Document Changes
   - Update API documentation
   - Add security notes
   - Document test cases

## Rollback Plan
1. Keep original invoice generation
2. Add feature flag for template system
3. Document reversion process

## Links
- [Main Project Plan](../plan.md)
- [Test Plan](ssti_test_plan.md)
- [Benchmark Source](https://github.com/your-org/benchmark-nodejs) 