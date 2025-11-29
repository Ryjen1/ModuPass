const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
    const ModuPassKRNL = await ethers.getContractFactory("ModuPassKRNL");
    const abi = ModuPassKRNL.interface.format('json');

    console.log("\n📋 ModuPassKRNL ABI:");
    console.log(abi);

    // Save to file
    fs.writeFileSync('ModuPassKRNL-ABI.json', abi);
    console.log("\n✅ ABI saved to ModuPassKRNL-ABI.json");
}

main().catch(console.error);
