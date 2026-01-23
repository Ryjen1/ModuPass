import { ethers } from "hardhat";

async function main() {
    const delegatedAccountAddress = "0x9969827E2CB0582e08787B23F641b49Ca82bc774";

    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const code = await provider.getCode(delegatedAccountAddress);
    const codeHash = ethers.keccak256(code);

    console.log("Delegated Account Address:", delegatedAccountAddress);
    console.log("Code Hash (bytes32):", codeHash);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
