"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Users, CheckCircle, Download, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { ethers } from "ethers";

// ... imports

// Removed Supabase import
// import { supabase } from "@/lib/supabase";

const CONTRACT_ABI = [
    "function getTotalEvents() external view returns (uint256)",
    "function getEventIdByIndex(uint256 index) external view returns (string)",
    "function getEvent(string eventId) external view returns (string, string, address, uint256, bool)",
    "function getEventAttendees(string eventId) external view returns (address[])"
];

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";

// ... component starts

import { getEventCodes } from "@/lib/services/code-generator";

interface EventWithStats {
    id: string;
    name: string;
    description: string;
    max_attendees: number;
    created_at: string;
    registrations: number;
    verifications: number;
}

export default function DashboardPage() {
    const { address, isConnected } = useAccount();
    const [events, setEvents] = useState<EventWithStats[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isConnected && address) {
            loadOrganizerEvents();
        } else if (!isConnected) {
            setIsLoading(false);
        }
    }, [isConnected, address]);

    const loadOrganizerEvents = async () => {
        if (!address || !CONTRACT_ADDRESS) {
            setIsLoading(false);
            return;
        }

        try {
            const provider = new ethers.JsonRpcProvider(RPC_URL);
            const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

            // 1. Get total events
            let totalEvents = 0;
            try {
                const totalEventsBigInt = await contract.getTotalEvents();
                totalEvents = Number(totalEventsBigInt);
            } catch (e) {
                console.warn("Error fetching total events", e);
            }

            if (totalEvents === 0) {
                setEvents([]);
                return;
            }

            const organizerEvents: EventWithStats[] = [];

            // Loop through all events (backwards)
            // Warning: scaling issue if events > 100s, but fine for demo
            const startIndex = Math.max(0, totalEvents - 50); // limit to 50
            for (let i = totalEvents - 1; i >= startIndex; i--) {
                try {
                    const eventId = await contract.getEventIdByIndex(i);
                    const details = await contract.getEvent(eventId) as any;
                    const organizer = details[2];

                    // FILTER: Only show events owned by current user
                    if (organizer.toLowerCase() === address.toLowerCase()) {
                        const attendees = await contract.getEventAttendees(eventId);

                        organizerEvents.push({
                            id: details[0],
                            name: details[1],
                            description: "Event description not stored on-chain", // Not on chain in V1
                            max_attendees: 100, // Default constant as it's not in the View
                            created_at: new Date(Number(details[3]) * 1000).toISOString(),
                            registrations: attendees.length, // Registrations = Attendees (Verified)
                            verifications: attendees.length // Verified
                        });
                    }
                } catch (e) {
                    console.warn(`Error fetching event at index ${i}`, e);
                }
            }

            setEvents(organizerEvents);
        } catch (error: any) {
            console.error("Error loading events:", error);
            toast.error("Failed to load events from blockchain");
        } finally {
            setIsLoading(false);
        }
    };

    const downloadCodes = async (eventId: string, eventName: string) => {
        try {
            toast.info("Downloading codes...");
            const codes = await getEventCodes(eventId); // Now imported

            if (!codes || codes.length === 0) {
                toast.error("No codes found for this event");
                return;
            }

            const content = codes.join("\n");
            const blob = new Blob([content], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${eventId}-codes.txt`;
            a.click();
            URL.revokeObjectURL(url);

            toast.success("Codes downloaded!");
        } catch (error: any) {
            console.error("Error downloading codes:", error);
            toast.error("Failed to download codes");
        }
    };

    if (!isConnected) {
        return (
            <div className="min-h-screen bg-background py-20">
                <div className="container mx-auto px-6 max-w-4xl">
                    <Card className="p-12 text-center">
                        <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="heading-md mb-2">Connect Your Wallet</h3>
                        <p className="text-muted-foreground mb-6">
                            Please connect your wallet to view your organizer dashboard
                        </p>
                    </Card>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background py-20">
            <div className="container mx-auto px-6 max-w-6xl">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="heading-lg mb-3">Organizer Dashboard</h1>
                        <p className="body-md text-muted-foreground">
                            Manage your events and track attendance
                        </p>
                    </div>
                    <Link href="/events/create">
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Event
                        </Button>
                    </Link>
                </div>

                {events.length === 0 ? (
                    <Card className="p-12 text-center">
                        <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="heading-md mb-2">No Events Yet</h3>
                        <p className="text-muted-foreground mb-6">
                            Create your first event to start tracking attendance
                        </p>
                        <Link href="/events/create">
                            <Button>
                                <Plus className="w-4 h-4 mr-2" />
                                Create Your First Event
                            </Button>
                        </Link>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {events.map((event) => (
                            <Card key={event.id} className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="heading-sm mb-2">{event.name}</h3>
                                        {event.description && (
                                            <p className="text-sm text-muted-foreground mb-3">
                                                {event.description}
                                            </p>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            Created {new Date(event.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <Link href={`/events/${event.id}`}>
                                        <Button variant="outline" size="sm">
                                            View Event
                                        </Button>
                                    </Link>
                                </div>

                                <div className="grid grid-cols-3 gap-4 mb-4">
                                    <div className="bg-muted/30 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Calendar className="w-4 h-4 text-primary" />
                                            <span className="text-sm font-medium">Capacity</span>
                                        </div>
                                        <p className="text-2xl font-bold">{event.max_attendees}</p>
                                        <p className="text-xs text-muted-foreground">Max attendees</p>
                                    </div>

                                    <div className="bg-muted/30 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Users className="w-4 h-4 text-blue-600" />
                                            <span className="text-sm font-medium">Registered</span>
                                        </div>
                                        <p className="text-2xl font-bold">{event.registrations}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {Math.round((event.registrations / event.max_attendees) * 100)}% of capacity
                                        </p>
                                    </div>

                                    <div className="bg-muted/30 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                                            <span className="text-sm font-medium">Verified</span>
                                        </div>
                                        <p className="text-2xl font-bold">{event.verifications}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {event.registrations > 0
                                                ? Math.round((event.verifications / event.registrations) * 100)
                                                : 0}% attendance rate
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => downloadCodes(event.id, event.name)}
                                        className="flex-1"
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Download Codes
                                    </Button>
                                    <Link href={`/events/${event.id}`} className="flex-1">
                                        <Button variant="secondary" size="sm" className="w-full">
                                            View Details
                                        </Button>
                                    </Link>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                <div className="mt-8 text-center text-sm text-muted-foreground">
                    <p>Connected as: {address?.slice(0, 6)}...{address?.slice(-4)}</p>
                </div>
            </div>
        </div>
    );
}
