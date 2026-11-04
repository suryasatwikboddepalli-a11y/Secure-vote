# SecureVote — Decentralized Voting DApp

An academic demonstration built with Solidity, Hardhat, React, MetaMask and ethers.js. Optional IPFS support stores public candidate manifestos.

> **Security note:** This project is not suitable for real-world elections. Votes and wallet addresses are publicly observable on-chain. A wallet address is not a verified real-world identity, and this design does not provide secret ballots or coercion resistance.

## Prerequisites

- Node.js 18 or 20 LTS
- npm
- MetaMask browser extension
- A terminal

## 1. Install and compile the contract

From the project root:

```bash
npm install
npm run compile
npm test
```

## 2. Start a local blockchain

Open terminal A at the project root:

```bash
npm run node
```

Keep this terminal running. Hardhat prints local test accounts and private keys. These keys are for the disposable local development chain only. **Never use these keys or seed phrases on mainnet or with real funds.**

## 3. Deploy the contract

Open terminal B at the project root:

```bash
npm run deploy:local
```

Copy the printed `SecureVoting` contract address.

## 4. Configure MetaMask

In MetaMask, add/select a local network with:

- Network name: Hardhat Local
- RPC URL: `http://127.0.0.1:8545`
- Chain ID: `31337`
- Currency symbol: `ETH`

For local testing only, import one of the development accounts printed by `npm run node`. Treat those private keys as public and disposable.

## 5. Configure and run the frontend

```bash
cd frontend
npm install
```

Copy `.env.example` to `.env`, then set:

```env
VITE_CONTRACT_ADDRESS=0xPASTE_DEPLOYED_CONTRACT_ADDRESS
```

Start the frontend:

```bash
npm run dev
```

Open the URL printed by Vite (normally `http://localhost:5173`). Connect MetaMask while it is set to chain ID `31337`.

**Important:** The local chain resets when its node process stops. If it resets, restart the node, redeploy the contract, and update the frontend contract address.

## How to demo

1. Connect the deployer/owner wallet.
2. Create an election with a start time a few minutes in the future and an end time later than the start.
3. Add at least two candidates.
4. Register one or more voter wallet addresses before the election begins.
5. Switch MetaMask to a registered voter account and connect.
6. After the start time, cast one vote.
7. Verify the vote count changes and that the same address cannot vote again.
8. Test an unregistered wallet and the deadline restriction.

The frontend currently checks the wall-clock time for button state; the smart contract is the authoritative source and uses block timestamps for enforcement. Refresh the page if the status label does not update exactly at the boundary.

## Optional IPFS

Upload a public candidate manifesto to an IPFS pinning service and paste its CID into the candidate form. This demo links to `https://ipfs.io/ipfs/<CID>`. Do not upload voter lists, personal information, private documents, or anything that should not be public.

## Syllabus mapping

- **Module 1:** Ethereum accounts, transactions, EVM, gas, wallet addresses, and cryptographic signing.
- **Module 2:** Solidity file/contract structure, structs, variables, operators, statements, ABI, and encoding through ethers.js.
- **Module 3:** Access-control design, custom errors, input validation, events, and basic gas-conscious storage usage.
- **Module 4:** DApp architecture, frontend integration, contract compilation/deployment, and optional IPFS.
- **Module 5:** Data permanence, transparency, privacy limitations, access controls, and security countermeasures.

## Current limitations / future improvements

- Votes are public; no secret-ballot cryptography is implemented.
- Voter eligibility is administered by one owner and is not linked to real-world identity.
- No production audit, formal verification, rate limiting, or decentralized identity verification is included.
- Candidate vote counting uses a small array scan for a teaching-friendly design. For large elections, redesign and benchmark this carefully.
- IPFS manifests are optional and public.
- The `endElection` function emits an event after the deadline; voting is closed by timestamp checks whether or not the function is called.
