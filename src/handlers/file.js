// @flow
import path from 'path';
import fs from 'fs';

// Simple Path Join Vulnerability
// Allows reading any file on the system through path traversal
export async function readFile(ctx) {
  const fileName = ctx.query.file;
  const filePath = path.join(__dirname, 'files', fileName);

  try {
    const content = await fs.promises.readFile(filePath, 'utf8');
    ctx.body = content;
  } catch (error) {
    ctx.status = 500;
    ctx.body = 'Error reading file';
  }
}

// Bypass Replace Vulnerability
// Attempts to prevent path traversal by replacing '../' but can be bypassed
export async function readFileSecure(ctx) {
  try {
    let filename = decodeURIComponent(ctx.query.filename);
    // Vulnerable: can be bypassed with '....' which becomes '../' after replace
    filename = filename.replace(/\.\.\//g, '');
    const filePath = path.join(__dirname, filename);
    const content = await fs.promises.readFile(filePath, 'utf8');
    ctx.body = content;
  } catch (error) {
    ctx.status = 404;
    ctx.body = 'File not found';
  }
}

// PDF Template Path Traversal
// Allows reading template files through path traversal
export async function getPdfTemplate(ctx) {
  const templateName = ctx.query.template;
  // Vulnerable: no path validation
  const templatePath = path.join(__dirname, '../templates', templateName);

  try {
    const template = await fs.promises.readFile(templatePath, 'utf8');
    ctx.body = template;
  } catch (error) {
    ctx.status = 404;
    ctx.body = 'Template not found';
  }
} 