import { NextResponse } from 'next/server';
import { encodeAbiParameters, parseAbiItem, toFunctionSelector } from 'viem';
import { signAuthData } from '@/lib/krnl-crypto';
import { publicClient, CONTRACT_ADDRESS } from '@/lib/viem-client';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { eventId, code, attendee } = body;

        if (!eventId || !code || !attendee) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Mock Verification Logic
        // In production, this would verify Merkle Proof or Database
        const isValid = !code.includes('INVALID'); // Simple mock logic
        const timestamp = BigInt(Math.floor(Date.now() / 1000));

        // 2. Get Nonce for Attendee (The user submitting the tx)
        const nonceBig = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: [parseAbiItem('function nonces(address) view returns (uint256)')],
            functionName: 'nonces',
            args: [attendee as `0x${string}`]
        });

        // 3. Encode Result
        // struct AttendanceData { string eventId; address attendee; string code; uint256 timestamp; bool isValid; }
        const resultEncoded = encodeAbiParameters(
            [
                {
                    type: 'tuple', components: [
                        { type: 'string' },
                        { type: 'address' },
                        { type: 'string' },
                        { type: 'uint256' },
                        { type: 'bool' }
                    ]
                }
            ],
            [[eventId, attendee, code, timestamp, isValid]]
        );

        // 4. Get Function Selector for verifyAttendance
        // verifyAttendance(AuthData)
        // AuthData = (uint256,uint256,bytes32,bytes32[],bytes,bool,bytes)
        const selector = toFunctionSelector('verifyAttendance((uint256,uint256,bytes32,bytes32[],bytes,bool,bytes))');

        // 5. Sign
        const authData = await signAuthData(
            attendee,
            selector,
            resultEncoded,
            nonceBig
        );

        return NextResponse.json({ authData, isValid });

    } catch (error: any) {
        console.error("Mock KRNL Verify Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
