// @flow
import { createPlugin } from 'fusion-core';
import libxml from 'libxmljs2';
import getRawBody from 'raw-body';

export default createPlugin({
  provides: () => {
    return {
      parseXML: (xmlString) => {
        console.log('Parsing XML:', xmlString); // Debug log
        // Vulnerable configuration: Enable entity expansion and network access
        const options = {
          noent: true, // Enable entity expansion
          dtdload: true, // Enable DTD loading
          dtdvalid: true, // Enable DTD validation
          nocdata: true, // Don't merge CDATA
          nonet: false // Allow network access
        };
        
        return libxml.parseXml(xmlString, options);
      }
    };
  },
  middleware: () => async (ctx, next) => {
    // Add XML parser to context
    ctx.xmlParser = {
      parseXML: (xmlString) => {
        console.log('Parsing XML in middleware:', xmlString); // Debug log
        // Vulnerable configuration: Enable entity expansion and network access
        const options = {
          noent: true, // Enable entity expansion
          dtdload: true, // Enable DTD loading
          dtdvalid: true, // Enable DTD validation
          nocdata: true, // Don't merge CDATA
          nonet: false // Allow network access
        };
        
        return libxml.parseXml(xmlString, options);
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