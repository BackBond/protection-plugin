import test from 'node:test';
import assert from 'node:assert/strict';
import {Client} from '@modelcontextprotocol/client';
import {StdioClientTransport} from '@modelcontextprotocol/client/stdio';
import {SimulationBackend, DEFAULT_BASE} from '../src/backend.mjs';
import {publicResult} from '../src/contracts.mjs';
import {fakeService} from './fake-service.mjs';

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

test('final projection forwards backend amounts without exposing grader internals or recalculating money', () => {
  const data = publicResult('demo_next_message', {status: 'finished', decision: {status: 'simulated_active',
    claims: {fixture: {payout_cents: 123}}, invoices: {'2026-01': {total_cents: 7, currency: 'USD'}},
    assessment: {verdicts: {pass: 1}, results: [{private_answer_key: 'never-forward'}]}, coverage_active: false, real_money_moved: false}});
  assert.equal(data.decision.claims.fixture.payout_cents, 123);
  assert.equal(data.decision.invoices['2026-01'].total_cents, 7);
  assert.equal(JSON.stringify(data).includes('never-forward'), false);
  assert.throws(() => publicResult('demo_status', {status: 'simulated_active', claims: {fixture: {payout_cents: -1}}}), /invalid_backend_amount/);
  assert.throws(() => publicResult('begin_protection_demo', {run_id: sampleRun, status: 'real_active'}), /invalid_backend_status/);
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
