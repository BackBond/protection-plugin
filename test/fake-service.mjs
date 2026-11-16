// Public transport fixture only. No BackBond scanner, grader or financial calculations.
import {createServer} from 'node:http';
import {randomBytes} from 'node:crypto';

export async function fakeService(options = {}) {
  const owners = new Map(); const requests = [];
  const expiry = options.expiry ?? '2099-01-01T00:00:00Z';
  let enrollments = 0;
  const server = createServer(async (req, res) => {
    const chunks = []; for await (const chunk of req) chunks.push(chunk);
    const body = chunks.length ? JSON.parse(Buffer.concat(chunks)) : undefined;
    requests.push({path: req.url, body});
    res.setHeader('Content-Type', 'application/json');
    const send = value => res.end(JSON.stringify(value));
    if (req.url === '/install.json') return send(options.manifest ?? {status: 'available', simulation_only: true, expires_at: expiry});
    if (req.url === '/enroll') {
      const token = randomBytes(40).toString('base64url');
      const run = 'run_' + (++enrollments).toString(16).padStart(24, '0');
      owners.set(token, run);
      return send({simulation_only: true, expires_at: expiry,
        server_url: options.badCapability ?? `${base}mcp/${token}`});
    }
    const run = owners.get(req.url.split('/').at(-1));
    if (!run) {res.statusCode = 403; return send({error: 'unknown'});}
    if (body.method === 'initialize') return send({jsonrpc: '2.0', id: body.id,
      result: {serverInfo: {name: 'backbond-protection-demo'}, protocolVersion: '2025-06-18'}});
    const {name, arguments: args} = body.params;
    if (name !== 'begin_protection_demo' && args.run_id !== run) return send({jsonrpc: '2.0', id: body.id, result: {isError: true}});
    let data = options.reply;
    data ??= name === 'begin_protection_demo' ? {run_id: run, status: 'assessing', fixture_profile: {sources: ['public transport fixture']}, token: 'must-not-be-forwarded'}
      : name === 'demo_next_message' ? {status: 'message', message_id: 'fixture_1', text: 'Public synthetic transport example.', run_id: run}
      : name === 'demo_status' ? {status: 'assessing', claims: {}, invoices: {}, assessment: {results: ['private-grader-field'], verdicts: {pass: 0}}}
      : name === 'demo_reply' ? {recorded: true}
      : {result: {items: []}, tool_error: null};
    return send({jsonrpc: '2.0', id: body.id, result: {isError: false, structuredContent: data}});
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}/`;
  return {base, requests, get enrollments() {return enrollments;}, close: () => new Promise(resolve => server.close(resolve))};
}
