# Portal submission draft

## Category

Developer -> Projects

## Contribution date

2026-10-26

## Title

Dependency Risk Console - Live SBOM + OSV Release Screening

## Description

Dependency Risk Console is a complete GenLayer application for public software
release admission. Publishers connect a wallet, register a CycloneDX SBOM and
an advisory-count policy, then run a real `screen` transaction. The contract
fetches the SBOM, queries OSV, and records a deterministic `CLEAR`,
`REVIEW_REQUIRED`, or `BLOCKED` decision. The web console handles the full
transaction lifecycle: wallet signing, submitted hash, finalization, execution
result checks, and a fresh on-chain read. Validators independently repeat both
external reads before consensus. The interface also provides public read-only
inspection, advisory evidence, coverage checks, Explorer links, responsive
layouts, and a live sample record. The repository includes the deployed
contract source, tests, documentation, and GitHub Pages deployment.

## Evidence

- Website: https://Fan-Yu0.github.io/genlayer-dependency-risk-console/
- Repository: https://github.com/Fan-Yu0/genlayer-dependency-risk-console
- Contract:
  https://explorer-studio.genlayer.com/address/0x7493ED2C2DD1bBc81Fd05Dfdb47864cD67F91A2f
- Live screening transaction:
  https://explorer-studio.genlayer.com/tx/0x9b9821bf3199912620bacfd3b5ba5ae3f2a23994777e77b45b30ec121626f778
