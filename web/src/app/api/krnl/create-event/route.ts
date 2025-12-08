import { NextResponse } from 'next/server';
import { encodeAbiParameters, parseAbiItem, toFunctionSelector, keccak256, toBytes } from 'viem';
import { signAuthData } from '@/lib/krnl-crypto';
import { publicClient, CONTRACT_ADDRESS } from '@/lib/viem-client';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userAddress, eventId, eventName, maxAttendees } = body;

        if (!userAddress || !eventId || !eventName) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Get Nonce from Contract
        // Reading 'nonces(address)' from TargetBase
        const nonceBig = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: [parseAbiItem('function nonces(address) view returns (uint256)')],
            functionName: 'nonces',
            args: [userAddress as `0x${string}`]
        });

        // 2. Encode Result (The payload for ModuPass logic)
        // (string eventId, string eventName, bytes32 codesMerkleRoot, uint256 maxAttendees)
        const merkleRoot = keccak256(toBytes("MOCK_MERKLE_ROOT")); // Mock root for now

        const resultEncoded = encodeAbiParameters(
            [
                { type: 'string' },
                { type: 'string' },
                { type: 'bytes32' },
                { type: 'uint256' }
            ],
            [eventId, eventName, merkleRoot, BigInt(maxAttendees || 0)]
        );

        // 3. Get Function Selector for createEvent
        // createEvent(AuthData)
        // AuthData = (uint256,uint256,bytes32,bytes32[],bytes,bool,bytes)
        const selector = toFunctionSelector('createEvent((uint256,uint256,bytes32,bytes32[],bytes,bool,bytes))');

        // 4. Sign
        const authData = await signAuthData(
            userAddress,
            selector,
            resultEncoded,
            nonceBig
        );

        return NextResponse.json({ authData });

    } catch (error: any) {
        console.error("Mock KRNL Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
