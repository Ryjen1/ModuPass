import { ethers } from "hardhat";

async function main() {
    const contractAddress = "0x5c26D51CDB5700c32B53e450f71D4914484a64F3";
    console.log(`Verifying contract at: ${contractAddress}`);

    const ModuPassTargetBase = await ethers.getContractFactory("ModuPassTargetBase");
    const contract = ModuPassTargetBase.attach(contractAddress) as any;

    try {
        const masterKey = await contract.masterKey();
        console.log(`Contract Master Key: ${masterKey}`);

        const EXPECTED_KEY = "0x1852EBfaBA9CA73bd19760542B5Ab7278F495d0E";

        if (masterKey.toLowerCase() === EXPECTED_KEY.toLowerCase()) {
            console.log("✅ VERIFIED: Master Key matches KRNL Node!");
        } else {
            console.error(`❌ MISMATCH: Expected ${EXPECTED_KEY}, got ${masterKey}`);
        }
    } catch (e) {
        console.error("Error reading masterKey:", e);
    }
}

main().catch(console.error);
