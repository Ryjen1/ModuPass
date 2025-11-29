import { ethers } from "hardhat";

async function main() {
    console.log("🚀 Deploying ModuPassKRNLVerification contract...");

    const ModuPassKRNLVerification = await ethers.getContractFactory("ModuPassKRNLVerification");
    const contract = await ModuPassKRNLVerification.deploy();

    await contract.waitForDeployment();

    const address = await contract.getAddress();

    console.log("✅ ModuPassKRNLVerification deployed to:", address);
    console.log("\n📋 Next steps:");
    console.log("1. Verify contract on Etherscan:");
    console.log(`   npx hardhat verify --network sepolia ${address}`);
    console.log("\n2. Update frontend .env.local:");
    console.log(`   NEXT_PUBLIC_CONTRACT_ADDRESS=${address}`);
    console.log("\n3. This contract supports:");
    console.log("   - Event creation with Merkle root");
    console.log("   - KRNL AuthData verification");
    console.log("   - Max attendees limit");
    console.log("   - Verification code system");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
