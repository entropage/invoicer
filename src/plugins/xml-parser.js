// @flow
import { createPlugin } from 'fusion-core';
import libxmljs from 'libxmljs';
import getRawBody from 'raw-body';

export default createPlugin({
  provides: () => {
    return {
      parseXML: (xmlString) => {
        console.log('Parsing XML:', xmlString); // Debug log
        try {
          return libxmljs.parseXml(xmlString, {
            noent: true,    // 允许实体替换
            nonet: false,   // 允许网络访问
            dtdload: true   // 允许加载外部DTD
          });
        } catch (error) {
          console.error('XML parsing error:', error);
          throw error;
        }
      }
    };
  },
  middleware: () => async (ctx, next) => {
    // Add XML parser to context
    ctx.xmlParser = {
      parseXML: (xmlString) => {
        console.log('Parsing XML in middleware:', xmlString); // Debug log
        try {
          return libxmljs.parseXml(xmlString, {
            noent: true,    // 允许实体替换
            nonet: false,   // 允许网络访问
            dtdload: true   // 允许加载外部DTD
          });
        } catch (error) {
          console.error('XML parsing error:', error);
          throw error;
        }
      }
    };

    // Log request details
    console.log('Request headers:', ctx.request.headers);
    console.log('Content-Type:', ctx.request.headers['content-type']);

    // Handle raw XML body if content-type is XML
    const contentType = ctx.request.headers['content-type'] || '';
    if (contentType.includes('xml')) {
      try {
        const rawBody = await getRawBody(ctx.req, {
          length: ctx.req.headers['content-length'],
          limit: '1mb',
          encoding: 'utf8'
        });
        ctx.request.body = rawBody;
        console.log('XML Request Body:', rawBody); // Debug log
      } catch (error) {
        console.error('Error reading XML body:', error);
        ctx.status = 400;
        ctx.body = {
          success: false,
          error: 'Invalid XML request'
        };
        return;
      }
    }

    await next();

    // Log response for debugging
    if (contentType.includes('xml')) {
      console.log('XML Response:', {
        status: ctx.status,
        body: ctx.body
      });
    }
  }
});

// Helper function to convert libxmljs document to JSON-like structure
function convertXmlToJson(doc) {
  const root = doc.root();
  if (!root) {
    return null;
  }
  return nodeToJson(root);
}

function nodeToJson(node) {
  const result = {};
  
  // Handle text content
  const text = node.text().trim();
  if (text) {
    result['#text'] = text;
  }
  
  // Handle attributes
  const attrs = node.attrs();
  if (attrs.length > 0) {
    result['@'] = {};
    attrs.forEach(attr => {
      result['@'][attr.name()] = attr.value();
    });
  }

  // Handle child nodes
  const children = node.childNodes();
  children.forEach(child => {
    if (child.type() === 'element') {
      const childName = child.name();
      const childValue = nodeToJson(child);
      
      if (result[childName]) {
        if (!Array.isArray(result[childName])) {
          result[childName] = [result[childName]];
        }
        result[childName].push(childValue);
      } else {
        result[childName] = childValue;
      }
    }
  });

  // If only text content exists, return it directly
  if (Object.keys(result).length === 1 && result['#text']) {
    return result['#text'];
  }

  return result;
}
