
import { NextResponse } from 'next/server';
import { ethers, AbiCoder } from 'ethers';

// This API route acts as the "KRNL Node" for our Self-Hosted Demo.
// It signs the event data using the Deployer's Private Key (which is the Master Key of the Self-Hosted Contract).

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { eventId, eventName, merkleRoot, maxAttendees, userAddress } = body;

        // Validation
        if (!process.env.PRIVATE_KEY_SEPOLIA) {
            return NextResponse.json({ error: "Server misconfigured: Missing Private Key" }, { status: 500 });
        }
        if (!userAddress) {
            return NextResponse.json({ error: "Missing userAddress. Required for nonce lookup and signing." }, { status: 400 });
        }

        // 1. Create Wallet from Private Key (The Master Key)
        // Self-Hosted Contract Address
        const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0xE1aa6DE3F0c0c3cc5174B4CA9CC57751254e1265";
        const RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY_SEPOLIA, provider);

        // 2. Fetch User's Nonce from Contract
        // TargetBase has a getNonce(address) function
        const abi = ["function nonces(address) external view returns (uint256)"];
        const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);

        let nonce = BigInt(0);
        try {
            // Using getNonce from TargetBase.sol
            nonce = await contract.nonces(userAddress);
            console.log(`Fetched nonce for ${userAddress}: ${nonce}`);
        } catch (e: any) {
            console.warn("Failed to fetch nonce, using 0", e.message);
            // If function doesn't exist or network error, we risk InvalidNonce, but we try 0.
        }

        // 3. Encode the Param Data (same as before)
        const abiCoder = new AbiCoder();
        const resultBytes = abiCoder.encode(
            ["string", "string", "bytes32", "uint256"],
            [eventId, eventName, merkleRoot, maxAttendees]
        );

        // 4. Construct the Message Hash CORRECTLY matching TargetBase.sol
        // _verifyAuthorization checks: keccak256(abi.encodePacked(msg.sender, nonce, expiry, result, msg.sig))

        // Calculate Function Selector for createEvent(AuthData)
        // AuthData = (uint256,uint256,bytes32,(bytes32,bytes,bytes)[],bytes,bool,bytes)
        const functionSignature = "createEvent((uint256,uint256,bytes32,(bytes32,bytes,bytes)[],bytes,bool,bytes))";
        const functionSelector = ethers.id(functionSignature).slice(0, 10); // Take first 4 bytes (0x + 8 chars)

        const expiry = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour

        // Pack the data: sender(address), nonce(uint256), expiry(uint256), result(bytes), selector(bytes4)
        const packedData = ethers.solidityPacked(
            ["address", "uint256", "uint256", "bytes", "bytes4"],
            [userAddress, nonce, expiry, resultBytes, functionSelector]
        );

        const authHash = ethers.keccak256(packedData);

        // Sign the authHash (Wallet.signMessage adds the Ethereum Signed Message prefix, matching contract's ECDSA.recover)
        const signature = await wallet.signMessage(ethers.getBytes(authHash));

        // 5. Construct AuthData
        const authData = {
            nonce: nonce.toString(), // Convert BigInt to string
            expiry: expiry.toString(), // Convert BigInt to string
            id: ethers.id("self-hosted-krnl"),
            executions: [],
            result: resultBytes, // Already a hex string
            sponsorExecutionFee: false,
            signature: signature
        };

        return NextResponse.json({ success: true, authData });

    } catch (error: any) {
        console.error("Signing Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
