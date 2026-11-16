import Ajv2020 from 'ajv/dist/2020.js';
import {readFile, readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

const ajv = new Ajv2020({strict: false});
for (const name of ['plugin', 'mcp']) {
  const schema = JSON.parse(await readFile(`schemas/${name}.schema.json`, 'utf8'));
  const validate = ajv.compile(schema);
  assert(validate(JSON.parse(await readFile(`${name}.json`, 'utf8'))), JSON.stringify(validate.errors));
}
const mcp = JSON.parse(await readFile('mcp.json', 'utf8'));
assert.deepEqual(mcp.mcpServers['backbond-protection'], {type: 'stdio', command: 'node', args: ['./dist/gateway.mjs']});
const bytes = await readFile('dist/gateway.mjs');
assert.equal((await readFile('dist/SHA256SUMS', 'utf8')).split(' ')[0], createHash('sha256').update(bytes).digest('hex'));
const inputs = JSON.parse(await readFile('dist/build-inputs.json', 'utf8'));
assert(inputs.every(p => p.startsWith('node_modules/') || /^(bin|src)\//.test(p)));
assert(inputs.every(p => !/private|one-line-demo|booking-pilot|checks\.py|engine\.py/i.test(p)));
assert(!bytes.includes(Buffer.from('DEMO-WRONG-QTY')));
assert(!bytes.includes(Buffer.from('RATE_BPS')));
const files = await readdir('.', {recursive: true});
const scanned = files.filter(p => !/^(node_modules|\.git|test-results|\.private)[\\/]/.test(p));
for (const file of scanned) {
  if (!/\.(?:mjs|json|md|txt)$/.test(file)) continue;
  const text = await readFile(file, 'utf8');
  assert(!/\/mcp\/[A-Za-z0-9_-]{40,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY|Bearer [A-Za-z0-9_.-]{24,}/.test(text), `Secret-like content: ${file}`);
}
assert((await readFile('LICENSE', 'utf8')).startsWith('MIT License'));
const logo = await readFile('assets/logo.svg', 'utf8');
assert(logo.includes('viewBox="0 0 512 512"') && logo.includes('data:image/png;base64,'));
assert(!/<script|https?:\/\//.test(logo.replace('http://www.w3.org/2000/svg', '')));
console.log(JSON.stringify({passed: true, official_plugin_and_mcp_schemas: true, bundle_hash_verified: true,
  private_source_absent_from_build_inputs: true, secret_pattern_scan_passed: true, square_embedded_logo: true}));
