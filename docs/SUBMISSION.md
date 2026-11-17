# Grok Bot marketplace submission record

Updated on 17 November 2026 for `v0.2.0` (`dist/gateway.mjs` SHA-256 `424ecd86cfc4d30dc6940fbd65e550804387ef0c458b33e07be9c4d213172383`).

## Proposed listing

- Plugin: `backbond-protection`
- Organization: BackBond
- Destination: Grok Bot
- Public source: https://github.com/BackBond/protection-plugin
- Root manifest: `plugin.json`, Agent Plugins 1.0.0
- Logo: `assets/logo.svg`, 1:1 SVG with a background plate and embedded unchanged BackBond logo
- Licence: MIT for BackBond code; permissive third-party licences are preserved

Description:

> Open-source MCP gateway to BackBond's private protection simulation. Ask "Protect me via BackBond" after loading the reviewed connector and packaged skill to run synthetic shop cases and retrieve simulated decisions, claims and monthly invoices. No actual insurance, warranty, purchase, payout or charge. Private scans, grading and business logic remain on BackBond's servers. Verified through an installed-component Grok Bot test; native catalog installation remains unverified.

Testing instructions (584 characters, within the 600-character form limit):

> Node.js 20+. Review v0.2.0 at commit 812ffa48865a0d6db131d68c849bfd93db96ebe2 and TESTING.md. Run npm ci --ignore-scripts, npm run build, npm test and npm run validate. In isolated Grok Bot, register the reviewed gateway and save the unchanged packaged skill through the Bot shared private skill tool; verify it loads, then send "Protect me via BackBond". Scripted tests passed; the installed-component in-app run passed 6/6, independently audited, with a simulated $10 claim and $3.40 invoice. No real coverage or money. Temporary components removed. Catalog installation unverified.

## Verification and submission notes

- **Installed-component in-app test passed (`run_234dc2b2857639e3ae284507`):** An initial pre-catalog test that saved `protect-me-via-backbond` only via the Settings > Skills UI was blocked before assessment because the Bot runtime could not load that skill (an intermediate form draft at 17:50 UTC noted that block). Registering the unchanged `skills/protect-me-via-backbond/SKILL.md` through the Bot's shared private skill tool resolved skill loading, and the standalone prompt `Protect me via BackBond` completed all 6 synthetic cases (`status: simulated_active`, simulated $10.00 claim `DEMO-WRONG-QTY`, and simulated $3.40 monthly invoice), confirmed by read-only server ledger audit. All temporary components were removed afterward.
- **Maintained simulation service:** The default upstream `https://scanner.backbond.ai/agent-connect/protection-simulation/v1/` runs as a dedicated service (`backbond-protection-simulation.service`) with a 24-hour per-installation TTL and bounded capacity.
- **Commercial boundary:** This plugin is free and collects no fee; the 2% monthly invoice is a synthetic fixture. Compatibility of section 3.1 of the Publisher Terms with any future paid service remains separate from this simulation release.

Links: https://x.ai/bot/marketplace/submit-a-plugin and https://cursor.com/marketplace-publisher-terms .
