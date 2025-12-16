
import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';

const address = '0x9969827E2CB0582e08787B23F641b49Ca82bc774'; // From user's .env

async function check() {
    const client = createPublicClient({
        chain: sepolia,
        transport: http()
    });

    console.log(`Checking address ${address} on Sepolia...`);

    try {
        const code = await client.getBytecode({ address });

        if (!code || code === '0x') {
            console.log("❌ RESULT: No code found at this address!");
            console.log("   -> This means the address is likely an EOA (User Wallet) or Undeployed contract.");
            console.log("   -> KRNL REQUIREMENT: This MUST be the deployed KRNL Kernel contract.");
        } else {
            console.log("✅ RESULT: Code found!");
            console.log(`   -> Bytecode length: ${code.length}`);
            console.log("   -> This verifies it IS a contract.");
        }
    } catch (err) {
        console.error("Error checking contract:", err);
    }
}

check();
