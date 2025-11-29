"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Shield, ArrowLeft, ExternalLink, Loader2 } from "lucide-react";
import Link from "next/link";

const CONTRACT_ABI = [
    "function getEvent(string eventId) external view returns (string, string, address, uint256, bool)",
    "function getEventAttendees(string eventId) external view returns (address[])",
    "function isAttendanceVerified(string eventId, address attendee) external view returns (bool)"
];

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";

interface EventDetails {
    eventId: string;
    eventName: string;
    organizer: string;
    createdAt: number;
    isActive: boolean;
    attendees: string[];
}

export default function EventDetailPage() {
    const params = useParams();
    const eventId = params.eventId as string;
    const { address } = useAccount();

    const [event, setEvent] = useState<EventDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [userVerified, setUserVerified] = useState(false);

    useEffect(() => {
        loadEventDetails();
    }, [eventId, address]);

    const loadEventDetails = async () => {
        if (!CONTRACT_ADDRESS || !eventId) {
            setIsLoading(false);
            return;
        }

        try {
            const provider = new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
            const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

            const [id, name, organizer, createdAt, isActive] = await contract.getEvent(eventId);
            const attendees = await contract.getEventAttendees(eventId);

            setEvent({
                eventId: id,
                eventName: name,
                organizer,
                createdAt: Number(createdAt),
                isActive,
                attendees
            });

            // Check if current user has verified
            if (address) {
                const verified = await contract.isAttendanceVerified(eventId, address);
                setUserVerified(verified);
            }
        } catch (error) {
            console.error("Error loading event:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatAddress = (addr: string) => {
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-screen bg-background py-20">
                <div className="container mx-auto px-6 max-w-2xl text-center">
                    <h1 className="heading-lg mb-4">Event not found</h1>
                    <p className="text-muted-foreground mb-6">
                        The event you're looking for doesn't exist or hasn't been created yet.
                    </p>
                    <Link href="/events">
                        <Button>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Events
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background py-20">
            <div className="container mx-auto px-6 max-w-4xl">
                <Link href="/events" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to all events
                </Link>

                <div className="mb-8">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h1 className="heading-xl mb-2">{event.eventName}</h1>
                            <p className="text-muted-foreground">Event ID: {event.eventId}</p>
                        </div>
                        {event.isActive ? (
                            <span className="px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 text-sm font-medium">
                                Active
                            </span>
                        ) : (
                            <span className="px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-sm font-medium">
                                Inactive
                            </span>
                        )}
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <Card className="p-6">
                        <Calendar className="w-8 h-8 text-primary mb-3" />
                        <h3 className="font-medium mb-1">Created</h3>
                        <p className="text-sm text-muted-foreground">{formatDate(event.createdAt)}</p>
                    </Card>

                    <Card className="p-6">
                        <Users className="w-8 h-8 text-primary mb-3" />
                        <h3 className="font-medium mb-1">Attendees</h3>
                        <p className="text-sm text-muted-foreground">
                            {event.attendees.length} {event.attendees.length === 1 ? 'person' : 'people'} verified
                        </p>
                    </Card>

                    <Card className="p-6">
                        <Shield className="w-8 h-8 text-primary mb-3" />
                        <h3 className="font-medium mb-1">Organizer</h3>
                        <a
                            href={`https://sepolia.etherscan.io/address/${event.organizer}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                        >
                            {formatAddress(event.organizer)}
                            <ExternalLink className="w-3 h-3" />
                        </a>
                    </Card>
                </div>

                {userVerified && (
                    <Card className="p-6 mb-8 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900">
                        <div className="flex items-center gap-3">
                            <Shield className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                            <div>
                                <h3 className="font-medium text-emerald-900 dark:text-emerald-100">
                                    You've verified attendance
                                </h3>
                                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                                    Your attendance proof is recorded on-chain
                                </p>
                            </div>
                        </div>
                    </Card>
                )}

                {event.isActive && !userVerified && (
                    <Card className="p-6 mb-8">
                        <h3 className="heading-sm mb-2">Verify Your Attendance</h3>
                        <p className="text-muted-foreground mb-4">
                            Submit your attendance proof for this event
                        </p>
                        <Link href={`/events/verify?eventId=${event.eventId}`}>
                            <Button>
                                <Shield className="w-4 h-4 mr-2" />
                                Verify Attendance
                            </Button>
                        </Link>
                    </Card>
                )}

                <Card className="p-6">
                    <h3 className="heading-sm mb-4">Verified Attendees ({event.attendees.length})</h3>
                    {event.attendees.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                            No attendees have verified yet
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {event.attendees.map((attendee, index) => (
                                <div
                                    key={attendee}
                                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                                            {index + 1}
                                        </div>
                                        <span className="font-mono text-sm">{formatAddress(attendee)}</span>
                                    </div>
                                    <a
                                        href={`https://sepolia.etherscan.io/address/${attendee}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline text-sm inline-flex items-center gap-1"
                                    >
                                        View
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
