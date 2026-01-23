"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ethers } from "ethers";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Loader2, CheckCircle2, AlertCircle, Download, QrCode } from "lucide-react";
import { toast } from "sonner";
import { generateVerificationCodes } from "@/lib/services/code-generator";
import { QRCodeCanvas } from "qrcode.react";
import ModuPassTargetBase from "@/lib/ModuPassTargetBase.json";
import { supabase } from "@/lib/supabase";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";

interface CreatedEventData {
  eventId: string;
  eventName: string;
  codes: string[];
  merkleRoot: string;
  txHash: string;
}

export default function CreateEventPage() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync, isPending: isWriting } = useWriteContract();

  const [eventId, setEventId] = useState("");
  const [eventName, setEventName] = useState("");
  const [description, setDescription] = useState("");
  const [maxAttendees, setMaxAttendees] = useState("100");
  const [location, setLocation] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [createdEvent, setCreatedEvent] = useState<CreatedEventData | null>(null);
  const [showQRCodes, setShowQRCodes] = useState(false);

  const saveEventToDatabase = async (
    eventId: string,
    eventName: string,
    description: string,
    address: string,
    maxAttendeesNum: number,
    merkleRoot: string,
    location: string
  ) => {
    const { error } = await supabase
      .from("events")
      .insert({
        id: eventId,
        name: eventName,
        description: description || null,
        organizer_address: address,
        max_attendees: maxAttendeesNum,
        codes_merkle_root: merkleRoot,
        location: location || null,
        is_active: true,
      });

    return error;
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected || !address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!CONTRACT_ADDRESS) {
      toast.error("Contract address not configured");
      return;
    }

    // Validation
    if (!eventId || !eventName || !maxAttendees) {
      toast.error("Please fill in all required fields");
      return;
    }

    const maxAttendeesNum = parseInt(maxAttendees);
    if (maxAttendeesNum < 1 || maxAttendeesNum > 10000) {
      toast.error("Max attendees must be between 1 and 10,000");
      return;
    }

    setIsProcessing(true);

    try {
      // Step 1: Generate verification codes (in memory)
      toast.info("Generating verification codes...");
      const { codes, merkleRoot } = await generateVerificationCodes(
        eventId,
        maxAttendeesNum
      );

      // Step 2: Get KRNL Authorization (Mock Node)
      toast.info("Requesting KRNL authorization...");
      const authResponse = await fetch("/api/krnl/create-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userAddress: address,
          eventId,
          eventName,
          maxAttendees: maxAttendeesNum
        })
      });

      if (!authResponse.ok) {
        throw new Error("Failed to get authorization from KRNL Node");
      }

      const { authData } = await authResponse.json();

      // Step 3: Submit to blockchain
      toast.info("Please confirm transaction in your wallet...");

      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: ModuPassTargetBase.abi,
        functionName: "createEvent",
        args: [
          authData,
          eventId,
          eventName,
          merkleRoot as `0x${string}`,
          BigInt(maxAttendeesNum)
        ]
      });

      toast.info("Transaction submitted! Waiting for confirmation...");
      // Ideally wait for receipt here or let the UI show pending
      // But for simple flow, we assume success or user checks wallet

      // Success!
      // Since we don't persist to DB, we MUST give the codes to user now.
      setCreatedEvent({
        eventId,
        eventName,
        codes,
        merkleRoot,
        txHash
      });

      // Save to Supabase for dashboard visibility
      const dbError = await saveEventToDatabase(
        eventId,
        eventName,
        description,
        address!,
        maxAttendeesNum,
        merkleRoot,
        location
      );

      if (dbError) {
        console.error("Failed to save event to database:", dbError);
        toast.error("Event created on blockchain but failed to save to dashboard. Please refresh and try again.");
      } else {
        toast.success("Event created successfully!");
      }

      // Reset form
      setEventId("");
      setEventName("");
      setDescription("");
      setMaxAttendees("100");
      setLocation("");

    } catch (error: any) {
      console.error("Error creating event:", error);
      toast.error(error.message || "Failed to create event");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadCodes = () => {
    if (!createdEvent) return;

    const content = createdEvent.codes.join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${createdEvent.eventId}-codes.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background py-20">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="mb-8">
          <h1 className="heading-lg mb-3">Create Event</h1>
          <p className="body-md text-muted-foreground">
            Set up a new event with verification codes and KRNL-powered attendance tracking
          </p>
        </div>

        {!isConnected ? (
          <Card className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="heading-sm mb-2">Wallet not connected</h3>
            <p className="text-muted-foreground mb-6">
              Please connect your wallet to create an event
            </p>
          </Card>
        ) : createdEvent ? (
          <Card className="p-8">
            <div className="text-center mb-6">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
              <h3 className="heading-md mb-2">Event Created!</h3>
              <p className="text-muted-foreground">
                Your event has been successfully created with {createdEvent.codes.length} verification codes
              </p>
            </div>

            <div className="space-y-4 bg-muted/30 rounded-lg p-6 mb-6">
              <div>
                <Label className="text-sm text-muted-foreground">Event ID</Label>
                <p className="font-mono text-sm mt-1">{createdEvent.eventId}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Merkle Root</Label>
                <p className="font-mono text-xs mt-1 break-all">{createdEvent.merkleRoot}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Transaction Hash</Label>
                <a
                  href={`https://sepolia.etherscan.io/tx/${createdEvent.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-sm text-primary hover:underline block mt-1 break-all"
                >
                  {createdEvent.txHash}
                </a>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-6">
              <h4 className="text-amber-500 font-bold flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4" />
                Wait! Download your codes!
              </h4>
              <p className="text-sm text-amber-500/90">
                Since we are running in decentralized mode, these codes are NOT stored in a database.
                If you leave this page without downloading them, <strong>they are lost forever</strong>.
              </p>
            </div>

            <div className="space-y-3">
              <Button onClick={downloadCodes} variant="default" className="w-full bg-emerald-600 hover:bg-emerald-700">
                <Download className="w-4 h-4 mr-2" />
                Download All Codes ({createdEvent.codes.length})
              </Button>

              <Button
                onClick={() => setShowQRCodes(!showQRCodes)}
                variant="outline"
                className="w-full"
              >
                <QrCode className="w-4 h-4 mr-2" />
                {showQRCodes ? "Hide" : "Show"} QR Codes
              </Button>

              {showQRCodes && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg max-h-96 overflow-y-auto">
                  {createdEvent.codes.slice(0, 12).map((code, index) => (
                    <div key={code} className="bg-white p-3 rounded-lg text-center">
                      <QRCodeCanvas
                        value={`${window.location.origin}/events/verify?code=${code}&event=${createdEvent.eventId}`}
                        size={100}
                        className="mx-auto mb-2"
                      />
                      <p className="text-xs font-mono text-slate-900">{code}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                <Button onClick={() => setCreatedEvent(null)} variant="outline" className="flex-1">
                  Create Another Event
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-8">
            <form onSubmit={handleCreateEvent} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="eventId">
                    Event ID <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="eventId"
                    type="text"
                    placeholder="e.g., ethcc-2025-day1"
                    value={eventId}
                    onChange={(e) => setEventId(e.target.value)}
                    disabled={isProcessing}
                    className="mt-2"
                    required
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Unique identifier (alphanumeric only)
                  </p>
                </div>

                <div>
                  <Label htmlFor="maxAttendees">
                    Max Attendees <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="maxAttendees"
                    type="number"
                    min="1"
                    max="10000"
                    placeholder="100"
                    value={maxAttendees}
                    onChange={(e) => setMaxAttendees(e.target.value)}
                    disabled={isProcessing}
                    className="mt-2"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="eventName">
                  Event Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="eventName"
                  type="text"
                  placeholder="e.g., EthCC 2025 - Day 1"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  disabled={isProcessing}
                  className="mt-2"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of your event..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isProcessing}
                  className="mt-2"
                  rows={3}
                />
              </div>

              <div className="bg-muted/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium mb-1">What happens next?</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• {maxAttendees || "100"} unique verification codes will be generated</li>
                      <li>• Codes will be secured with Merkle tree cryptography</li>
                      <li>• Event will be created on Sepolia blockchain</li>
                      <li>• You MUST download the codes immediately after creation</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isProcessing || !eventId || !eventName || !maxAttendees}
                className="w-full"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Event...
                  </>
                ) : (
                  "Create Event"
                )}
              </Button>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}
