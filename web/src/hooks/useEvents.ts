import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { useAccount } from "wagmi";

const CONTRACT_ABI = [
    "function getTotalEvents() external view returns (uint256)",
    "function getEventIdByIndex(uint256 index) external view returns (string)",
    "function getEvent(string eventId) external view returns (string, string, address, uint256, bool)",
    "function getEventAttendees(string eventId) external view returns (address[])"
];

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";

export interface EventData {
    id: string;
    name: string;
    organizer: string;
    createdAt: number;
    isActive: boolean;
    attendeeCount: number;
    attendees: string[]; // List of wallet addresses
    maxAttendees: number; // Inferred or default
}

export function useEvents() {
    const { address } = useAccount();
    const [events, setEvents] = useState<EventData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchEvents = useCallback(async () => {
        if (!CONTRACT_ADDRESS) {
            console.error("Contract address missing");
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Use a simple public provider for reading data to avoid wallet connection requirement for just viewing
            const provider = new ethers.JsonRpcProvider(RPC_URL);
            const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

            // 1. Get total count
            let totalEvents = 0;
            try {
                const totalEventsBigInt = await contract.getTotalEvents();
                totalEvents = Number(totalEventsBigInt);
            } catch (e) {
                console.warn("Error fetching total events, or contract empty", e);
            }

            if (totalEvents === 0) {
                setEvents([]);
                setIsLoading(false);
                return;
            }

            const loadedEvents: EventData[] = [];

            // 2. Loop backwards to show newest first
            // Limit to last 50 events for performance
            const startIndex = Math.max(0, totalEvents - 50);

            for (let i = totalEvents - 1; i >= startIndex; i--) {
                try {
                    const eventId = await contract.getEventIdByIndex(i);
                    const details = await contract.getEvent(eventId) as any;

                    // Allow failures in fetching attendees to not block the whole event loading
                    let attendees: string[] = [];
                    try {
                        attendees = await contract.getEventAttendees(eventId);
                    } catch (err) {
                        console.warn(`Failed to fetch attendees for ${eventId}`);
                    }

                    loadedEvents.push({
                        id: details[0],
                        name: details[1],
                        organizer: details[2],
                        createdAt: Number(details[3]),
                        isActive: details[4],
                        maxAttendees: 100, // Hardcoded as it's not in the view function of this contract version
                        attendeeCount: attendees.length,
                        attendees: attendees
                    });
                } catch (innerError) {
                    console.warn(`Failed to load event at index ${i}`, innerError);
                }
            }

            setEvents(loadedEvents);
        } catch (err: any) {
            console.error("Error loading events:", err);
            setError(err.message || "Failed to load events");
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    return {
        events,
        isLoading,
        error,
        refetch: fetchEvents
    };
}
