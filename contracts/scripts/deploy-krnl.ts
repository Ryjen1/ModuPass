import { ethers } from "hardhat";

async function main() {
    console.log("🚀 Deploying ModuPassKRNL contract (KRNL Studio Compatible)...");

    const ModuPassKRNL = await ethers.getContractFactory("ModuPassKRNL");
    const contract = await ModuPassKRNL.deploy();

    await contract.waitForDeployment();

    const address = await contract.getAddress();

    console.log("✅ ModuPassKRNL deployed to:", address);
    console.log("\n📋 Next steps:");
    console.log("1. Verify contract on Etherscan:");
    console.log(`   npx hardhat verify --network sepolia ${address}`);
    console.log("\n2. Use in KRNL Studio:");
    console.log(`   - Go to studio.krnl.xyz`);
    console.log(`   - Paste address: ${address}`);
    console.log(`   - KRNL Studio will now recognize the authData functions!`);
    console.log("\n3. Functions available:");
    console.log(`   - createEvent(authData, string, string)`);
    console.log(`   - verifyAttendance(authData, string, address, bytes)`);
    console.log("\n✨ This contract uses KRNL's proper AuthData structure!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
