import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying ModuPassKRNL from:", deployer.address);

  const ModuPassKRNL = await ethers.getContractFactory("ModuPassKRNL");
  const contract = await ModuPassKRNL.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("ModuPassKRNL deployed to:", address);
  console.log("\nThis contract is KRNL Studio compatible!");
  console.log("Use this address in KRNL Studio to create your workflow.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});