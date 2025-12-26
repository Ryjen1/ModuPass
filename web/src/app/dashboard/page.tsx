"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Users, CheckCircle, Download, Loader2, Plus, Ticket, LayoutDashboard } from "lucide-react";
import { toast } from "sonner";
import { useEvents } from "@/hooks/useEvents";
import { getEventCodes } from "@/lib/services/code-generator";

// Simple Tabs Component (Inline for simplicity or could be imported from shadcn if available)
function Tabs({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) {
    return (
        <div className="flex border-b border-border/40 mb-8">
            <button
                onClick={() => setActiveTab("creator")}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === "creator"
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
            >
                <LayoutDashboard className="w-4 h-4" />
                Creator Hub
            </button>
            <button
                onClick={() => setActiveTab("tickets")}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === "tickets"
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
            >
                <Ticket className="w-4 h-4" />
                My Tickets
            </button>
        </div>
    );
}

export default function DashboardPage() {
    const { address, isConnected } = useAccount();
    const { events, isLoading, refetch } = useEvents();
    const [activeTab, setActiveTab] = useState("creator");

    // Filter events based on active tab and user address
    const creatorEvents = events.filter(e =>
        address && e.organizer && e.organizer.toLowerCase() === address.toLowerCase()
    );

    const myTickets = events.filter(e =>
        address && e.attendees && e.attendees.some(a => a.toLowerCase() === address.toLowerCase())
    );

    const downloadCodes = async (eventId: string, eventName: string) => {
        try {
            toast.info("Downloading codes...");
            const codes = await getEventCodes(eventId);

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
                    <Card className="p-12 text-center border-border/50">
                        <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="heading-md mb-2">Connect Your Wallet</h3>
                        <p className="text-muted-foreground mb-6">
                            Please connect your wallet to access your dashboard and tickets.
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
                <div className="mb-8">
                    <h1 className="heading-lg mb-2">Dashboard</h1>
                    <p className="text-muted-foreground">
                        Welcome back! Manage your events and view your attendance proofs.
                    </p>
                </div>

                <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

                {activeTab === "creator" && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="heading-sm">Your Events</h2>
                            <Link href="/events/create">
                                <Button>
                                    <Plus className="w-4 h-4 mr-2" />
                                    New Event
                                </Button>
                            </Link>
                        </div>

                        {creatorEvents.length === 0 ? (
                            <Card className="p-12 text-center border-border/50 bg-muted/10">
                                <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                                <h3 className="heading-md mb-2">No Events Created</h3>
                                <p className="text-muted-foreground mb-6">
                                    You haven't created any events yet.
                                </p>
                                <Link href="/events/create">
                                    <Button variant="outline">
                                        Create First Event
                                    </Button>
                                </Link>
                            </Card>
                        ) : (
                            <div className="space-y-6">
                                {creatorEvents.map((event) => (
                                    <Card key={event.id} className="p-6 border-border/50 hover:border-primary/50 transition-colors">
                                        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
                                            <div>
                                                <h3 className="heading-sm mb-1 text-primary">{event.name}</h3>
                                                <p className="text-xs text-muted-foreground font-mono">ID: {event.id}</p>
                                                <p className="text-sm text-muted-foreground mt-2">
                                                    Created {new Date(event.createdAt * 1000).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => downloadCodes(event.id, event.name)}
                                                >
                                                    <Download className="w-4 h-4 mr-2" />
                                                    Codes
                                                </Button>
                                                <Link href={`/events/${event.id}`}>
                                                    <Button size="sm">Manage</Button>
                                                </Link>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="bg-muted/30 p-4 rounded-lg text-center">
                                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Capacity</p>
                                                <p className="text-2xl font-bold">{event.maxAttendees}</p>
                                            </div>
                                            <div className="bg-muted/30 p-4 rounded-lg text-center">
                                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Verified</p>
                                                <p className="text-2xl font-bold text-emerald-500">{event.attendeeCount}</p>
                                            </div>
                                            <div className="bg-muted/30 p-4 rounded-lg text-center">
                                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Status</p>
                                                <p className="text-lg font-bold">
                                                    {event.isActive ? <span className="text-emerald-500">Active</span> : <span className="text-muted-foreground">Ended</span>}
                                                </p>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "tickets" && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="heading-sm">Your Verified Tickets</h2>
                            <Link href="/events">
                                <Button variant="outline">
                                    Explore Events
                                </Button>
                            </Link>
                        </div>

                        {myTickets.length === 0 ? (
                            <Card className="p-12 text-center border-border/50 bg-muted/10">
                                <Ticket className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                                <h3 className="heading-md mb-2">No Verified Tickets</h3>
                                <p className="text-muted-foreground mb-6">
                                    You haven't verified attendance for any events yet.
                                </p>
                                <Link href="/events">
                                    <Button>
                                        Browse Events
                                    </Button>
                                </Link>
                            </Card>
                        ) : (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {myTickets.map((event) => (
                                    <Card key={event.id} className="p-0 overflow-hidden border-border/50 group hover:border-emerald-500/50 transition-all">
                                        <div className="h-2 bg-emerald-500 w-full" />
                                        <div className="p-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                                                </div>
                                                <span className="px-2 py-1 rounded bg-muted text-[10px] font-mono uppercase text-muted-foreground">
                                                    Verified
                                                </span>
                                            </div>

                                            <h3 className="heading-sm mb-2 group-hover:text-emerald-400 transition-colors">{event.name}</h3>
                                            <p className="text-sm text-muted-foreground mb-4">
                                                {new Date(event.createdAt * 1000).toLocaleDateString(undefined, {
                                                    weekday: 'long',
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </p>

                                            <div className="pt-4 border-t border-border/50 flex justify-between items-center">
                                                <span className="text-xs text-muted-foreground">Organizer: {event.organizer.slice(0, 6)}...</span>
                                                <Link href={`/events/${event.id}`}>
                                                    <Button size="sm" variant="ghost" className="h-8">Details</Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
