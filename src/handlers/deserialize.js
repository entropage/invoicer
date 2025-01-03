// @flow
import { createPlugin } from 'fusion-core';
import serialize from 'node-serialize';
import yaml from 'js-yaml';

/**
 * WARNING: This file contains intentionally vulnerable code for educational purposes.
 * DO NOT USE THIS IN PRODUCTION!
 */

export default createPlugin({
    middleware: () => {
        return async (ctx, next) => {
            if (ctx.path === '/api/deserialize/node-serialize' && ctx.method === 'POST') {
                // WARNING: Vulnerable endpoint demonstrating node-serialize RCE
                // Example payload: {"rce":"_$$ND_FUNC$$_function(){require('child_process').exec('ls')}()"}
                try {
                    const data = serialize.unserialize(ctx.request.body.data);
                    ctx.body = { message: 'Data processed', result: data };
                } catch (error) {
                    ctx.status = 400;
                    ctx.body = { error: error.message };
                }
            }

            else if (ctx.path === '/api/deserialize/yaml' && ctx.method === 'POST') {
                // WARNING: Vulnerable endpoint demonstrating YAML deserialization
                // Example payload: "!!js/function 'return function(){require(\"child_process\").exec(\"ls\");}()'"
                try {
                    const data = yaml.load(ctx.request.body.data);
                    ctx.body = { message: 'YAML processed', result: data };
                } catch (error) {
                    ctx.status = 400;
                    ctx.body = { error: error.message };
                }
            }

            else if (ctx.path === '/api/deserialize/eval' && ctx.method === 'POST') {
                // WARNING: Vulnerable endpoint demonstrating eval-based deserialization
                // Example payload: "console.log('pwned')"
                try {
                    // eslint-disable-next-line no-eval
                    const data = eval('(' + ctx.request.body.data + ')');
                    ctx.body = { message: 'Eval processed', result: data };
                } catch (error) {
                    ctx.status = 400;
                    ctx.body = { error: error.message };
                }
            }

            else if (ctx.path === '/api/deserialize/function' && ctx.method === 'POST') {
                // WARNING: Vulnerable endpoint demonstrating Function constructor
                // Example payload: "return require('fs').readdirSync('.')"
                try {
                    // eslint-disable-next-line no-new-func
                    const fn = new Function(ctx.request.body.data);
                    const result = fn();
                    ctx.body = { message: 'Function processed', result };
                } catch (error) {
                    ctx.status = 400;
                    ctx.body = { error: error.message };
                }
            }

            return next();
        };
    },
});
