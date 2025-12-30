import { ethers } from "hardhat";
import * as fs from "fs";

async function main() {
    console.log("🚀 Deploying ModuPassTargetBase (Self-Hosted KRNL Mode)...");

    const [deployer] = await ethers.getSigners();
    console.log("Deployer address (Acting as KRNL Node):", deployer.address);

    // Self-Hosted Mode: The Deployer IS the Master Key
    // This allows us to sign payloads locally without needing the external KRNL Node for the demo.
    const MASTER_KEY = deployer.address;
    const RECOVERY_KEY = deployer.address;
    const DELEGATED_ACCOUNT_CODE_HASH = "0x4dec9b9b6abd56c7cbcdf96b77c09ec75af5dacd505fa137acc16873f2a184d6";

    console.log("Configuration:");
    console.log("- Master Key:", MASTER_KEY);
    console.log("- Recovery Key:", RECOVERY_KEY);

    const ModuPassTargetBase = await ethers.getContractFactory("ModuPassTargetBase");
    const contract = await ModuPassTargetBase.deploy(
        MASTER_KEY,
        RECOVERY_KEY,
        DELEGATED_ACCOUNT_CODE_HASH
    );

    console.log("⏳ Waiting for deployment...");
    await contract.waitForDeployment();

    const address = await contract.getAddress();

    console.log("✅ ModuPassTargetBase (Self-Hosted) deployed to:", address);
    console.log("-> Update NEXT_PUBLIC_CONTRACT_ADDRESS in web/.env.local with this!");

    fs.writeFileSync('deployed_modupass_address_self_hosted.txt', address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
