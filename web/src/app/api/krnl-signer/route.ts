
import { NextResponse } from 'next/server';
import { ethers, AbiCoder } from 'ethers';

// This API route acts as the "KRNL Node" for our Self-Hosted Demo.
// It signs the event data using the Deployer's Private Key (which is the Master Key of the Self-Hosted Contract).

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { eventId, eventName, merkleRoot, maxAttendees } = body;

        if (!process.env.PRIVATE_KEY_SEPOLIA) {
            return NextResponse.json({ error: "Server misconfigured: Missing Private Key" }, { status: 500 });
        }

        // 1. Create Wallet from Private Key (The Master Key)
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY_SEPOLIA);

        // 2. Encode the Data (Same as KRNL Node / Contract ABI)
        const abiCoder = new AbiCoder();
        const resultBytes = abiCoder.encode(
            ["string", "string", "bytes32", "uint256"],
            [eventId, eventName, merkleRoot, maxAttendees]
        );

        // 3. Construct the Message Hash (KRNL Standard)
        // Keccak256(resultBytes)
        // Wait, TargetBase.sol does: 
        // address signer = messageHash.toEthSignedMessageHash().recover(authData.signature);
        // And messageHash is passed in? No, verifyAuthorization calculates it?
        // Let's look at TargetBase.sol::requireAuth modifier:
        // bytes32 messageHash = keccak256(authData.result);
        // _verifyAuthorization(messageHash, authData);

        // So we sign 'keccak256(resultBytes)' treated as an Ethereum Message.

        const messageHash = ethers.keccak256(resultBytes);
        // signMessage automatically applies "\x19Ethereum Signed Message:\n32" prefix
        const signature = await wallet.signMessage(ethers.getBytes(messageHash));

        // 4. Construct AuthData
        const authData = {
            nonce: BigInt(Date.now()), // Simple nonce
            expiry: BigInt(Math.floor(Date.now() / 1000) + 3600), // 1 hour
            id: ethers.id("self-hosted-krnl"),
            executions: [],
            result: resultBytes,
            sponsorExecutionFee: false,
            signature: signature
        };

        // Serialize BigInt for JSON
        const serializedAuthData = JSON.parse(JSON.stringify(authData, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return NextResponse.json({ success: true, authData: serializedAuthData });

    } catch (error: any) {
        console.error("Signing Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
