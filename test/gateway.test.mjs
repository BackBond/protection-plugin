import test from 'node:test';
import assert from 'node:assert/strict';
import {readdir, readFile} from 'node:fs/promises';
import {Client} from '@modelcontextprotocol/client';
import {StdioClientTransport} from '@modelcontextprotocol/client/stdio';
import {SimulationBackend, DEFAULT_BASE} from '../src/backend.mjs';
import {DEFINITIONS, INSTRUCTIONS, VERSION, publicResult} from '../src/contracts.mjs';
import {fakeService} from './fake-service.mjs';

const billingWords = /invoice|billing|\bfees?\b|\bbills?\b|2%/i;
const publicWording = /\binvoices?\b|\bfees?\b|\bbills?\b|2%/i;

const makeBackend = f => new SimulationBackend({base: f.base, allowLoopback: true});
const sampleRun = 'run_' + 'a'.repeat(24);

test('MCP handshake and exact five-tool list do not enroll; bundled gateway needs no runtime install', async t => {
  const fake = await fakeService(); t.after(() => fake.close());
  const transport = new StdioClientTransport({command: process.execPath, args: ['dist/gateway.mjs'],
    env: {BACKBOND_SIMULATION_BASE_URL: fake.base, BACKBOND_ALLOW_LOOPBACK_TEST: '1'}, stderr: 'pipe'});
  const client = new Client({name: 'backbond-test-client', version: '0.1.0'});
  t.after(() => client.close()); await client.connect(transport);
  assert.match(client.getInstructions(), /SIMULATION/);
  assert.deepEqual((await client.listTools()).tools.map(x => x.name), ['begin_protection_demo', 'demo_next_message', 'demo_call_tool', 'demo_reply', 'demo_status']);
  assert.equal(fake.requests.length, 0);
  const result = await client.callTool({name: 'begin_protection_demo', arguments: {}});
  assert.equal(result.structuredContent.simulation_only, true);
  assert.equal(result.structuredContent.real_coverage_active, false);
  assert.equal(fake.enrollments, 1);
  assert.equal('token' in result.structuredContent, false);
  const run_id = result.structuredContent.run_id;
  const status = await client.callTool({name: 'demo_status', arguments: {run_id}});
  assert.equal(JSON.stringify(status).includes('private-grader-field'), false);
  assert.equal(billingWords.test(JSON.stringify(status)), false);
  const invalid = await client.callTool({name: 'begin_protection_demo', arguments: {bot_label: 'real-person@example.com'}});
  assert.equal(invalid.isError, true);
  assert.equal(fake.enrollments, 1);
});

test('two installations isolate run IDs and begin retries reuse the private namespace', async t => {
  const fake = await fakeService(); t.after(() => fake.close());
  const a = makeBackend(fake), b = makeBackend(fake);
  const [x, y] = await Promise.all([a.call('begin_protection_demo', {}), b.call('begin_protection_demo', {})]);
  assert.notEqual(x.run_id, y.run_id); assert.equal(fake.enrollments, 2);
  assert.equal((await a.call('begin_protection_demo', {})).run_id, x.run_id);
  await assert.rejects(b.call('demo_status', {run_id: x.run_id}), /run_not_in_installation/);
});

test('concurrent first calls enroll only once', async t => {
  const f = await fakeService(); t.after(() => f.close()); const b = makeBackend(f);
  await Promise.all([b.call('begin_protection_demo', {}), b.call('begin_protection_demo', {})]);
  assert.equal(f.enrollments, 1);
});

test('invalid input, real data and arbitrary execution are rejected before network access', async t => {
  const f = await fakeService(); t.after(() => f.close()); const b = makeBackend(f);
  await assert.rejects(b.call('begin_protection_demo', {password: 'secret'}));
  await assert.rejects(b.call('demo_reply', {run_id: sampleRun, message_id: 'fixture', text: 'person@example.com'}), /sensitive/);
  await assert.rejects(b.call('demo_call_tool', {run_id: sampleRun, message_id: 'fixture', name: 'exec', arguments: {command: 'anything'}}));
  await assert.rejects(b.call('demo_call_tool', {run_id: sampleRun, message_id: 'fixture', name: 'list_orders', arguments: {url: 'http://169.254.169.254'}}));
  assert.equal(f.requests.length, 0);
});

test('endpoint cannot be overridden to arbitrary hosts, credentials or redirected capabilities', async t => {
  for (const base of ['https://evil.example/', 'http://localhost/', DEFAULT_BASE + '?x=1', 'https://u:p@scanner.backbond.ai/agent-connect/protection-demo/public/']) assert.throws(() => new SimulationBackend({base}), /unapproved_backend/);
  const f = await fakeService({badCapability: 'https://evil.example/mcp/' + 'a'.repeat(54)}); t.after(() => f.close());
  await assert.rejects(makeBackend(f).call('begin_protection_demo', {}), /unapproved_capability/);
  assert.equal(f.requests.length, 2);
});

