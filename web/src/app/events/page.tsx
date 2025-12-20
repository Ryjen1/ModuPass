"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, ArrowRight, Plus, Loader2 } from "lucide-react";
import Link from "next/link";

const CONTRACT_ABI = [
  "function getTotalEvents() external view returns (uint256)",
  "function getEventIdByIndex(uint256 index) external view returns (string)",
  "function getEvent(string eventId) external view returns (string, string, address, uint256, bool)",
  "function getEventAttendees(string eventId) external view returns (address[])"
];

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";

interface EventData {
  id: string;
  name: string;
  organizer: string;
  createdAt: number;
  isActive: boolean;
  attendeeCount: number;
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    if (!CONTRACT_ADDRESS) {
      console.error("Contract address missing");
      setIsLoading(false);
      return;
    }

    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

      // 1. Get total count
      // contract.getTotalEvents() might return BigInt
      let totalEvents = 0;
      try {
        const totalEventsBigInt = await contract.getTotalEvents();
        totalEvents = Number(totalEventsBigInt);
      } catch (e) {
        console.warn("Error fetching total events, defaulting to 0", e);
      }

      if (totalEvents === 0) {
        setEvents([]);
        return;
      }

      const loadedEvents: EventData[] = [];

      // 2. Loop backwards to show newest first
      const startIndex = Math.max(0, totalEvents - 20);

      for (let i = totalEvents - 1; i >= startIndex; i--) {
        try {
          const eventId = await contract.getEventIdByIndex(i);
          const details = await contract.getEvent(eventId) as any;
          const attendees = await contract.getEventAttendees(eventId);

          loadedEvents.push({
            id: details[0],
            name: details[1],
            organizer: details[2],
            createdAt: Number(details[3]),
            isActive: details[4],
            attendeeCount: attendees.length
          });
        } catch (innerError) {
          console.warn(`Failed to load event at index ${i}`, innerError);
        }
      }

      setEvents(loadedEvents);
    } catch (error) {
      console.error("Error loading events from contract:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-background py-20">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="heading-lg mb-3">All Events</h1>
            <p className="body-md text-muted-foreground">
              Browse all events created on ModuPass
            </p>
          </div>
          <Link href="/events/create">
            <Button className="inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Event
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : events.length === 0 ? (
          <Card className="p-12 text-center">
            <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="heading-md mb-2">No events yet</h3>
            <p className="text-muted-foreground mb-6">
              Be the first to create an event on ModuPass!
            </p>
            <Link href="/events/create">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create First Event
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Link key={event.id} href={`/events/${event.id}`}>
                <Card className="p-6 hover:shadow-lg transition cursor-pointer h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-primary" />
                    </div>
                    {event.isActive ? (
                      <span className="px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                        Inactive
                      </span>
                    )}
                  </div>

                  <h3 className="heading-sm mb-2 line-clamp-2">{event.name}</h3>

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

                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground font-mono truncate">
                      ID: {event.id}
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}