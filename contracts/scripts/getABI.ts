import { ethers } from "hardhat";
import * as fs from "fs";

async function main() {
  const ModuPassFactory = await ethers.getContractFactory("ModuPassKRNLProduction");
  const abi = ModuPassFactory.interface.formatJson();
  
  console.log("ModuPassKRNLProduction ABI:");
  console.log(abi);
  
  // Save to file
  fs.writeFileSync("ModuPassKRNLProduction_ABI.json", abi);
  console.log("\nABI saved to ModuPassKRNLProduction_ABI.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});