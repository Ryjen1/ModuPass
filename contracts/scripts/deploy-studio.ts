import { ethers } from "hardhat";

async function main() {
    console.log("🚀 Deploying ModuPassKRNLStudio contract...");

    const ModuPassKRNLStudio = await ethers.getContractFactory("ModuPassKRNLStudio");
    const contract = await ModuPassKRNLStudio.deploy();

    await contract.waitForDeployment();

    const address = await contract.getAddress();

    console.log("✅ ModuPassKRNLStudio deployed to:", address);
    console.log("\n📋 Next steps:");
    console.log("1. Verify contract on Etherscan:");
    console.log(`   npx hardhat verify --network sepolia ${address}`);
    console.log("\n2. Use in KRNL Studio:");
    console.log(`   - Go to studio.krnl.xyz`);
    console.log(`   - Paste address: ${address}`);
    console.log(`   - Select function: createEventWithAuth or verifyAttendanceWithAuth`);
    console.log("\n3. The contract will work with KRNL Studio workflows!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
