# Simulation data handling

The gateway sends an empty object for synthetic enrollment. It then sends a randomly generated simulation label, run and case references, synthetic shop operations and synthetic case replies to BackBond's private HTTPS service. It does not ask for real account identity, real purchase instructions, memory, files, cards, credentials or other connectors' tool inventories.

The private service receives the network request metadata needed to serve the API, including the caller's IP address. The gateway adds no analytics, telemetry service or third-party API destination. It holds the returned capability URL only in process memory and keeps no local event log or credential file. BackBond's maintained private simulation service keeps synthetic test events in its isolated encrypted demo ledger; this public repository includes no ledger or customer records.

Each installation capability expires after 24 hours. Expiry revokes access; it does not delete server records. Synthetic records remain in a capacity-bounded, encrypted ledger until operator removal or generation rotation. No automated deletion deadline is promised. Data is not accepted for model training. A production retention policy and commercial privacy terms are outside this simulation release.

Use synthetic text only. Pattern-based rejection does not identify all personal data. Do not place secrets in tool arguments, configuration files committed to a repository or screenshots. The test-only upstream override accepts explicitly enabled loopback HTTP; arbitrary remote hosts are rejected.

Contact: support@backbond.ai.
