import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  const configuredExecutor = process.env.MODUPASS_EXECUTOR_ADDRESS;
  const krnlExecutor = configuredExecutor && configuredExecutor !== ""
    ? configuredExecutor
    : deployer.address;

  console.log("Deploying ModuPass with executor:", krnlExecutor);

  const ModuPass = await ethers.getContractFactory("ModuPass");
  const contract = await ModuPass.deploy(krnlExecutor);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("ModuPass deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
