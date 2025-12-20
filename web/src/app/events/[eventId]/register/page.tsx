"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useAccount } from "wagmi";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { registerForEvent, isRegistered } from "@/lib/services/registration-service";
import { ethers } from "ethers";

// ... imports

// Removed Supabase
// import { supabase } from "@/lib/supabase";

const CONTRACT_ABI = [
    "function getEvent(string eventId) external view returns (string, string, address, uint256, bool)",
    "function isAttendanceVerified(string eventId, address attendee) external view returns (bool)"
    // Note: getEventAttendees is not needed unless we want count
];

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";

// ... 

interface RegisterEventDetails {
    id: string;
    name: string;
    location: string;
    description: string;
    max_attendees: string;
}

export default function EventRegistrationPage() {
    const params = useParams();
    const eventId = params.eventId as string;
    const { address, isConnected } = useAccount();

    const [event, setEvent] = useState<RegisterEventDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState("");
    const [registrationComplete, setRegistrationComplete] = useState(false);
    const [alreadyRegistered, setAlreadyRegistered] = useState(false);

    useEffect(() => {
        if (eventId && address) {
            loadEventAndCheckRegistration();
        } else if (eventId) {
            // Load even if not connected, just skip check
            loadEventAndCheckRegistration();
        }
    }, [eventId, address]);

    const loadEventAndCheckRegistration = async () => {
        if (!eventId || !CONTRACT_ADDRESS) {
            setIsLoading(false);
            return;
        }

        try {
            const provider = new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
            const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

            // 1. Load event from Contract
            const details = await contract.getEvent(eventId) as any;

            // Map to UI expectations (mocking missing fields)
            setEvent({
                id: details[0],
                name: details[1],
                location: "Location not on-chain",
                description: "Description not on-chain",
                max_attendees: "Unlimited" // Not exposed in view
            });

            // 2. Check if already registered (Verified)
            if (address) {
                // In KRNL model, registration IS verification (attendance)
                // But for "Pre-registration" UI flow, we check if they are already verified
                const isVerified = await contract.isAttendanceVerified(eventId, address);
                setAlreadyRegistered(isVerified);
            }
        } catch (error) {
            console.error("Error loading event:", error);
            toast.error("Failed to load event from blockchain");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isConnected || !address) {
            toast.error("Please connect your wallet first");
            return;
        }

        if (!eventId) {
            toast.error("Invalid event");
            return;
        }

        setIsRegistering(true);

        try {
            await registerForEvent(eventId, address, email || undefined);

            toast.success("Successfully registered!");
            setRegistrationComplete(true);
            setAlreadyRegistered(true);
        } catch (error: any) {
            console.error("Registration error:", error);
            toast.error(error.message || "Failed to register");
        } finally {
            setIsRegistering(false);
        }
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
                    <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h1 className="heading-lg mb-4">Event Not Found</h1>
                    <p className="text-muted-foreground mb-6">
                        The event you're looking for doesn't exist.
                    </p>
                    <Link href="/events">
                        <Button>Browse Events</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background py-20">
            <div className="container mx-auto px-6 max-w-2xl">
                <div className="mb-8">
                    <h1 className="heading-lg mb-3">Register for Event</h1>
                    <p className="body-md text-muted-foreground">
                        {event.name}
                    </p>
                </div>

                {!isConnected ? (
                    <Card className="p-8 text-center">
                        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="heading-sm mb-2">Wallet Not Connected</h3>
                        <p className="text-muted-foreground mb-6">
                            Please connect your wallet to register for this event
                        </p>
                    </Card>
                ) : registrationComplete ? (
                    <Card className="p-8">
                        <div className="text-center mb-6">
                            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                            <h3 className="heading-md mb-2">Registration Complete!</h3>
                            <p className="text-muted-foreground">
                                You're registered for {event.name}
                            </p>
                        </div>

                        <div className="space-y-4 bg-muted/30 rounded-lg p-6 mb-6">
                            <div>
                                <Label className="text-sm text-muted-foreground">Event</Label>
                                <p className="mt-1">{event.name}</p>
                            </div>
                            <div>
                                <Label className="text-sm text-muted-foreground">Your Wallet</Label>
                                <p className="font-mono text-sm mt-1">{address}</p>
                            </div>
                            {event.location && (
                                <div>
                                    <Label className="text-sm text-muted-foreground">Location</Label>
                                    <p className="mt-1">{event.location}</p>
                                </div>
                            )}
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4 mb-6">
                            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                                What's Next?
                            </h4>
                            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                                <li>• You'll receive a verification code when you attend</li>
                                <li>• Use the code to verify your attendance on-chain</li>
                                <li>• Your attendance will be permanently recorded</li>
                            </ul>
                        </div>

                        <div className="flex gap-3">
                            <Link href={`/events/${eventId}`} className="flex-1">
                                <Button variant="outline" className="w-full">
                                    View Event Details
                                </Button>
                            </Link>
                            <Link href="/events" className="flex-1">
                                <Button className="w-full">
                                    Browse Events
                                </Button>
                            </Link>
                        </div>
                    </Card>
                ) : alreadyRegistered ? (
                    <Card className="p-8 text-center">
                        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                        <h3 className="heading-sm mb-2">Already Registered</h3>
                        <p className="text-muted-foreground mb-6">
                            You're already registered for this event
                        </p>
                        <Link href={`/events/${eventId}`}>
                            <Button>View Event Details</Button>
                        </Link>
                    </Card>
                ) : (
                    <Card className="p-8">
                        <form onSubmit={handleRegister} className="space-y-6">
                            <div className="space-y-4 bg-muted/30 rounded-lg p-6">
                                <div>
                                    <Label className="text-sm text-muted-foreground">Event Name</Label>
                                    <p className="mt-1 font-medium">{event.name}</p>
                                </div>
                                {event.description && (
                                    <div>
                                        <Label className="text-sm text-muted-foreground">Description</Label>
                                        <p className="mt-1 text-sm">{event.description}</p>
                                    </div>
                                )}
                                {event.location && (
                                    <div>
                                        <Label className="text-sm text-muted-foreground">Location</Label>
                                        <p className="mt-1">{event.location}</p>
                                    </div>
                                )}
                                <div>
                                    <Label className="text-sm text-muted-foreground">Max Attendees</Label>
                                    <p className="mt-1">{event.max_attendees}</p>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="wallet">Your Wallet Address</Label>
                                <Input
                                    id="wallet"
                                    type="text"
                                    value={address || ""}
                                    disabled
                                    className="mt-2 font-mono text-sm"
                                />
                            </div>

                            <div>
                                <Label htmlFor="email">Email (Optional)</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="your@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isRegistering}
                                    className="mt-2"
                                />
                                <p className="text-sm text-muted-foreground mt-2">
                                    Optional: Receive event updates and reminders
                                </p>
                            </div>

                            <div className="bg-muted/30 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <UserPlus className="w-5 h-5 text-primary mt-0.5" />
                                    <div>
                                        <h4 className="font-medium mb-1">Registration Benefits</h4>
                                        <ul className="text-sm text-muted-foreground space-y-1">
                                            <li>• Pre-register before the event</li>
                                            <li>• Organizer can see expected attendance</li>
                                            <li>• Faster check-in on event day</li>
                                            <li>• Receive verification code when you attend</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={isRegistering}
                                className="w-full"
                                size="lg"
                            >
                                {isRegistering ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Registering...
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="w-4 h-4 mr-2" />
                                        Register for Event
                                    </>
                                )}
                            </Button>
                        </form>
                    </Card>
                )}

                {isConnected && (
                    <div className="mt-8 text-center text-sm text-muted-foreground">
                        <p>Connected as: {address?.slice(0, 6)}...{address?.slice(-4)}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
