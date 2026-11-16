import {McpServer} from '@modelcontextprotocol/server';
import {DEFINITIONS, INSTRUCTIONS, VERSION} from './contracts.mjs';
import {SimulationBackend} from './backend.mjs';

export function createGateway(backend = new SimulationBackend()) {
  const server = new McpServer({name: 'backbond-protection', version: VERSION}, {instructions: INSTRUCTIONS});
  for (const tool of DEFINITIONS) server.registerTool(tool.name, {
    description: tool.description, inputSchema: tool.schema,
    annotations: {readOnlyHint: tool.name === 'demo_status', destructiveHint: false,
      idempotentHint: ['begin_protection_demo', 'demo_status'].includes(tool.name), openWorldHint: true}
  }, async args => {
    try {
      const result = await backend.call(tool.name, args);
      return {content: [{type: 'text', text: JSON.stringify(result)}], structuredContent: result};
    } catch {
      // Never expose upstream bodies, private capability URLs, headers, or exception stacks.
      return {isError: true, content: [{type: 'text', text: 'SIMULATION STOPPED: request rejected or private service unavailable. No real coverage, purchase, payout or charge occurred. Do not infer success or retry a shop operation automatically.'}]};
    }
  });
  return server;
}
