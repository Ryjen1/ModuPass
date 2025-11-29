import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log("=".repeat(60));
  console.log("Wallet Information");
  console.log("=".repeat(60));
  console.log("Address:", deployer.address);
  console.log("Network:", network.name, `(Chain ID: ${network.chainId})`);
  console.log("Balance:", ethers.formatEther(balance), "ETH");
  console.log("");

  if (balance === 0n) {
    console.log("⚠️  WARNING: Wallet has no ETH!");
    console.log("Get testnet ETH from:");
    console.log("  - https://sepoliafaucet.com/");
    console.log("  - https://faucet.quicknode.com/ethereum/sepolia");
  } else if (balance < ethers.parseEther("0.05")) {
    console.log("⚠️  WARNING: Low balance!");
    console.log("Recommended: At least 0.1 ETH for deployment");
  } else {
    console.log("✓ Sufficient balance for deployment");
  }
  
  console.log("=".repeat(60));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});