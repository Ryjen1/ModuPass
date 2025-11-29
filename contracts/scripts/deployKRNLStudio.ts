import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("=".repeat(60));
  console.log("ModuPass KRNL Studio Compatible Deployment");
  console.log("=".repeat(60));
  console.log("Deploying from:", deployer.address);
  console.log("Network:", (await ethers.provider.getNetwork()).name);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH");
  console.log("");

  // Configuration
  const isSoulbound = process.env.SOULBOUND === "true" || false;
  const baseTokenURI = process.env.BASE_TOKEN_URI || "https://api.modupass.xyz/metadata";
  
  console.log("Configuration:");
  console.log("  Soulbound:", isSoulbound);
  console.log("  Base Token URI:", baseTokenURI);
  console.log("");

  // Deploy ModuPassKRNLStudio
  console.log("Deploying ModuPassKRNLStudio...");
  const ModuPassFactory = await ethers.getContractFactory("ModuPassKRNLStudio");
  const moduPassContract = await ModuPassFactory.deploy(isSoulbound, baseTokenURI);
  await moduPassContract.waitForDeployment();
  const moduPassAddress = await moduPassContract.getAddress();
  console.log("✓ ModuPassKRNLStudio deployed to:", moduPassAddress);
  
  // Get PassToken address
  const passTokenAddress = await moduPassContract.passToken();
  console.log("✓ PassToken deployed to:", passTokenAddress);
  console.log("");

  // Summary
  console.log("=".repeat(60));
  console.log("Deployment Summary");
  console.log("=".repeat(60));
  console.log("ModuPassKRNLStudio:", moduPassAddress);
  console.log("PassToken:", passTokenAddress);
  console.log("");
  console.log("Next steps:");
  console.log("1. Verify contract on Etherscan:");
  console.log(`   npx hardhat verify --network sepolia ${moduPassAddress} ${isSoulbound} "${baseTokenURI}"`);
  console.log(`   npx hardhat verify --network sepolia ${passTokenAddress} ${isSoulbound}`);
  console.log("");
  console.log("2. Use this address in KRNL Studio:", moduPassAddress);
  console.log("   Network: Ethereum Sepolia");
  console.log("   Function: issuePass");
  console.log("=".repeat(60));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});