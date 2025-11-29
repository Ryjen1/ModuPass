import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying ModuPassVerification contract...");

  const ModuPassVerification = await ethers.getContractFactory("ModuPassVerification");
  const contract = await ModuPassVerification.deploy();

  await contract.waitForDeployment();

  const address = await contract.getAddress();

  console.log("✅ ModuPassVerification deployed to:", address);
  console.log("\n📋 Next steps:");
  console.log("1. Verify contract on Etherscan:");
  console.log(`   npx hardhat verify --network sepolia ${address}`);
  console.log("\n2. Copy this address to your .env files:");
  console.log(`   CONTRACT_ADDRESS=${address}`);
  console.log("\n3. Use this address in KRNL Studio workflow setup");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
