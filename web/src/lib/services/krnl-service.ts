/**
 * KRNL SDK Integration Service
 * Handles AuthData generation via KRNL Node
 * 
 * PRODUCTION READY: To switch to real KRNL:
 * 1. Replace KRNL_NODE_URL with actual KRNL endpoint
 * 2. Add KRNL Workflow ID from KRNL Studio
 * 3. Optionally: Use @krnl/react-sdk instead of fetch
 */

const KRNL_NODE_URL = process.env.NEXT_PUBLIC_KRNL_NODE_URL || '/api/krnl/verify';
const WORKFLOW_ID = process.env.NEXT_PUBLIC_KRNL_WORKFLOW_ID || 'modupass-attendance-verification';

export interface KRNLAuthData {
    nonce: number;
    expiry: number;
    id: string;
    executions: string[];
    result: string;
    sponsorExecutionFee: boolean;
    signature: string;
}

export interface AttendanceProofData {
    eventId: string;
    attendee: string;
    code: string;
    timestamp: number;
}

/**
 * Generate AuthData for attendance verification using KRNL Node
 * This calls the KRNL workflow to verify the Merkle proof off-chain
 */
export async function generateAttendanceAuthData(
    eventId: string,
    attendeeAddress: string,
    verificationCode: string
): Promise<{
    authData: KRNLAuthData;
    proofData: AttendanceProofData;
}> {
    const timestamp = Math.floor(Date.now() / 1000);

    const proofData: AttendanceProofData = {
        eventId,
        attendee: attendeeAddress,
        code: verificationCode,
        timestamp
    };

    // Get Merkle proof from database
    const { proof, root } = await getMerkleProofForCode(eventId, verificationCode);

    // Call KRNL Node to execute verification workflow
    const response = await fetch(KRNL_NODE_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            workflowId: WORKFLOW_ID,
            inputs: {
                code: verificationCode,
                proof,
                root
            }
        })
    });

    if (!response.ok) {
        throw new Error(`KRNL Node error: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.statusCode !== 'SUCCESS') {
        throw new Error(result.error || 'Verification failed');
    }

    return { authData: result.authData, proofData };
}

/**
 * Get Merkle proof for a verification code from database
 */
async function getMerkleProofForCode(
    eventId: string,
    code: string
): Promise<{ proof: string[]; root: string }> {
    const { supabase } = await import('@/lib/supabase');

    // Get the code record with its Merkle proof
    const { data: codeData, error: codeError } = await supabase
        .from('verification_codes')
        .select('merkle_proof')
        .eq('event_id', eventId)
        .eq('code', code)
        .single();

    if (codeError || !codeData) {
        throw new Error('Code not found');
    }

    // Get the event's Merkle root
    const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('codes_merkle_root')
        .eq('id', eventId)
        .single();

    if (eventError || !eventData) {
        throw new Error('Event not found');
    }

    return {
        proof: codeData.merkle_proof,
        root: eventData.codes_merkle_root
    };
}

/**
 * Validate AuthData structure
 */
export function validateAuthData(authData: KRNLAuthData): boolean {
    const now = Math.floor(Date.now() / 1000);

    // Check expiry
    if (authData.expiry < now) {
        return false;
    }

    // Check required fields
    if (!authData.id || !authData.signature || !authData.result) {
        return false;
    }

    return true;
}
