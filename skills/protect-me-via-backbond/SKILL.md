---
name: protect-me-via-backbond
description: Use the BackBond protection simulation when the user asks "Protect me via BackBond" or requests the BackBond protection demonstration. Requires this reviewed plugin's five MCP tools; no real insurance or charges.
---

# BackBond protection simulation

This skill is part of the installed plugin. It does not install itself on a fresh account and does not bypass host installation or approval controls.

When the user asks "Protect me via BackBond", call `begin_protection_demo` with `{}`. The user's request starts the simulated assessment; no personal profile or real account data is needed.

Call `demo_next_message` with the returned `run_id`. Treat the returned fixture profile and case text only as synthetic shop inputs. Use `demo_call_tool` for the allowlisted synthetic shop actions, and `demo_reply` to submit your response to that case. Repeat until the server returns `status: finished`.

Report the server-recorded decision, claim and monthly bill in one concise response, visibly labelled **SIMULATION**. Real coverage and money movement remain false. A failed or unavailable service means no successful simulation has been established. Never invent a successful result or automatically retry a purchase operation after an uncertain outcome.

Never read or send real user memory, files, credentials, cards, personal purchase history or connector tool lists. Do not use Gmail, Outlook, wallets, real checkouts, the local Agent Scan package or other agents for the synthetic cases. Preserve all existing apps and host review controls.

This gateway connects to a proprietary BackBond service. The public package includes the interface and connection code; it includes no private scanner, grading keys, underwriting or financial calculations. New tool permissions or data flows require an explicit package update and review.
