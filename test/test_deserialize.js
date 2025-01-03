// @flow
import test from 'tape-cup';
import App from '../src/App';
import { getService } from 'fusion-test-utils';
import serialize from 'node-serialize';

/* eslint-disable no-new-func */

test('Deserialization Vulnerabilities - node-serialize', async t => {
    const app = new App('test', () => 'test');
    const sim = getService(app, 'test');

    // Test 1: Basic node-serialize vulnerability
    const payload = {
        rce: '_$$ND_FUNC$$_function(){return \'RCE successful\'}()'
    };
    const serialized = serialize.serialize(payload);

    const result = await sim.request('/api/deserialize/node-serialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: serialized })
    });

    t.equal(result.status, 200, 'node-serialize endpoint responds');
    t.ok(result.body.result, 'Response contains result');
    t.end();
});

test('Deserialization Vulnerabilities - YAML', async t => {
    const app = new App('test', () => 'test');
    const sim = getService(app, 'test');

    // Test 2: YAML deserialization vulnerability
    const yamlPayload = '!!js/function \'return "YAML injection successful"\'';

    const result = await sim.request('/api/deserialize/yaml', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: yamlPayload })
    });

    t.equal(result.status, 200, 'YAML endpoint responds');
    t.ok(result.body.result, 'Response contains result');
    t.end();
});

test('Deserialization Vulnerabilities - eval', async t => {
    const app = new App('test', () => 'test');
    const sim = getService(app, 'test');

    // Test 3: eval-based deserialization
    const evalPayload = '({result: "eval successful"})';

    const result = await sim.request('/api/deserialize/eval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: evalPayload })
    });

    t.equal(result.status, 200, 'eval endpoint responds');
    t.ok(result.body.result, 'Response contains result');
    t.end();
});

test('Deserialization Vulnerabilities - Function constructor', async t => {
    const app = new App('test', () => 'test');
    const sim = getService(app, 'test');

    // Test 4: Function constructor vulnerability
    const functionPayload = 'return "Function constructor successful"';

    const result = await sim.request('/api/deserialize/function', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: functionPayload })
    });

    t.equal(result.status, 200, 'Function constructor endpoint responds');
    t.ok(result.body.result, 'Response contains result');
    t.end();
});
