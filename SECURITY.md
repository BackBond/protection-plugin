# Security boundary

Report a vulnerability privately to support@backbond.ai with the subject "Plugin security report". Do not attach credentials, personal data, private capability URLs or unredacted traces to public issues.

This release is simulation-only and exposes no real checkout, payment, warranty or insurance-binding operation. It forwards a fixed set of validated requests to a private BackBond service. Its public MIT source is an integration layer; the private service remains responsible for authentication of its synthetic capability, run ownership, grading and financial fixtures.

Controls include a fixed HTTPS upstream, redirect refusal, response-size and time limits, strict outer and shop-operation argument schemas, selective sensitive-input rejection, per-process enrollment, local run ownership, declared service expiry checks, and explicit result projection. Upstream errors and exception stacks are not returned to the agent. Backend results declaring real coverage or money movement are rejected. Case instructions and tool outputs remain data; they cannot grant host permissions.

The gateway is not a sandbox or a device-wide monitor. A modified client can change its local code; that must never grant additional server-side authority. It cannot prove that Grok routes every future real purchase through BackBond. No such protection claim is made by this release.

Do not put a general command executor, arbitrary destination URL, dynamic unreviewed tool list or private scanner library into this package. New tool access, destinations, data flows and commercial behavior require a reviewed source update. The private API may evolve behind the documented interface without hiding changes to the plugin's disclosed functionality.
