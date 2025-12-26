"use client";

import { useState } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Plus, Loader2, CheckCircle2 } from "lucide-react";
import { useEvents } from "@/hooks/useEvents";

export default function EventsPage() {
  const { address, isConnected } = useAccount();
  const { events, isLoading } = useEvents();
  const [filter, setFilter] = useState<"all" | "verified">("all");

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isVerified = (eventAttendees: string[]) => {
    if (!address) return false;
    return eventAttendees.some(a => a.toLowerCase() === address.toLowerCase());
  };

  const filteredEvents = filter === "all"
    ? events
    : events.filter(e => isVerified(e.attendees));

  return (
    <div className="min-h-screen bg-background py-20">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="heading-lg mb-3">All Events</h1>
            <p className="body-md text-muted-foreground">
              Browse and verify your attendance at community events
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isConnected && (
              <div className="bg-muted/30 p-1 rounded-lg flex">
                <button
                  onClick={() => setFilter("all")}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${filter === "all" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  All Events
                </button>
                <button
                  onClick={() => setFilter("verified")}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${filter === "verified" ? "bg-emerald-500/10 text-emerald-500 shadow" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Verified <CheckCircle2 className="w-3 h-3" />
                </button>
              </div>
            )}
            <Link href="/events/create">
              <Button className="inline-flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create Event
              </Button>
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredEvents.length === 0 ? (
          <Card className="p-12 text-center border-border/50 bg-muted/10">
            <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="heading-md mb-2">No events found</h3>
            <p className="text-muted-foreground mb-6">
              {filter === "verified"
                ? "You haven't verified attendance for any events yet."
                : "No events satisfy your criteria."}
            </p>
            {filter === "verified" ? (
              <Button variant="outline" onClick={() => setFilter("all")}>Show All Events</Button>
            ) : (
              <Link href="/events/create">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Event
                </Button>
              </Link>
            )}
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => {
              const verified = isVerified(event.attendees);

              return (
                <Link key={event.id} href={`/events/${event.id}`}>
                  <Card className={`p-6 hover:shadow-lg transition cursor-pointer h-full border-border/50 hover:border-primary/40 relative overflow-hidden group`}>
                    {/* Verified Badge Overlay */}
                    {verified && (
                      <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] uppercase font-bold px-3 py-1 rounded-bl-lg z-10">
                        Verified
                      </div>
                    )}

                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${verified ? "bg-emerald-500/20 text-emerald-500" : "bg-primary/10 text-primary"}`}>
                        {verified ? <CheckCircle2 className="w-6 h-6" /> : <Calendar className="w-6 h-6" />}
                      </div>
                      {event.isActive ? (
                        <span className="px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-medium border border-emerald-500/20">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                          Ended
                        </span>
                      )}
                    </div>

                    <h3 className="heading-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">{event.name}</h3>

                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{event.attendeeCount} {event.attendeeCount === 1 ? 'attendee' : 'attendees'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(event.createdAt)}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-border/50 flex justify-between items-center">
                      <p className="text-xs text-muted-foreground font-mono truncate max-w-[120px]">
                        ID: {event.id}
                      </p>
                      {verified ? (
                        <span className="text-xs text-emerald-500 font-medium">Ticket Owned</span>
                      ) : (
                        <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">View Details →</span>
                      )}
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  );
}