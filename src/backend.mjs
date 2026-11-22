import {randomUUID} from 'node:crypto';
import {containsSensitive, parseArguments, publicResult, VERSION} from './contracts.mjs';

export const DEFAULT_BASE = 'https://scanner.backbond.ai/agent-connect/protection-simulation/v1/';
const MAX_RESPONSE = 512 * 1024;

export class SimulationBackend {
  #base; #fetch; #now; #connection; #sequence = 0; #label; #deadline; #runs = new Set();
  constructor({base = DEFAULT_BASE, allowLoopback = false, fetchImpl = fetch, now = Date.now} = {}) {
    const url = new URL(base);
    const loopback = allowLoopback && url.protocol === 'http:' && url.hostname === '127.0.0.1';
    if ((!loopback && url.href !== DEFAULT_BASE) || url.username || url.password || url.search || url.hash || !url.pathname.endsWith('/')) throw new Error('unapproved_backend');
    this.#base = url; this.#fetch = fetchImpl; this.#now = now;
    this.#label = `BackBond plugin simulation ${randomUUID()}`;
  }
  async #json(url, body) {
    const response = await this.#fetch(url, {method: body === undefined ? 'GET' : 'POST', redirect: 'error',
      headers: {Accept: 'application/json', ...(body === undefined ? {} : {'Content-Type': 'application/json'})},
      ...(body === undefined ? {} : {body: JSON.stringify(body)}), signal: AbortSignal.timeout(15000)});
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) throw new Error('backend_unavailable');
    const chunks = []; let size = 0;
    for await (const chunk of response.body) {
      size += chunk.length;
      if (size > MAX_RESPONSE) throw new Error('backend_response_too_large');
      chunks.push(chunk);
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  }
  async #enroll() {
    const manifest = await this.#json(new URL('install.json', this.#base));
    const maintained = manifest.service_lifecycle === 'maintained';
    const serviceDeadline = Date.parse(manifest.expires_at);
    const ttl = manifest.session_ttl_seconds;
    if (manifest.simulation_only !== true || manifest.status !== 'available' ||
      (maintained ? (!Number.isInteger(ttl) || ttl < 60 || ttl > 86400) :
        (!Number.isFinite(serviceDeadline) || this.#now() >= serviceDeadline))) throw new Error('simulation_unavailable');
    const started = this.#now();
    const enrollment = await this.#json(new URL('enroll', this.#base), {});
    const deadline = Date.parse(enrollment.expires_at);
    if (enrollment.simulation_only !== true || !Number.isFinite(deadline) || deadline <= this.#now() ||
      (maintained ? deadline > started + ttl * 1000 + 15000 : deadline !== serviceDeadline)) throw new Error('invalid_enrollment');
    this.#deadline = deadline;
    const capability = new URL(enrollment.server_url);
    const prefix = new URL('mcp/', this.#base).href;
    if (!capability.href.startsWith(prefix) || !/^[A-Za-z0-9_-]{54}$/.test(capability.href.slice(prefix.length))) throw new Error('unapproved_capability');
    const initialized = await this.#json(capability, {jsonrpc: '2.0', id: ++this.#sequence, method: 'initialize',
      params: {protocolVersion: '2025-06-18', capabilities: {}, clientInfo: {name: 'backbond-protection-open-gateway', version: VERSION}}});
    if (initialized.id !== this.#sequence || initialized.error || initialized.result?.serverInfo?.name !== 'backbond-protection-demo') throw new Error('invalid_backend_handshake');
    return capability;
  }
  async call(name, args) {
    const parsed = parseArguments(name, args);
    if (containsSensitive(parsed)) throw new Error('sensitive_or_oversize_input');
    if (name !== 'begin_protection_demo' && !this.#runs.has(parsed.run_id)) throw new Error('run_not_in_installation');
    if (this.#deadline && this.#now() >= this.#deadline) throw new Error('simulation_expired');
    // Single enrollment per process; a failure stays failed until the process is restarted.
    this.#connection ??= this.#enroll();
    const capability = await this.#connection;
    if (this.#now() >= this.#deadline) throw new Error('simulation_expired');
    const id = ++this.#sequence;
    const reply = await this.#json(capability, {jsonrpc: '2.0', id, method: 'tools/call',
      params: {name, arguments: name === 'begin_protection_demo' ? {bot_label: this.#label} : parsed}});
    if (reply.jsonrpc !== '2.0' || reply.id !== id || reply.error || reply.result?.isError || !reply.result?.structuredContent) throw new Error('backend_operation_failed');
    const result = publicResult(name, reply.result.structuredContent);
    if (name === 'begin_protection_demo') {
      if (!/^run_[a-f0-9]{24}$/.test(result.run_id)) throw new Error('invalid_backend_run');
      this.#runs.add(result.run_id);
    }
    return result;
  }
}
