/**
 * KRNL Workflow Client for ModuPass
 * Handles execution of KRNL workflows for attendance verification
 */

export interface KRNLWorkflowInput {
    eventId: string;
    attendeeAddress: string;
    proofData?: Record<string, unknown>;
}

export interface KRNLWorkflowResult {
    success: boolean;
    transactionHash?: string;
    proofHash?: string;
    error?: string;
    metadata?: Record<string, unknown>;
}

export interface AttendanceProofData {
    eventId: string;
    attendee: string;
    timestamp: number;
    verified: boolean;
}

/**
 * Generate proof data for attendance verification
 */
export function generateAttendanceProof(
    eventId: string,
    attendeeAddress: string
): AttendanceProofData {
    return {
        eventId,
        attendee: attendeeAddress.toLowerCase(),
        timestamp: Date.now(),
        verified: true,
    };
}

/**
 * Convert proof data to bytes for contract submission
 */
export function proofToBytes(proof: AttendanceProofData): string {
    const proofString = JSON.stringify(proof);
    // Convert to hex bytes
    const bytes = Buffer.from(proofString, 'utf8').toString('hex');
    return '0x' + bytes;
}

/**
 * Execute KRNL workflow for attendance verification
 * 
 * Note: In production, this would call the actual KRNL network.
 * For MVP, we'll simulate the workflow execution.
 */
export async function executeAttendanceWorkflow(
    input: KRNLWorkflowInput
): Promise<KRNLWorkflowResult> {
    try {
        // Validate input
        if (!input.eventId || !input.attendeeAddress) {
            throw new Error('Missing required fields: eventId and attendeeAddress');
        }

        // Validate Ethereum address format
        if (!/^0x[a-fA-F0-9]{40}$/.test(input.attendeeAddress)) {
            throw new Error('Invalid Ethereum address format');
        }

        // Generate proof data
        const proofData = generateAttendanceProof(
            input.eventId,
            input.attendeeAddress
        );

        // Convert proof to bytes
        const proofBytes = proofToBytes(proofData);

        // In production, this would:
        // 1. Submit to KRNL network
        // 2. Execute workflow steps
        // 3. Generate cryptographic proof
        // 4. Submit transaction to blockchain

        // For MVP, we return the data needed for frontend to submit
        return {
            success: true,
            proofHash: generateProofHash(proofData),
            metadata: {
                proofData,
                proofBytes,
                workflowId: 'modupass-attendance-verification',
                executedAt: new Date().toISOString(),
            },
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Generate a hash of the proof data
 */
function generateProofHash(proof: AttendanceProofData): string {
    const crypto = require('crypto');
    const hash = crypto
        .createHash('sha256')
        .update(JSON.stringify(proof))
        .digest('hex');
    return '0x' + hash;
}

/**
 * Validate event data before workflow execution
 */
export function validateEventData(eventId: string): {
    valid: boolean;
    error?: string;
} {
    if (!eventId || typeof eventId !== 'string') {
        return { valid: false, error: 'Event ID is required' };
    }

    if (eventId.trim().length === 0) {
        return { valid: false, error: 'Event ID cannot be empty' };
    }

    if (eventId.length > 100) {
        return { valid: false, error: 'Event ID too long (max 100 characters)' };
    }

    // Check for valid characters (alphanumeric, hyphens, underscores)
    if (!/^[a-zA-Z0-9-_]+$/.test(eventId)) {
        return {
            valid: false,
            error: 'Event ID can only contain letters, numbers, hyphens, and underscores',
        };
    }

    return { valid: true };
}

/**
 * Create event data for contract submission
 */
export interface CreateEventData {
    eventId: string;
    eventName: string;
}

export function validateCreateEventData(data: CreateEventData): {
    valid: boolean;
    error?: string;
} {
    const eventIdValidation = validateEventData(data.eventId);
    if (!eventIdValidation.valid) {
        return eventIdValidation;
    }

    if (!data.eventName || typeof data.eventName !== 'string') {
        return { valid: false, error: 'Event name is required' };
    }

    if (data.eventName.trim().length === 0) {
        return { valid: false, error: 'Event name cannot be empty' };
    }

    if (data.eventName.length > 200) {
        return { valid: false, error: 'Event name too long (max 200 characters)' };
    }

    return { valid: true };
}
