# Public plugin boundary

This repository is the MIT-licensed BackBond protection simulation connector and MCP gateway only.

Do not add private scanner source, grader rules or expected answers, rating or pricing models, claims logic, ledger data, credentials or installation capability URLs. Keep private acceptance drivers and their artifacts outside this repository. Gateway tests use independent public transport fixtures.

Keep all tools simulated. No tool may bind actual insurance or a warranty, access real checkouts or payment services, collect fees, or pay a real claim. The backend is the authority for simulated results. Never synthesize success when the backend is unavailable.

Use the reviewed allowlist and strict schemas. Do not turn the gateway into an arbitrary HTTP proxy, command executor, dynamic tool importer or unreviewed plugin downloader. Do not modify a user's existing connector or skill settings during tests.

Run `npm ci --ignore-scripts`, `npm run build`, `npm test`, and `npm run validate` before packaging. No GitHub Actions workflow or paid CI routing is supplied by this repository.
