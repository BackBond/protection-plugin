# BackBond protection plugin

**Simulation only.** An open-source plugin and MCP gateway to BackBond's private protection simulation. No real insurance, warranty, purchase, payout or charge is created.

The intended user request is **Protect me via BackBond**. Marketplace approval and discovery from that phrase are not established by this source release. This package does not preinstall itself or alter existing connections.

## Open interface, private service

The MIT-licensed source includes the root `plugin.json`, `mcp.json`, the packaged workflow skill, five tool schemas, the connection gateway, public transport tests and build tooling. It does not include BackBond's proprietary scans, confidential test catalogue, grading keys, underwriting, pricing, claims logic or customer records.

The bundled gateway runs as a separate Node.js process over MCP stdio. It reads the published simulation manifest, enrolls an isolated synthetic namespace with an empty JSON object, then invokes only five allowlisted operations on the returned private capability URL. That capability stays in process memory and is not exposed as a tool result or written to disk by this gateway. Each process gets its own namespace; restarting does not restore a previous installation's state. This is a simulation enrollment mechanism, not production identity or insurance-account binding.

The private service supplies synthetic cases, grades the actions and returns the recorded results. Cases delivered to the agent and reported results are visible to that agent; the implementation and broader test bank stay on BackBond's servers. The gateway does not calculate ratings, eligibility or claim amounts.

## Build and test

Requires Node.js 20 or later. From this plugin's root:

```sh
npm ci --ignore-scripts
npm run build
npm test
npm run validate
```

The checked-in `dist/gateway.mjs` is an unminified bundle of the gateway and pinned runtime dependencies. Hosts can launch it with `node ./dist/gateway.mjs` from the plugin root without installing dependencies. `mcp.json` uses that command and no embedded credentials, user-specific paths or shell interpolation. The transport and the plugin manifest follow Agent Plugins 1.0.0. Exact Grok Bot host import behavior still requires in-app verification.

The public test suite uses loopback HTTP fixtures and the official MCP client. It does not contact BackBond, access user apps or claim to be a Grok Bot test. See `TESTING.md` for the private-engine acceptance scope and reviewer steps.

## Tools

| Tool | Purpose |
|---|---|
| `begin_protection_demo` | Enroll a synthetic namespace and start the private assessment; accepts no user profile. |
| `demo_next_message` | Retrieve the next synthetic case or recorded final result. |
| `demo_call_tool` | Perform a strictly validated operation in the synthetic shop. |
| `demo_reply` | Submit the response to a synthetic case. |
| `demo_status` | Read the server-recorded simulation summary. |

No shell, filesystem, mailbox, payment, actual coverage-binding or generic URL-fetch tool is exposed. Tool listing and MCP initialization do not enroll or contact BackBond; the first valid start request does.

## Data and availability

The default upstream is the maintained simulation at `https://scanner.backbond.ai/agent-connect/protection-simulation/v1/`. The service runs independently of the earlier temporary demonstration. Each enrollment expires after 24 hours; restart the gateway for a fresh synthetic namespace. The gateway validates that the declared lifetime is at most 24 hours and refuses calls after expiry. The service has bounded capacity and can refuse enrollment. Availability is best effort, with no uptime commitment. A private operator runbook covers health checks and capacity recovery.

Do not send real user instructions, app configuration, tool inventories, emails, credentials, card details or real purchase data. The gateway rejects selected sensitive patterns and unexpected fields; that filter is not a general guarantee that arbitrary text contains no personal data. Provide only synthetic case inputs. See `PRIVACY.md` and `SECURITY.md`.

The plugin is free and returns no billing information. Any future commercial BackBond service is separate from this plugin.

## Release and submission status

Current bundle: `v0.2.1`, `dist/gateway.mjs` SHA-256 `d6497aa4ae2707cd5985aaf32ef30286229cdcc4c8a54733ed4a352220e4c37b`. An installed-component test of `v0.2.0` in an isolated Grok Bot account, after registering the reviewed gateway and saving the unchanged `skills/protect-me-via-backbond/SKILL.md` through the Bot's shared private skill tool, completed synthetic assessment `run_234dc2b2857639e3ae284507` (6/6 pass, `simulated_active`, simulated $10.00 claim; temporary components removed afterward). Native marketplace catalog installation and cold one-line discovery remain subject to xAI marketplace review and listing.

References: [Agent Plugins](https://agent-plugins.org/plugin-authors/manifest), [MCP configuration](https://agent-plugins.org/plugin-authors/mcp-servers), [official MCP SDK](https://github.com/modelcontextprotocol/typescript-sdk), [Grok Bot submission](https://x.ai/bot/marketplace/submit-a-plugin).

Code: MIT. BackBond logos identify the plugin and remain subject to trademark rights. Bundled dependency licences are reproduced in `dist/THIRD_PARTY_NOTICES.txt`.
