// @flow
import { createPlugin } from 'fusion-core';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import getRawBody from 'raw-body';

export default createPlugin({
  provides: () => {
    return {
      parseXML: (xmlString) => {
        console.log('Parsing XML:', xmlString); // Debug log
        // Vulnerable configuration: Enable entity expansion and network access
        const options = {
          ignoreAttributes: false,
          allowBooleanAttributes: true,
          parseAttributeValue: true,
          parseTagValue: true,
          trimValues: true,
          // Intentionally vulnerable configurations for educational purposes
          allowDTD: true, // Enable DTD processing
          validateXML: false, // Disable XML validation
          processEntities: true, // Enable entity processing
          stopNodes: [], // Process all nodes
          htmlEntities: true, // Enable HTML entities
        };

        const parser = new XMLParser(options);
        return parser.parse(xmlString);
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
          ignoreAttributes: false,
          allowBooleanAttributes: true,
          parseAttributeValue: true,
          parseTagValue: true,
          trimValues: true,
          // Intentionally vulnerable configurations for educational purposes
          allowDTD: true, // Enable DTD processing
          validateXML: false, // Disable XML validation
          processEntities: true, // Enable entity processing
          stopNodes: [], // Process all nodes
          htmlEntities: true, // Enable HTML entities
        };

        const parser = new XMLParser(options);
        return parser.parse(xmlString);
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