test('expired service stops before enrollment; expiry is enforced after connection too', async t => {
  const f = await fakeService({expiry: '2000-01-01T00:00:00Z'}); t.after(() => f.close());
  await assert.rejects(makeBackend(f).call('begin_protection_demo', {}), /simulation_unavailable/);
  assert.equal(f.enrollments, 0);
  const g = await fakeService(); t.after(() => g.close()); let clock = Date.now();
  const b = new SimulationBackend({base: g.base, allowLoopback: true, now: () => clock});
  const run = await b.call('begin_protection_demo', {}); clock = Date.parse('2100-01-01');
  await assert.rejects(b.call('demo_status', {run_id: run.run_id}), /simulation_expired/);
});

test('upstream failures cannot invent protection or leak exception contents', async t => {
  const f = await fakeService({reply: {run_id: sampleRun, coverage_active: true}}); t.after(() => f.close());
  await assert.rejects(makeBackend(f).call('begin_protection_demo', {}), /non_simulated/);
  assert.throws(() => publicResult('demo_call_tool', {result: {token: 'credential'}}), /unsafe_backend_response/);
  const b = new SimulationBackend({fetchImpl: async () => {throw new Error('private-secret-url');}});
  await assert.rejects(b.call('begin_protection_demo', {}));
});

test('maintained service requires bounded per-install expiry and expires each capability', async t => {
  const clockStart = Date.parse('2026-11-16T16:00:00Z');
  const manifest = {status: 'available', simulation_only: true, service_lifecycle: 'maintained', session_ttl_seconds: 86400};
  const f = await fakeService({manifest, expiry: new Date(clockStart + 86400000).toISOString()});
  t.after(() => f.close());
  let clock = clockStart;
  const b = new SimulationBackend({base: f.base, allowLoopback: true, now: () => clock});
  const run = await b.call('begin_protection_demo', {});
  clock += 86400001;
  await assert.rejects(b.call('demo_status', {run_id: run.run_id}), /simulation_expired/);
  for (const expiry of ['invalid', '2026-11-16T15:00:00Z', '2099-01-01T00:00:00Z']) {
    const g = await fakeService({manifest, expiry}); t.after(() => g.close());
    await assert.rejects(new SimulationBackend({base: g.base, allowLoopback: true, now: () => clockStart}).call('begin_protection_demo', {}), /invalid_enrollment/);
  }
  const bad = await fakeService({manifest: {...manifest, session_ttl_seconds: 86401}}); t.after(() => bad.close());
  await assert.rejects(makeBackend(bad).call('begin_protection_demo', {}), /simulation_unavailable/);
  assert.equal(bad.enrollments, 0);
});

test('final projection forwards claim amounts and drops backend billing data', () => {
  const data = publicResult('demo_next_message', {status: 'finished', decision: {status: 'simulated_active',
    claims: {fixture: {payout_cents: 123, status: 'simulated_paid'}}, invoices: {'2026-01': {total_cents: 73401, currency: 'USD'}},
    billing: {monthly_fee: '2%'}, assessment: {verdicts: {pass: 1}, results: [{private_answer_key: 'never-forward'}]},
    coverage_active: false, real_money_moved: false}});
  assert.equal(data.decision.claims.fixture.payout_cents, 123);
  assert.equal(JSON.stringify(data).includes('73401'), false);
  assert.equal(billingWords.test(JSON.stringify(data)), false);
  assert.equal(JSON.stringify(data).includes('never-forward'), false);
  const started = publicResult('begin_protection_demo', {run_id: sampleRun, status: 'assessing',
    fixture_profile: {sources: ['public transport fixture'], invoices: {'2026-11': {total_cents: 73401}}, monthly_fee: 2}});
  assert.deepEqual(started.fixture_profile, {sources: ['public transport fixture']});
  const shop = publicResult('demo_call_tool', {result: {items: [{sku: 'fixture', price_cents: 500, invoices: {'2026-11': {total_cents: 73401}}}]}, tool_error: null});
  assert.equal(shop.result.items[0].price_cents, 500);
  assert.equal(JSON.stringify(shop).includes('73401'), false);
  assert.equal(billingWords.test(JSON.stringify(shop)), false);
  const message = publicResult('demo_next_message', {status: 'message', message_id: 'fixture_1', text: 'Public synthetic transport example.', run_id: sampleRun, fixture_profile: {invoices: {'2026-11': {total_cents: 73401}}}});
  assert.equal(JSON.stringify(message).includes('73401'), false);
  const declined = publicResult('demo_status', {status: 'declined', claims: {}, invoices: {'2026-01': {total_cents: -1}}, billing: {monthly_fee: '2%'}});
  assert.deepEqual(declined.claims, {});
  assert.equal(billingWords.test(JSON.stringify(declined)), false);
  assert.throws(() => publicResult('demo_status', {status: 'simulated_active', claims: {fixture: {payout_cents: -1}}}), /invalid_backend_amount/);
  assert.throws(() => publicResult('begin_protection_demo', {run_id: sampleRun, status: 'real_active'}), /invalid_backend_status/);
});

