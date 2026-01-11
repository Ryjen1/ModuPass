/**
 * Kernel utilities for ModuPass
 * Validation and helper functions for event management
 * 
 * Note: This module provides utility functions for validation.
 * All workflow execution is handled by KRNL SDK in krnl-workflows.ts
 */

export interface CreateEventData {
    eventId: string;
    eventName: string;
}

export interface AttendanceProofData {
    eventId: string;
    attendee: string;
    timestamp: number;
    verified: boolean;
}

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

/**
 * Validate event ID format
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

    if (!/^[a-zA-Z0-9-_]+$/.test(eventId)) {
        return {
            valid: false,
            error: 'Event ID can only contain letters, numbers, hyphens, and underscores',
        };
    }

    return { valid: true };
}

/**
 * Validate event creation data
 */
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

/**
 * Generate attendance proof data
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
    const bytes = Buffer.from(proofString, 'utf8').toString('hex');
    return '0x' + bytes;
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
 * Validate Ethereum address format
 */
export function validateAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}
