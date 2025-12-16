
import { createPublicClient, http, encodeFunctionData, parseAbi } from 'viem';
import { sepolia } from 'viem/chains';

const address = '0x9969827E2CB0582e08787B23F641b49Ca82bc774'; // Configured address

async function check() {
    const client = createPublicClient({
        chain: sepolia,
        transport: http()
    });

    console.log(`Checking metadata for ${address}...`);

    const abi = parseAbi([
        'function name() view returns (string)',
        'function symbol() view returns (string)'
    ]);

    try {
        const name = await client.readContract({ address, abi, functionName: 'name' });
        const symbol = await client.readContract({ address, abi, functionName: 'symbol' });

        console.log(`✅ Contract Identity Found:`);
        console.log(`   Name:   "${name}"`);
        console.log(`   Symbol: "${symbol}"`);

        if (symbol === 'WETH' || name.includes('Wrapped')) {
            console.log("❌ CRITICAL: This is WETH! This is NOT the KRNL Kernel contract.");
        }
    } catch (err) {
        console.log("⚠️ Could not read name/symbol. (Might not be an ERC-20, which is GOOD if it's a kernel)");
        console.log("Error:", err.message);
    }
}

check();
