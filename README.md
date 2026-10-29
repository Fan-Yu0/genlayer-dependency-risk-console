# Dependency Risk Console

A complete GenLayer application for public software release screening.
Publishers register a CycloneDX SBOM and an advisory policy. Anyone can run a
live OSV screening transaction, then inspect the finalized admission decision.

- Web application:
  <https://Fan-Yu0.github.io/genlayer-dependency-risk-console/>
- Source repository:
  <https://github.com/Fan-Yu0/genlayer-dependency-risk-console>
- Contract source:
  <https://github.com/Fan-Yu0/genlayer-dependency-risk-gate>
- Deployed contract:
  <https://explorer-studio.genlayer.com/address/0x7493ED2C2DD1bBc81Fd05Dfdb47864cD67F91A2f>

## Product flow

1. Connect an EIP-1193 wallet on GenLayer StudioNet.
2. Register a release ID, artifact identity, HTTPS CycloneDX SBOM URL, and
   advisory limit.
3. Submit `screen(release_id)` as a real GenLayer transaction.
4. Follow the transaction from wallet signature through finalization.
5. Read the accepted contract state and display the deterministic decision.

Reads work without a wallet. Writes require a wallet because the application
submits real GenLayer transactions.

## Contract methods

| Method | Type | Purpose |
| --- | --- | --- |
| `register_release` | write | Create a release screening policy |
| `screen` | write | Fetch SBOM and OSV evidence through GenLayer consensus |
| `withdraw` | write | Publisher-only withdrawal |
| `get_screening` | view | Return the latest screening record |
| `is_clear` | view | Boolean admission signal for other contracts |
| `policy_bits` | view | Expose fixed policy limits and endpoints |

The contract fetches the SBOM and sends one JSON-encoded OSV `querybatch`
request. Validators independently repeat both reads and compare the
decision-bearing evidence before deterministic policy code returns `CLEAR`,
`REVIEW_REQUIRED`, or `BLOCKED`.

## Application behavior

- The sample release loads automatically from the deployed contract.
- Registration and screening display the transaction hash while waiting for
  finalization.
- Contract execution errors, timeouts, and nondeterministic disagreement are
  surfaced explicitly.
- Successful writes trigger a fresh `get_screening` read.
- The interface includes responsive desktop and mobile layouts.

## Local development

```shell
npm install
copy .env.example .env
npm run dev
```

Environment variables:

```text
VITE_CONTRACT_ADDRESS=0x7493ED2C2DD1bBc81Fd05Dfdb47864cD67F91A2f
VITE_GENLAYER_RPC_URL=https://studio.genlayer.com/api
```

## Verification

```shell
npm run lint
npm test
npm run build
```

The test suite covers form validation, SBOM URL rules, advisory limits, and
normalization of the live contract response shape.

## Deployment

`npm run deploy` builds the Vite app and publishes `dist/` to the `gh-pages`
branch. No server-side secret is required because contract reads use the public
Studio RPC endpoint and writes are signed by the visitor's wallet.

## Limitations

This console is an admission aid, not a complete software-composition analysis
or exploitability assessment. It depends on the availability and freshness of
the public OSV API and the published SBOM.

## Wallet support

- Connecting a wallet only requests account access, so any EIP-1193 wallet can
  connect and every read-only flow works without a wallet.
- Submitting a write (`register_release` / `screen`) is signed by the visitor's
  wallet after the app adds and switches it to GenLayer StudioNet. StudioNet is
  gasless (`eth_gasPrice` is 0), so no test tokens are required.
- No MetaMask Snaps plugin is required. The console submits standard
  `eth_sendTransaction` calls, so MetaMask, Rabby, and other EIP-1193 wallets
  work as long as they can add the StudioNet chain.

