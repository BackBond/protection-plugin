# Testing and reviewer instructions

Simulation only. Do not supply personal data or connect real applications.

## Automated public tests

Run the README commands. The tests launch the actual bundled stdio gateway with the official MCP client and a loopback fake HTTP service. They check tool discovery, lazy enrollment, per-process isolation, concurrent-start deduplication, input rejection, endpoint restrictions, expiry, private-field filtering and failure behavior. The fake service contains transport fixtures, not BackBond scanners or business calculations.

## Private-engine acceptance

A separate, unpublished acceptance driver exercises this exact bundle against the existing private simulation engine on loopback. A deterministic test client performs the shop operations. The safe path must pass six cases and return the backend's simulated $10 claim; an unsafe path must be declined with an empty claim result. The gateway does not calculate that claim amount and does not return billing information. Private drivers, grading data, engine modules and ledgers are excluded from the public package.

This test is not a real Grok Bot, a fresh-account discovery test, independent merchant verification or evidence of live coverage.

## Grok Bot reviewer procedure

1. Review the source, dependency lock, build inputs, third-party notices and hashes. Build from source and compare `dist/SHA256SUMS` (`d6497aa4ae2707cd5985aaf32ef30286229cdcc4c8a54733ed4a352220e4c37b`).
2. Use a disposable account or isolated host environment; preserve existing user connections and skills. Install this plugin through the approved marketplace flow or, for pre-catalog review, register the stdio gateway (`node ./dist/gateway.mjs`) and save the unchanged `skills/protect-me-via-backbond/SKILL.md` through the Bot's supported shared private skill tool so the Bot runtime can load `protect-me-via-backbond` by name (saving only in the account Settings > Skills UI did not expose the skill to the Bot runtime during pre-catalog testing). Node.js 20 or later is required.
3. Before starting, confirm exactly the five documented tools are exposed and that no account profile, card or real app connection is requested.
4. Send only `Protect me via BackBond` to the Bot. Observe any native install/approval prompts without bypassing them. Once loaded, the packaged workflow calls `begin_protection_demo` with `{}` and continues through the five-tool workflow.
5. Confirm all output is labelled simulated. Compare the returned result with private server evidence. A stopped or declined run must not claim activation or payout.
6. Record the exact plugin commit and bundle hash, platform version, user inputs and native approvals. Remove only this temporary plugin afterward.

## Verified in-app installed-component record

On 16 November 2026, `v0.2.0` (bundle SHA-256 `424ecd86cfc4d30dc6940fbd65e550804387ef0c458b33e07be9c4d213172383`) was tested in an isolated Grok Bot account (`katzarik@yahoo.com`) using the procedure above:

- An initial attempt that saved the skill only in the account Settings > Skills UI was blocked before assessment because the Bot runtime could not load that skill (`0` server runs).
- After registering the unchanged `skills/protect-me-via-backbond/SKILL.md` via the Bot's shared private skill tool, the standalone trigger `Protect me via BackBond` completed `run_234dc2b2857639e3ae284507` (1 assessment start, 23 synthetic shop calls, 13 next-message calls and 12 replies).
- Independent read-only server ledger audit confirmed `status: simulated_active`, verdicts `6 pass / 0 needs_review / 0 fail`, and synthetic claim `DEMO-WRONG-QTY` (`simulated_paid`, $10.00), with `real_coverage_active: false` and `real_money_moved: false`.
- All temporary test components (skill, skill cache, local connector and test checkout) were removed afterward. Native marketplace catalog installation and cold one-line discovery remain unverified until xAI marketplace listing.
