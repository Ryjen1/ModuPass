"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Loader2, CheckCircle2, AlertCircle, Download, QrCode } from "lucide-react";
import { toast } from "sonner";
import { generateVerificationCodes } from "@/lib/services/code-generator";
import { QRCodeCanvas } from "qrcode.react";
import { useKRNLAuth, useKRNLWorkflow } from "@/lib/hooks";
import { createEventWorkflow } from "@/lib/krnl-workflows";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";

interface CreatedEventData {
  eventId: string;
  eventName: string;
  codes: string[];
  merkleRoot: string;
  txHash: string;
}

export default function CreateEventPage() {
  // 1. All Hooks First
  const [mounted, setMounted] = useState(false);
  const { address: wagmiAddress } = useAccount();
  const { ready, authenticated, user, createWallet } = usePrivy();
  const { wallets } = useWallets();

  // KRNL Hooks
  const { authorizeAccount, isAuthorized, hasEmbeddedWallet } = useKRNLAuth();
  const { runWorkflow, error: workflowError } = useKRNLWorkflow();

  // 2. All State Declarations Second
  const [eventId, setEventId] = useState("");
  const [eventName, setEventName] = useState("");
  const [description, setDescription] = useState("");
  const [maxAttendees, setMaxAttendees] = useState("100");
  const [isProcessing, setIsProcessing] = useState(false);
  // This is the variable that was causing ReferenceError - defining it clearly here
  const [createdEvent, setCreatedEvent] = useState<CreatedEventData | null>(null);
  const [showQRCodes, setShowQRCodes] = useState(false);
  const [authorizationError, setAuthorizationError] = useState<string | null>(null);


  // 3. Derived State (Wallet Logic)
  // Robust connection check: Prioritize embedded wallet for KRNL
  const embeddedWallet = wallets.find(w => w.walletClientType === 'privy');
  const activeWallet = embeddedWallet || wallets[0];

  const isConnected = mounted && ready && (authenticated && (!!activeWallet || !!user?.wallet?.address));
  const address = activeWallet?.address || user?.wallet?.address || wagmiAddress;

  // 4. Effects
  useEffect(() => {
    setMounted(true);
  }, []);

  // Debug logging
  useEffect(() => {
    if (!mounted) return;
    console.log("CreateEventPage Connection Debug:", {
      mounted,
      ready,
      authenticated,
      hasEmbeddedWallet,
      embeddedWalletAddress: embeddedWallet?.address,
      activeWalletType: activeWallet?.walletClientType,
      isAuthorized,
      isConnected,
      address
    });
  }, [mounted, ready, authenticated, embeddedWallet, activeWallet, isAuthorized, isConnected, address, hasEmbeddedWallet]);

  // 5. Handlers
  const handleCreateWallet = async () => {
    try {
      setIsProcessing(true);
      const wallet = await createWallet();
      toast.success("Embedded Wallet Created! Please fund it now.");
    } catch (error: any) {
      console.error("Failed to create wallet:", error);
      toast.error(`Failed to create wallet: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected || !address) {
      toast.error("Please connect your wallet first");
      return;
    }

    // WARN: If no embedded wallet, KRNL won't work for EIP-7702
    if (!embeddedWallet) {
      toast.warning("KRNL requires a Privy embedded wallet. Please ensure one is created (re-login if needed).");
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
    setAuthorizationError(null); // Clear previous errors

    try {
      // Step 1: Check and enable KRNL authorization if needed
      if (!isAuthorized) {
        toast.info("Authorizing KRNL account...");
        const success = await authorizeAccount();
        
        if (!success) {
          throw new Error("Failed to authorize KRNL account. Please ensure you have ETH in your wallet.");
        }

        toast.success("KRNL account authorized!");
        // Wait a moment for authorization to propagate
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Step 2: Generate verification codes
      toast.info("Generating verification codes...");
      const { codes, merkleRoot } = await generateVerificationCodes(
        eventId,
        maxAttendeesNum
      );

      // Step 3: Create and execute KRNL workflow
      toast.info("Executing KRNL workflow...");
      const workflowDSL = createEventWorkflow(
        eventId,
        eventName,
        merkleRoot,
        maxAttendeesNum,
        CONTRACT_ADDRESS
      );

      console.log("KRNL Workflow DSL:", workflowDSL);

      // KRNL handles EVERYTHING - contract interaction included!
      const result = await runWorkflow(workflowDSL);
      console.log("KRNL Workflow Result:", result);

      // Get transaction hash from KRNL result
      const txHash = result.transactionHash || result.txHash || "0x_pending_" + Date.now();

      toast.success("Event created successfully!");

      setCreatedEvent({
        eventId,
        eventName,
        codes,
        merkleRoot,
        txHash
      });

      // Reset form
      setEventId("");
      setEventName("");
      setDescription("");
      setMaxAttendees("100");

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

  // 6. Render
  return (
    <div className="min-h-screen bg-background py-20">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="mb-8">
          <h1 className="heading-lg mb-3">Create Event</h1>
          <p className="body-md text-muted-foreground">
            Set up a new event with verification codes and KRNL-powered attendance tracking
          </p>
        </div>

        {!isConnected && !embeddedWallet ? (
          <Card className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="heading-sm mb-2">Wallet Setup Required</h3>

            {authenticated ? (
              <div className="mb-6">
                <p className="text-amber-500 font-medium mb-4">
                  KRNL requires an Embedded Wallet, but you don't have one yet.
                </p>
                <Button
                  onClick={handleCreateWallet}
                  disabled={isProcessing}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isProcessing ? <Loader2 className="animate-spin mr-2" /> : null}
                  Create Embedded Wallet
                </Button>
              </div>
            ) : (
              <p className="text-muted-foreground mb-6">
                Please connect your wallet (MetaMask or Email) to proceed.
              </p>
            )}

            {/* Debug Info */}
            <div className="mt-4 p-4 bg-muted/50 rounded-lg text-left text-xs font-mono">
              <p className="font-bold mb-2">Debug Info:</p>
              <p>mounted: {String(mounted)}</p>
              <p>authenticated: {String(authenticated)}</p>
              <p>hasEmbedded: {embeddedWallet ? 'YES' : 'NO'}</p>
              <p>address: {address || 'none'}</p>
            </div>
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
              <Button onClick={downloadCodes} variant="default" className="w-full bg-emerald-600 hover:bg-emerald-700">
                <Download className="w-4 h-4 mr-2" />
                Download All Codes
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
                  {createdEvent.codes.slice(0, 12).map((code) => (
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

              <Button onClick={() => setCreatedEvent(null)} variant="outline" className="w-full">
                Create Another Event
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="p-8">
            <form onSubmit={handleCreateEvent} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="eventId">Event ID *</Label>
                  <Input
                    id="eventId"
                    placeholder="e.g., ethcc-2025"
                    value={eventId}
                    onChange={(e) => setEventId(e.target.value)}
                    disabled={isProcessing}
                    required
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="maxAttendees">Max Attendees *</Label>
                  <Input
                    id="maxAttendees"
                    type="number"
                    value={maxAttendees}
                    onChange={(e) => setMaxAttendees(e.target.value)}
                    disabled={isProcessing}
                    required
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="eventName">Event Name *</Label>
                <Input
                  id="eventName"
                  placeholder="e.g., EthCC 2025"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  disabled={isProcessing}
                  required
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Event details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isProcessing}
                  className="mt-2"
                />
              </div>

              <div className="bg-muted/30 rounded-lg p-4">
                <h4 className="font-medium mb-1 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-primary" />
                  Important Info
                </h4>
                <p className="text-sm text-muted-foreground">
                  KRNL requires ETH in your <strong>Embedded Wallet</strong> (not just MetaMask).
                  <br />
                  Check the console (F12) for your Embedded Wallet address and fund it.
                </p>
              </div>

              <Button
                type="submit"
                disabled={isProcessing || !eventId || !eventName}
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
