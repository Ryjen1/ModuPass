import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("=".repeat(60));
  console.log("ModuPass Production Deployment");
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

  // Deploy ModuPassEvents
  console.log("1/2 Deploying ModuPassEvents...");
  const EventsFactory = await ethers.getContractFactory("ModuPassEvents");
  const eventsContract = await EventsFactory.deploy();
  await eventsContract.waitForDeployment();
  const eventsAddress = await eventsContract.getAddress();
  console.log("✓ ModuPassEvents deployed to:", eventsAddress);
  console.log("");

  // Deploy ModuPassKRNLProduction
  console.log("2/2 Deploying ModuPassKRNLProduction...");
  const ModuPassFactory = await ethers.getContractFactory("ModuPassKRNLProduction");
  const moduPassContract = await ModuPassFactory.deploy(isSoulbound, baseTokenURI);
  await moduPassContract.waitForDeployment();
  const moduPassAddress = await moduPassContract.getAddress();
  console.log("✓ ModuPassKRNLProduction deployed to:", moduPassAddress);
  
  // Get PassToken address
  const passTokenAddress = await moduPassContract.passToken();
  console.log("✓ PassToken deployed to:", passTokenAddress);
  console.log("");

  // Summary
  console.log("=".repeat(60));
  console.log("Deployment Summary");
  console.log("=".repeat(60));
  console.log("ModuPassEvents:", eventsAddress);
  console.log("ModuPassKRNLProduction:", moduPassAddress);
  console.log("PassToken:", passTokenAddress);
  console.log("");
  console.log("Next steps:");
  console.log("1. Verify contracts on Etherscan:");
  console.log(`   npx hardhat verify --network sepolia ${eventsAddress}`);
  console.log(`   npx hardhat verify --network sepolia ${moduPassAddress} ${isSoulbound} "${baseTokenURI}"`);
  console.log(`   npx hardhat verify --network sepolia ${passTokenAddress} ${isSoulbound}`);
  console.log("");
  console.log("2. Update .env.local in web/ with:");
  console.log(`   MODUPASS_EVENTS_CONTRACT_ADDRESS=${eventsAddress}`);
  console.log(`   MODUPASS_CONTRACT_ADDRESS=${moduPassAddress}`);
  console.log(`   PASS_TOKEN_CONTRACT_ADDRESS=${passTokenAddress}`);
  console.log("");
  console.log("3. Create KRNL Studio workflow using contract:", moduPassAddress);
  console.log("=".repeat(60));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});