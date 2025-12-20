import { ethers } from "hardhat";

async function main() {
    console.log("🚀 Deploying ModuPassDemo (Permissive Mode)...");

    const [deployer] = await ethers.getSigners();
    console.log("Deployer address:", deployer.address);

    const ModuPassDemo = await ethers.getContractFactory("ModuPassDemo");
    const contract = await ModuPassDemo.deploy();

    console.log("⏳ Waiting for deployment...");
    await contract.waitForDeployment();

    const address = await contract.getAddress();

    console.log("✅ ModuPassDemo deployed to:", address);
    console.log("\n📋 Next steps:");
    console.log("1. Update your frontend .env.local with:");
    console.log(`   NEXT_PUBLIC_CONTRACT_ADDRESS=${address}`);
    console.log("2. Ensure your frontend sends 'Mock' proofs.");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