test('invoices from the backend never reach the agent', async t => {
  const fake = await fakeService({attachBilling: true}); t.after(() => fake.close());
  const transport = new StdioClientTransport({command: process.execPath, args: ['dist/gateway.mjs'],
    env: {BACKBOND_SIMULATION_BASE_URL: fake.base, BACKBOND_ALLOW_LOOPBACK_TEST: '1'}, stderr: 'pipe'});
  const client = new Client({name: 'billing-redaction-test', version: '0.1.0'});
  t.after(() => client.close()); await client.connect(transport);
  assert.equal(publicWording.test(client.getInstructions()), false);
  assert.equal((await client.listTools()).tools.some(tool => publicWording.test(tool.description)), false);
  const begin = await client.callTool({name: 'begin_protection_demo', arguments: {}});
  const run_id = begin.structuredContent.run_id;
  const seen = [begin];
  seen.push(await client.callTool({name: 'demo_status', arguments: {run_id}}));
  seen.push(await client.callTool({name: 'demo_next_message', arguments: {run_id}}));
  const shop = await client.callTool({name: 'demo_call_tool', arguments: {run_id, message_id: 'fixture_1', name: 'list_orders', arguments: {}}});
  seen.push(shop);
  seen.push(await client.callTool({name: 'demo_reply', arguments: {run_id, message_id: 'fixture_1', text: 'done'}}));
  const finished = await client.callTool({name: 'demo_next_message', arguments: {run_id}});
  seen.push(finished);
  for (const result of seen) {
    const text = JSON.stringify(result);
    assert.notEqual(result.isError, true);
    assert.equal(text.includes('73401'), false);
    assert.equal(billingWords.test(text), false);
  }
  assert.equal(shop.structuredContent.result.items[0].price_cents, 500);
  assert.equal(finished.structuredContent.status, 'finished');
  assert.equal(finished.structuredContent.decision.status, 'simulated_active');
  assert.equal(finished.structuredContent.decision.claims.fixture.payout_cents, 1000);
  assert.equal(JSON.stringify(finished).includes('private-grader-field'), false);
});

test('public wording does not mention a bill, invoice, fee or 2%', async () => {
  const files = (await readdir('.', {recursive: true})).filter(file => /\.(?:md|json)$/.test(file)
    && !/^(node_modules|\.git|dist)[\\/]/.test(file)
    && !/^schemas\/(?:Apache-2\.0|UPSTREAM-LICENSE)/.test(file)
    && file !== 'package-lock.json');
  for (const file of files) assert.equal(publicWording.test(await readFile(file, 'utf8')), false, file);
  assert.equal(publicWording.test(INSTRUCTIONS), false);
  for (const tool of DEFINITIONS) assert.equal(publicWording.test(tool.description), false, tool.name);
  const plugin = JSON.parse(await readFile('plugin.json', 'utf8'));
  const pkg = JSON.parse(await readFile('package.json', 'utf8'));
  assert.equal(plugin.version, VERSION);
  assert.equal(pkg.version, VERSION);
  const hash = (await readFile('dist/SHA256SUMS', 'utf8')).split(' ')[0];
  for (const file of ['README.md', 'TESTING.md', 'docs/SUBMISSION.md']) assert.equal((await readFile(file, 'utf8')).includes(hash), true, file);
});

test('MCP tool errors redact upstream destinations and capabilities', async t => {
  const secret = 'a'.repeat(54);
  const fake = await fakeService({badCapability: 'https://evil.example/mcp/' + secret}); t.after(() => fake.close());
  const transport = new StdioClientTransport({command: process.execPath, args: ['dist/gateway.mjs'],
    env: {BACKBOND_SIMULATION_BASE_URL: fake.base, BACKBOND_ALLOW_LOOPBACK_TEST: '1'}, stderr: 'pipe'});
  const client = new Client({name: 'redaction-test', version: '0.1.0'});
  t.after(() => client.close()); await client.connect(transport);
  const reply = await client.callTool({name: 'begin_protection_demo', arguments: {}});
  assert.equal(reply.isError, true);
  assert.match(reply.content[0].text, /SIMULATION STOPPED/);
  assert.equal(JSON.stringify(reply).includes(secret), false);
  assert.equal(JSON.stringify(reply).includes('evil.example'), false);
});
