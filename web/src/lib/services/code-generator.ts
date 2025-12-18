import { MerkleTree } from 'merkletreejs';
import { keccak256, toUtf8Bytes } from 'ethers';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate unique verification codes for an event
 * Creates Merkle tree for on-chain verification
 */
export async function generateVerificationCodes(
    eventId: string,
    count: number
): Promise<{
    codes: string[];
    merkleRoot: string;
    tree: MerkleTree;
    leaves: string[];
}> {
    // Generate unique codes
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
        const uniqueCode = `${eventId}-${uuidv4().slice(0, 8).toUpperCase()}`;
        codes.push(uniqueCode);
    }

    // Create Merkle tree
    const leaves = codes.map(code => keccak256(toUtf8Bytes(code)));
    const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    const root = tree.getHexRoot();

    return { codes, merkleRoot: root, tree, leaves };
}

// Supabase storage removed as per user request. 
// Organizer is responsible for downloading and keeping the codes safe.

/**
 * Verify a code is valid for an event
 * (Simplified for Bypass/No-DB mode)
 */
export async function verifyCode(
    eventId: string,
    code: string
): Promise<{
    valid: boolean;
    used: boolean;
    merkleProof?: string[];
}> {
    // In No-DB mode, we cannot look up validity server-side.
    // We assume the frontend/scanner has the list or we rely on the smart contract transaction content.
    // For now, return 'valid' to allow the on-chain transaction to proceed (where actual logic resides).
    return {
        valid: true,
        used: false // We can't track 'used' state without a DB or querying the chain logs deep history.
    };
}

/**
 * Mark a code as used
 */
export async function markCodeAsUsed(
    eventId: string,
    code: string,
    usedBy: string
): Promise<void> {
    // No-op without DB
    console.log(`[Bypass] Code marked used locally: ${code} for ${eventId}`);
}

/**
 * Get all codes for an event (organizer only)
 */
export async function getEventCodes(eventId: string): Promise<string[]> {
    return []; // Cannot retrieve without DB
}

/**
 * Get verification statistics for an event
 */
export async function getVerificationStats(eventId: string): Promise<{
    total: number;
    used: number;
    unused: number;
}> {
    return { total: 0, used: 0, unused: 0 }; // Cannot calculate without DB
}


