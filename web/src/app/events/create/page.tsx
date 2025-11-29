"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Loader2, CheckCircle2, AlertCircle, Download, QrCode } from "lucide-react";
import { toast } from "sonner";
import { generateVerificationCodes, storeVerificationCodes } from "@/lib/services/code-generator";
import { supabase } from "@/lib/supabase";
import { QRCodeCanvas } from "qrcode.react";

const CONTRACT_ABI = [
  "function createEvent((uint256 nonce, uint256 expiry, bytes32 id, bytes32[] executions, bytes result, bool sponsorExecutionFee, bytes signature) authData, string eventId, string eventName, bytes32 codesMerkleRoot, uint256 maxAttendees) external"
];

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
  const [eventId, setEventId] = useState("");
  const [eventName, setEventName] = useState("");
  const [description, setDescription] = useState("");
  const [maxAttendees, setMaxAttendees] = useState("100");
  const [location, setLocation] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createdEvent, setCreatedEvent] = useState<CreatedEventData | null>(null);
  const [showQRCodes, setShowQRCodes] = useState(false);

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

    setIsCreating(true);

    try {
      // Step 1: Generate verification codes (in memory)
      toast.info("Generating verification codes...");
      const { codes, merkleRoot, tree, leaves } = await generateVerificationCodes(
        eventId,
        maxAttendeesNum
      );

      // Step 2: Create AuthData (simplified for now)
      const authData = {
        nonce: Math.floor(Date.now() / 1000),
        expiry: Math.floor(Date.now() / 1000) + 3600,
        id: ethers.keccak256(ethers.toUtf8Bytes(eventId + Date.now())),
        executions: [],
        result: "0x",
        sponsorExecutionFee: false,
        signature: "0x"
      };

      // Step 3: Submit to blockchain
      toast.info("Please confirm transaction in your wallet...");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      const tx = await contract.createEvent(
        authData,
        eventId,
        eventName,
        merkleRoot,
        maxAttendeesNum
      );

      toast.info("Transaction submitted! Waiting for confirmation...");
      const receipt = await tx.wait();

      // Step 4: Store event in Supabase (only after blockchain success)
      toast.info("Storing event data...");
      const { error: dbError } = await supabase.from("events").insert({
        id: eventId,
        name: eventName,
        description,
        organizer_address: address,
        max_attendees: maxAttendeesNum,
        codes_merkle_root: merkleRoot,
        location,
        contract_event_id: eventId,
        // Store tx hash if you have a column for it, otherwise it's fine
      });

      if (dbError) {
        // If DB save fails but blockchain succeeded, we should probably alert the user
        // In a production app, you'd have a recovery mechanism here
        console.error("Failed to save event to DB after blockchain success:", dbError);
        throw new Error(`Database error: ${dbError.message}`);
      }

      // Step 5: Store verification codes in Supabase
      toast.info("Storing verification codes...");
      await storeVerificationCodes(eventId, codes, tree, leaves);

      // Success!
      setCreatedEvent({
        eventId,
        eventName,
        codes,
        merkleRoot,
        txHash: receipt.hash
      });

      toast.success("Event created successfully!");

      // Reset form
      setEventId("");
      setEventName("");
      setDescription("");
      setMaxAttendees("100");
      setLocation("");

    } catch (error: any) {
      console.error("Error creating event:", error);

      if (error.code === "ACTION_REJECTED") {
        toast.error("Transaction rejected");
      } else if (error.message?.includes("Event already exists")) {
        toast.error("Event ID already exists. Please choose a different ID.");
      } else {
        toast.error(error.message || "Failed to create event");
      }
    } finally {
      setIsCreating(false);
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
                <Label className="text-sm text-muted-foreground">Event Name</Label>
                <p className="mt-1">{createdEvent.eventName}</p>
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

            <div className="space-y-3">
              <Button onClick={downloadCodes} variant="outline" className="w-full">
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
                      <p className="text-xs font-mono">{code}</p>
                    </div>
                  ))}
                  {createdEvent.codes.length > 12 && (
                    <div className="col-span-full text-center text-sm text-muted-foreground">
                      Showing 12 of {createdEvent.codes.length} codes. Download all to see more.
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <Button onClick={() => setCreatedEvent(null)} variant="outline" className="flex-1">
                  Create Another Event
                </Button>
                <Button
                  onClick={() => window.location.href = `/events/${createdEvent.eventId}`}
                  className="flex-1"
                >
                  View Event
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
                    disabled={isCreating}
                    className="mt-2"
                    required
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Unique identifier (alphanumeric, hyphens, underscores only)
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
                    disabled={isCreating}
                    className="mt-2"
                    required
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Number of verification codes to generate
                  </p>
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
                  disabled={isCreating}
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
                  disabled={isCreating}
                  className="mt-2"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  type="text"
                  placeholder="e.g., Brussels, Belgium"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={isCreating}
                  className="mt-2"
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
                      <li>• You'll receive QR codes to distribute to attendees</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isCreating || !eventId || !eventName || !maxAttendees}
                className="w-full"
                size="lg"
              >
                {isCreating ? (
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

        {isConnected && (
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>Connected as: {address?.slice(0, 6)}...{address?.slice(-4)}</p>
          </div>
        )}
      </div>
    </div>
  );
}
