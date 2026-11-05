import { ethers } from "ethers";

export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "";

export const ABI = [
  "function owner() view returns (address)",
  "function nextElectionId() view returns (uint256)",
  "function createElection(string title,uint64 startTime,uint64 endTime) returns (uint256)",
  "function addCandidate(uint256 electionId,string name,string manifestoCID) returns (uint256)",
  "function registerVoter(uint256 electionId,address voter)",
  "function vote(uint256 electionId,uint256 candidateId)",
  "function getElection(uint256 electionId) view returns (string title,uint64 startTime,uint64 endTime,bool started,bool ended)",
  "function getCandidates(uint256 electionId) view returns ((uint256 id,string name,string manifestoCID,uint256 voteCount,bool exists)[])",
  "function getCandidateCount(uint256 electionId) view returns (uint256)",
  "function isRegisteredVoter(uint256 electionId,address voter) view returns (bool)",
  "function hasVoted(uint256 electionId,address voter) view returns (bool)",
  "function endElection(uint256 electionId)",
  "event ElectionCreated(uint256 indexed electionId,string title,uint256 startTime,uint256 endTime)",
  "event CandidateAdded(uint256 indexed electionId,uint256 indexed candidateId,string name)",
  "event VoterRegistered(uint256 indexed electionId,address indexed voter)",
  "event VoteCast(uint256 indexed electionId,uint256 indexed candidateId,address indexed voter)",
  "event ElectionEnded(uint256 indexed electionId)"
];

export async function connectWallet() {
  if (!window.ethereum) throw new Error("MetaMask was not detected. Install or enable the MetaMask extension.");
  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  
  let network = await provider.getNetwork();
  if (network.chainId !== 31337n) {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x7a69" }],
      });
    } catch (switchError) {
      if (switchError.code === 4902 || switchError?.data?.originalError?.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0x7a69",
              chainName: "Hardhat Local",
              rpcUrls: ["http://127.0.0.1:8545"],
              nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
            },
          ],
        });
      } else {
        throw new Error("Please switch MetaMask to the local Hardhat network (Chain ID 31337).");
      }
    }
  }

  const updatedProvider = new ethers.BrowserProvider(window.ethereum);
  const signer = await updatedProvider.getSigner();
  const updatedNetwork = await updatedProvider.getNetwork();
  if (updatedNetwork.chainId !== 31337n) {
    throw new Error("Please switch MetaMask to the local Hardhat network (Chain ID 31337).");
  }
  if (!CONTRACT_ADDRESS || !ethers.isAddress(CONTRACT_ADDRESS)) {
    throw new Error("Set VITE_CONTRACT_ADDRESS in frontend/.env after deploying the contract.");
  }
  return { provider: updatedProvider, signer, account: await signer.getAddress(), contract: new ethers.Contract(CONTRACT_ADDRESS, ABI, signer) };
}
