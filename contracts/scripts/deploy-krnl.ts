import { ethers } from "hardhat";

async function main() {
    console.log("🚀 Deploying ModuPassTargetBase (KRNL Integrated)...");

    const [deployer] = await ethers.getSigners();
    console.log("Deployer address:", deployer.address);

    // Load KRNL configuration from env
    const MASTER_KEY = process.env.KRNL_MASTER_KEY;
    const RECOVERY_KEY = process.env.KRNL_RECOVERY_KEY || deployer.address;
    const DELEGATED_ACCOUNT_CODE_HASH = process.env.KRNL_DELEGATED_ACCOUNT_CODE_HASH;

    if (!MASTER_KEY || !DELEGATED_ACCOUNT_CODE_HASH) {
        console.error("❌ Missing required KRNL environment variables:");
        if (!MASTER_KEY) console.error("   - KRNL_MASTER_KEY");
        if (!DELEGATED_ACCOUNT_CODE_HASH) console.error("   - KRNL_DELEGATED_ACCOUNT_CODE_HASH");
        process.exit(1);
    }

    console.log("Configuration:");
    console.log(`- Master Key: ${MASTER_KEY}`);
    console.log(`- Recovery Key: ${RECOVERY_KEY}`);
    console.log(`- Code Hash: ${DELEGATED_ACCOUNT_CODE_HASH}`);

    const ModuPassTargetBase = await ethers.getContractFactory("ModuPassTargetBase");
    const contract = await ModuPassTargetBase.deploy(
        MASTER_KEY,
        RECOVERY_KEY,
        DELEGATED_ACCOUNT_CODE_HASH
    );

    console.log("⏳ Waiting for deployment...");
    await contract.waitForDeployment();

    const address = await contract.getAddress();

    console.log("✅ ModuPassTargetBase deployed to:", address);
    console.log("\n📋 Next steps:");
    console.log("1. Verify contract on Etherscan:");
    console.log(`   npx hardhat verify --network sepolia ${address} ${MASTER_KEY} ${RECOVERY_KEY} ${DELEGATED_ACCOUNT_CODE_HASH}`);
    console.log("\n2. Use in KRNL Studio:");
    console.log(`   - Go to KRNL Studio`);
    console.log(`   - Setup workflow using this contract address`);
    console.log("\n✨ This contract is fully integrated with KRNL TargetBase!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
