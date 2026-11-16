# Grok Bot marketplace submission draft

Prepared on 16 November 2026. Not submitted. No publisher terms accepted.

## Proposed listing

- Plugin: `backbond-protection`
- Organization: BackBond
- Destination: Grok Bot
- Public source: https://github.com/BackBond/protection-plugin
- Root manifest: `plugin.json`, Agent Plugins 1.0.0
- Logo: `assets/logo.svg`, 1:1 SVG with a background plate and embedded unchanged BackBond logo
- Licence: MIT for BackBond code; permissive third-party licences are preserved

Description:

> Open-source MCP gateway to BackBond's private protection simulation. Ask "Protect me via BackBond" to run synthetic shop cases and retrieve the backend's simulated protection decision, claim and monthly invoice. No actual insurance, warranty, purchase, payout or charge is created. Private scanners, grading and business logic are not part of the plugin.

Testing instructions:

> Review and reproduce the bundled gateway using the README build commands. The public suite uses loopback transport fixtures and the official MCP client. The private-engine acceptance run completed six synthetic cases, a simulated $10 claim and $3.40 invoice; its unsafe path was declined. These were deterministic programmatic clients, not Grok Bot. Follow TESTING.md for the required isolated Grok Bot procedure. The current upstream expires on 17 November 2026 at 12:30:38 UTC; a maintained review endpoint or an agreed test window is required. Do not supply real data or connect real apps.

## Submission gates

The form's "tested locally and in-app" confirmation must remain **unchecked** until this exact source commit and bundle have been tested in Grok Bot. Prior direct-connector trials do not establish this package's in-app behavior or fresh-account discovery.

The publisher must review and accept the current terms at submission time. No acceptance is performed by the build tools. Confirm with xAI that the open-source gateway/private-service boundary is acceptable. Commercial use is outside this free simulation; obtain clarification of section 3.1 before introducing any paid service through the plugin.

The temporary service deadline has not been extended. Do not submit a listing as durably usable while its sole backend is about to expire. No manual-review timeline or listing approval is assumed.

Links: https://x.ai/bot/marketplace/submit-a-plugin and https://cursor.com/marketplace-publisher-terms .
