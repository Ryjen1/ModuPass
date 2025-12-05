import { ethers } from "hardhat";

async function main() {
    console.log("Deploying ModuPassTargetBase contract...");

    // Get deployer
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);

    // Configuration
    const MASTER_KEY = process.env.KRNL_MASTER_KEY || deployer.address; // In production, this should be KRNL's master key
    const RECOVERY_KEY = process.env.RECOVERY_KEY || deployer.address;
    const DELEGATED_ACCOUNT_CODE_HASH = process.env.DELEGATED_ACCOUNT_CODE_HASH || ethers.ZeroHash; // Set to 0 for testing, real hash in production

    console.log("Configuration:");
    console.log("- Master Key:", MASTER_KEY);
    console.log("- Recovery Key:", RECOVERY_KEY);
    console.log("- Delegated Account Code Hash:", DELEGATED_ACCOUNT_CODE_HASH);

    // Deploy contract
    const ModuPassTargetBase = await ethers.getContractFactory("ModuPassTargetBase");
    const contract = await ModuPassTargetBase.deploy(
        MASTER_KEY,
        RECOVERY_KEY,
        DELEGATED_ACCOUNT_CODE_HASH
    );

    await contract.waitForDeployment();
    const contractAddress = await contract.getAddress();

    console.log("\n✅ ModuPassTargetBase deployed to:", contractAddress);
    console.log("\nNext steps:");
    console.log("1. Verify contract on Etherscan:");
    console.log(`   npx hardhat verify --network sepolia ${contractAddress} "${MASTER_KEY}" "${RECOVERY_KEY}" "${DELEGATED_ACCOUNT_CODE_HASH}"`);
    console.log("\n2. Update .env.local with:");
    console.log(`   NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}`);
    console.log("\n3. Create KRNL workflow in KRNL Studio");
    console.log("4. Update KRNL_WORKFLOW_ID in .env.local");

    // Save deployment info
    const deploymentInfo = {
        network: "sepolia",
        contractAddress,
        masterKey: MASTER_KEY,
        recoveryKey: RECOVERY_KEY,
        delegatedAccountCodeHash: DELEGATED_ACCOUNT_CODE_HASH,
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
    };

    console.log("\nDeployment Info:", JSON.stringify(deploymentInfo, null, 2));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
