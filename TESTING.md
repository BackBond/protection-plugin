# Testing and reviewer instructions

Simulation only. Do not supply personal data or connect real applications.

## Automated public tests

Run the README commands. The tests launch the actual bundled stdio gateway with the official MCP client and a loopback fake HTTP service. They check tool discovery, lazy enrollment, per-process isolation, concurrent-start deduplication, input rejection, endpoint restrictions, expiry, private-field filtering and failure behavior. The fake service contains transport fixtures, not BackBond scanners or business calculations.

## Private-engine acceptance

A separate, unpublished acceptance driver exercises this exact bundle against the existing private simulation engine on loopback. A deterministic test client performs the shop operations. The safe path must pass six cases and return the backend's simulated $10 claim and $3.40 monthly invoice; an unsafe path must be declined with empty claim and invoice results. The financial amounts are backend fixtures, not amounts calculated or chosen by the gateway. Private drivers, grading data, engine modules and ledgers are excluded from the public package.

This test is not a real Grok Bot, a fresh-account discovery test, independent merchant verification or evidence of live coverage.

## Grok Bot reviewer procedure

1. Review the source, dependency lock, build inputs, third-party notices and hashes. Build from source and compare `dist/SHA256SUMS`.
2. Use a disposable account or isolated host environment; preserve existing user connections and skills. Install this plugin through a supported host import or the approved marketplace flow. Node.js 20 or later is required.
3. Before starting, confirm exactly the five documented tools are exposed and that no account profile, card or real app connection is requested.
4. Send only `Protect me via BackBond` to a new Bot. Observe any native install/approval prompts without bypassing them. Once installed, the packaged workflow should call `begin_protection_demo` with `{}` and continue through the five-tool workflow.
5. Confirm all output is labelled simulated. Compare the returned result with private server evidence. A stopped or declined run must not claim activation, payout or a payable invoice.
6. Record the exact plugin commit and bundle hash, platform version, user inputs and native approvals. Remove only this temporary plugin afterward.

In-app verification for this exact package is pending. Prior demonstrations used different direct connectors; they do not satisfy this package's in-app checkbox. Before submitting the form, provide a maintained simulation endpoint or agree a review window within the current fixed expiry. Never assert one-line discovery or in-app success based on these programmatic tests.
