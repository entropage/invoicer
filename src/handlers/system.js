// @flow
import { exec, execSync } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

// Simple command injection using exec
export async function executeCommand(ctx) {
  console.log('Received command execution request');
  const { command } = ctx.query;
  console.log('Command:', command);
  
  try {
    console.log('Executing command...');
    const { stdout, stderr } = await execPromise(command);
    console.log('Command output:', stdout);
    ctx.body = { output: stdout };
  } catch (error) {
    console.error('Command execution failed:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

// Command injection in PDF generation
export async function generatePdfReport(ctx) {
  const { template, output } = ctx.query;
  
  try {
    // Vulnerable: template and output are not sanitized
    const command = `wkhtmltopdf ${template} ${output}`;
    execSync(command);
    ctx.body = { message: 'PDF generated successfully' };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

// Command injection in network diagnostics
export async function checkConnection(ctx) {
  const { host } = ctx.query;
  
  try {
    // Vulnerable: host is not sanitized
    const command = `ping -c 4 ${host}`;
    const output = execSync(command);
    ctx.body = { output: output.toString() };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
}

// Command injection in system information
export async function getSystemInfo(ctx) {
  const { type } = ctx.query;
  
  try {
    // Vulnerable: type parameter allows command injection
    let command = '';
    switch(type) {
      case 'cpu':
        command = 'cat /proc/cpuinfo';
        break;
      case 'memory':
        command = 'free -m';
        break;
      case 'disk':
        command = 'df -h';
        break;
      default:
        command = type; // Vulnerable: allows arbitrary commands
    }
    
    const output = execSync(command);
    ctx.body = { output: output.toString() };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
} 