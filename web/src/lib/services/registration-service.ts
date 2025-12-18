import { ethers } from 'ethers';

// Basic interface to match what UI expects, though heavily simplified
export interface Registration {
    id: string; // no real ID on chain, will mock
    event_id: string;
    wallet_address: string;
    email?: string;
    attended: boolean;
    registered_at: string;
}

const CONTRACT_ABI = [
    "function getEventAttendees(string eventId) external view returns (address[])",
    "function isAttendanceVerified(string eventId, address attendee) external view returns (bool)"
];

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";

function getProvider() {
    return new ethers.JsonRpcProvider(RPC_URL);
}

function getContract() {
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, getProvider());
}

/**
 * Register a user for an event
 * @deprecated On-chain Logic: There is no strict "RSVP" on chain, only "Attendance".
 * This function is kept to satisfy UI interfaces but does nothing persistent off-chain.
 */
export async function registerForEvent(
    eventId: string,
    walletAddress: string,
    email?: string
): Promise<Registration> {
    console.warn("registerForEvent is deprecated in KRNL-only mode. Registration is implicit or handled via attendance.");
    return {
        id: "mock-id",
        event_id: eventId,
        wallet_address: walletAddress,
        email,
        attended: false,
        registered_at: new Date().toISOString()
    };
}

/**
 * Get all registrations for an event (Actually Returns Attendees)
 */
export async function getEventRegistrations(
    eventId: string
): Promise<Registration[]> {
    if (!CONTRACT_ADDRESS) return [];

    try {
        const contract = getContract();
        const attendees: string[] = await contract.getEventAttendees(eventId);

        // Map addresses to mock Registration objects
        return attendees.map(address => ({
            id: `${eventId}-${address}`,
            event_id: eventId,
            wallet_address: address,
            attended: true, // If they are in the list, they attended (verified)
            registered_at: new Date().toISOString() // Unknown timestamp without more complex queries
        }));
    } catch (error) {
        console.error("Failed to fetch attendees from contract:", error);
        return [];
    }
}

/**
 * Check if a wallet is registered (Approved/Attended)
 */
export async function isRegistered(
    eventId: string,
    walletAddress: string
): Promise<boolean> {
    if (!CONTRACT_ADDRESS) return false;

    try {
        const contract = getContract();
        // In this contract, verifying attendance IS the registration/record.
        const isVerified = await contract.isAttendanceVerified(eventId, walletAddress);
        return isVerified;
    } catch (error) {
        console.error("Failed to check registration status:", error);
        return false;
    }
}

/**
 * Mark registration as attended
 * @deprecated This is done via `verifyAttendance` transaction in the components.
 */
export async function markAsAttended(
    eventId: string,
    walletAddress: string
): Promise<void> {
    console.warn("markAsAttended is handled by the smart contract transaction.");
}

/**
 * Get registration statistics
 */
export async function getRegistrationStats(eventId: string): Promise<{
    total: number;
    attended: number;
    pending: number;
}> {
    if (!CONTRACT_ADDRESS) return { total: 0, attended: 0, pending: 0 };

    try {
        const contract = getContract();
        const attendees: string[] = await contract.getEventAttendees(eventId);

        // On-chain, everyone in the list has "attended" (verified).
        // There is no concept of "Pending RSVP" in this contract version.
        return {
            total: attendees.length,
            attended: attendees.length,
            pending: 0
        };
    } catch (error) {
        console.error("Error fetching stats:", error);
        return { total: 0, attended: 0, pending: 0 };
    }
}
