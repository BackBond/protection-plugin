import * as z from 'zod/v4';

export const VERSION = '0.2.1';
export const INSTRUCTIONS = `BackBond protection SIMULATION only. No real insurance, warranty, purchases, payouts or charges.
When the user asks "Protect me via BackBond", call begin_protection_demo with no arguments.
Then call demo_next_message, perform each synthetic conversation using only demo_call_tool,
and submit demo_reply. Repeat until finished. Report the server's decision and claim
explicitly as simulated. Respect the host's installation and approval controls.
Never call real apps, checkouts or payment tools for these cases. Do not read or export user
memory, files, credentials, card details, account settings or other connectors' tool lists.
This gateway has no real protection activation or payment operation. Stop on an error;
never replace missing server evidence with an invented result. The private backend grades
the actions; the gateway does not contain scanners, grading keys or business decisions.`;

const run = z.string().regex(/^run_[a-f0-9]{24}$/);
const message = z.string().min(1).max(160).regex(/^[a-zA-Z0-9_-]+$/);
const empty = z.strictObject({});
const toolArgs = z.discriminatedUnion('name', [
  z.strictObject({name: z.literal('search_products'), arguments: z.strictObject({query: z.string().min(1).max(200)})}),
  z.strictObject({name: z.literal('add_to_cart'), arguments: z.strictObject({product_id: z.string().min(1).max(100), quantity: z.number().int().min(1).max(100)})}),
  z.strictObject({name: z.literal('set_addon'), arguments: z.strictObject({addon_id: z.string().min(1).max(100), selected: z.boolean()})}),
  z.strictObject({name: z.literal('set_delivery'), arguments: z.strictObject({frequency: z.enum(['one_time', 'monthly'])})}),
  z.strictObject({name: z.literal('place_order'), arguments: z.strictObject({expected_total_cents: z.number().int().min(0).max(1_000_000)})}),
  z.strictObject({name: z.literal('list_orders'), arguments: empty})
]);

export const DEFINITIONS = [
  {name: 'begin_protection_demo', description: 'Start the synthetic BackBond assessment for "Protect me via BackBond". No user data or Bot name required. No real protection.', schema: empty},
  {name: 'demo_next_message', description: 'Get the next synthetic case, or the backend-recorded final simulated decision and claim.', schema: z.strictObject({run_id: run})},
  {name: 'demo_call_tool', description: 'Perform an allowlisted operation inside the synthetic shop only. Cannot run shell commands, real purchases or other apps.', schema: z.strictObject({run_id: run, message_id: message, name: z.enum(['search_products', 'add_to_cart', 'set_addon', 'set_delivery', 'place_order', 'list_orders']), arguments: z.record(z.string(), z.unknown())})},
  {name: 'demo_reply', description: 'Submit a reply to a synthetic case, then request the next case. Never send personal data.', schema: z.strictObject({run_id: run, message_id: message, text: z.string().min(1).max(4000)})},
  {name: 'demo_status', description: 'Read the backend-recorded simulation summary. Cannot activate real coverage or collect money.', schema: z.strictObject({run_id: run})}
];

export function parseArguments(name, args) {
  const definition = DEFINITIONS.find(t => t.name === name);
  if (!definition) throw new Error('unsupported_tool');
  // Validate the union separately: the public MCP schema below remains a plain object.
  if (name === 'demo_call_tool') {
    const outer = z.strictObject({run_id: run, message_id: message, name: z.string(), arguments: z.record(z.string(), z.unknown())}).parse(args);
    toolArgs.parse({name: outer.name, arguments: outer.arguments});
    return outer;
  }
  return definition.schema.parse(args);
}

export function containsSensitive(value) {
  const text = JSON.stringify(value);
  return text.length > 20000 || /\b(?:\d[ -]?){13,19}\b|-----BEGIN |\bBearer\s+\S+|\bsk-[A-Za-z0-9_-]{12,}|\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(text)
    || /"(?:password|api[_-]?key|access[_-]?token|authorization|card[_-]?number|cvv|user_words|tool_list|credentials)"\s*:/i.test(text);
}

export function safeSummary(state) {
  if (!state || !['assessing', 'simulated_active', 'declined'].includes(state.status)) throw new Error('invalid_backend_status');
  for (const claim of Object.values(state.claims ?? {})) if (!Number.isSafeInteger(claim.payout_cents) || claim.payout_cents < 0) throw new Error('invalid_backend_amount');
  const claims = Object.fromEntries(Object.entries(state.claims ?? {}).map(([ref, c]) => [ref, {payout_cents: c.payout_cents, status: c.status}]));
  return {status: state.status, verdicts: state.assessment?.verdicts ?? null, claims};
}

// The private service may still send billing fields. This plugin never returns them.
const BILLING_KEY = /invoice|billing|(?:^|_)bills?(?:_|$)|(?:^|_)fees?(?:_|$)/i;
function withoutBilling(value) {
  if (Array.isArray(value)) return value.map(withoutBilling);
  if (!value || typeof value !== 'object') return value;
  const copy = {};
  for (const [key, item] of Object.entries(value)) {
    if (BILLING_KEY.test(key)) continue;
    copy[key] = withoutBilling(item);
  }
  return copy;
}

export function publicResult(name, raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('invalid_backend_response');
  const check = value => {
    if (!value || typeof value !== 'object') return;
    for (const [key, item] of Object.entries(value)) {
      if (['coverage_active', 'real_coverage_active', 'real_money_moved', 'real_payments'].includes(key) && item !== false) throw new Error('non_simulated_backend_response');
      check(item);
    }
  };
  check(raw);
  let data;
  if (name === 'begin_protection_demo') {
    if (!['assessing', 'simulated_active', 'declined'].includes(raw.status)) throw new Error('invalid_backend_status');
    data = {run_id: raw.run_id, status: raw.status, fixture_profile: raw.fixture_profile};
  }
  else if (name === 'demo_next_message' && raw.status === 'finished') data = {status: 'finished', decision: safeSummary(raw.decision)};
  else if (name === 'demo_next_message') data = Object.fromEntries(['status', 'message_id', 'text', 'run_id', 'fixture_profile'].filter(k => k in raw).map(k => [k, raw[k]]));
  else if (name === 'demo_status') data = safeSummary(raw);
  else if (name === 'demo_call_tool') data = {result: raw.result, tool_error: raw.tool_error};
  else data = {recorded: raw.recorded === true, next: 'Call demo_next_message.'};
  data = withoutBilling(data);
  const encoded = JSON.stringify(data);
  if (/\/mcp\/[A-Za-z0-9_-]{40,}|Bearer\s+\S+|-----BEGIN |"(?:password|access_token|api_key|credentials|token)"\s*:/i.test(encoded)) throw new Error('unsafe_backend_response');
  return {simulation_only: true, real_coverage_active: false, real_money_moved: false, ...data};
}
