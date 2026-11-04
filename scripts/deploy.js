const hre = require("hardhat");

async function main() {
  const Voting = await hre.ethers.getContractFactory("SecureVoting");
  const voting = await Voting.deploy();
  await voting.waitForDeployment();
  const address = await voting.getAddress();
  console.log("SecureVoting deployed to:", address);
  console.log("Owner:", await voting.owner());
  console.log("\nCopy the contract address into frontend/.env as VITE_CONTRACT_ADDRESS.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
