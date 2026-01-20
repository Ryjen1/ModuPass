"use client";

import { useState, Suspense } from "react";
import { useAccount } from "wagmi";
import { useKRNL, WorkflowStatusCode } from '@krnl-dev/sdk-react-7702';
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Loader2, CheckCircle2, AlertCircle, QrCode } from "lucide-react";
import { toast } from "sonner";
import { usePrivy } from "@privy-io/react-auth";
import { validateWorkflowConfig } from "@/lib/krnl-workflows";
import { verifyAttendanceWorkflowDSL } from "@/lib/krnl-workflows-dsl";
import { useKRNLWorkflow } from "@/lib/hooks";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";

function VerifyPageContent() {
    const searchParams = useSearchParams();
    const { address: wagmiAddress, isConnected: isWagmiConnected } = useAccount();
    const { authenticated, user } = usePrivy();

    // Robust connection using Privy as source of truth
    const isConnected = authenticated || isWagmiConnected;
    const address = wagmiAddress || user?.wallet?.address;

    const { writeContractAsync } = useWriteContract();

    const [eventId, setEventId] = useState(searchParams.get("event") || searchParams.get("eventId") || "");
    const [verificationCode, setVerificationCode] = useState(searchParams.get("code") || "");
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationComplete, setVerificationComplete] = useState<{
        eventId: string;
        txHash: string;
        proofHash: string;
    } | null>(null);

    const { 
        isAuthorized,
        enableSmartAccount
    } = useKRNL();
    
    const {
        runWorkflow,
        statusCode,
        error: krnlError,
        resetSteps
    } = useKRNLWorkflow();

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isConnected || !address) {
            toast.error("Please connect your wallet first");
            return;
        }

        if (!CONTRACT_ADDRESS) {
            toast.error("Contract address not configured");
            return;
        }

        // Validate KRNL configuration
        const configValidation = validateWorkflowConfig();
        if (!configValidation.valid) {
            toast.error(
                `Missing KRNL configuration: ${configValidation.missing.join(', ')}. ` +
                `Please check your environment variables.`
            );
            return;
        }

        if (!eventId || !verificationCode) {
            toast.error("Please provide both event ID and verification code");
            return;
        }

        setIsVerifying(true);

        try {
            // Step 1: Ensure account is authorized for KRNL
            if (!isAuthorized) {
                toast.info("Authorizing KRNL delegated account...");
                
                if (!enableSmartAccount) {
                    throw new Error("KRNL SDK not properly initialized");
                }
                
                const authResult = await enableSmartAccount();
                
                if (!authResult) {
                    throw new Error("Failed to authorize KRNL delegated account");
                }
                
                toast.success("KRNL account authorized!");
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            // Step 2: Create workflow DSL
            toast.info("Preparing KRNL verification workflow...");
            
            const workflowDSL = verifyAttendanceWorkflowDSL({
                contractAddress: CONTRACT_ADDRESS,
                eventId,
                attendeeAddress: address as string,
                code: verificationCode
            });

            console.log("🚀 Executing KRNL verification workflow:", workflowDSL);
            toast.info("Verifying through KRNL Protocol...");

            // Reset workflow steps
            resetSteps();

            // Step 3: Execute workflow using KRNL SDK
            const workflowResult = await runWorkflow(workflowDSL as any);

            console.log("📊 Verification workflow result:", workflowResult);
            console.log("📊 Status code:", statusCode);

            // Check workflow status
            if (statusCode === WorkflowStatusCode.FAILED || 
                statusCode === WorkflowStatusCode.INVALID ||
                statusCode === WorkflowStatusCode.WORKFLOW_NOT_FOUND) {
                const errorMsg = krnlError || "Verification workflow failed";
                throw new Error(`KRNL verification failed: ${errorMsg}`);
            }

            // Extract transaction hash from workflow result
            const txHash = (workflowResult as any)?.transactionHash || 
                           (workflowResult as any)?.hash ||
                           (workflowResult as any)?.txHash;

            if (!txHash) {
                throw new Error("No transaction hash returned from KRNL workflow");
            }

            toast.info("Transaction submitted! Waiting for confirmation...");

            // Wait for confirmation (optional - KRNL handles this)
            // The workflow result should already include confirmation

            // Success!
            setVerificationComplete({
                eventId,
                txHash,
                proofHash: (workflowResult as any)?.proofHash || (workflowResult as any)?.id || "verified"
            });

            toast.success("Attendance verified successfully!");

            // Reset form
            setEventId("");
            setVerificationCode("");

        } catch (error: any) {
            console.error("Verification error:", error);
            console.log(`[DEBUG UI] Failed to verify EventID: '${eventId}' with Code: '${verificationCode}'`);

            // Revert to real error handling
            toast.error(error.message || "Failed to verify attendance");

            // If it's the "No event" error, give a helpful hint
            if (error.message?.includes("No event") || error.data?.message?.includes("No event")) {
                toast.error("Contract says 'No Event'. Check Event ID exactly!");
            }

        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <div className="min-h-screen bg-background py-20">
            <div className="container mx-auto px-6 max-w-2xl">
                <div className="mb-8">
                    <h1 className="heading-lg mb-3">Verify Attendance</h1>
                    <p className="body-md text-muted-foreground">
                        Submit your verification code to prove attendance and receive on-chain credential
                    </p>
                </div>

                {!isConnected ? (
                    <Card className="p-8 text-center">
                        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="heading-sm mb-2">Wallet Not Connected</h3>
                        <p className="text-muted-foreground mb-6">
                            Please connect your wallet to verify attendance
                        </p>
                    </Card>
                ) : verificationComplete ? (
                    <Card className="p-8">
                        <div className="text-center mb-6">
                            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                            <h3 className="heading-md mb-2">Attendance Verified!</h3>
                            <p className="text-muted-foreground">
                                Your attendance has been permanently recorded on the blockchain
                            </p>
                        </div>

                        <div className="space-y-4 bg-muted/30 rounded-lg p-6 mb-6">
                            <div>
                                <Label className="text-sm text-muted-foreground">Event ID</Label>
                                <p className="font-mono text-sm mt-1">{verificationComplete.eventId}</p>
                            </div>
                            <div>
                                <Label className="text-sm text-muted-foreground">Proof Hash</Label>
                                <p className="font-mono text-xs mt-1 break-all">{verificationComplete.proofHash}</p>
                            </div>
                            <div>
                                <Label className="text-sm text-muted-foreground">Transaction Hash</Label>
                                <a
                                    href={`https://sepolia.etherscan.io/tx/${verificationComplete.txHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-mono text-sm text-primary hover:underline block mt-1 break-all"
                                >
                                    {verificationComplete.txHash}
                                </a>
                            </div>
                        </div>

                        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-lg p-4 mb-6">
                            <h4 className="font-medium text-emerald-900 dark:text-emerald-100 mb-2">
                                ✓ What You've Earned
                            </h4>
                            <ul className="text-sm text-emerald-700 dark:text-emerald-300 space-y-1">
                                <li>• Permanent on-chain proof of attendance</li>
                                <li>• Verifiable credential for your portfolio</li>
                                <li>• KRNL-powered cryptographic verification</li>
                                <li>• Immutable record on Sepolia blockchain</li>
                            </ul>
                        </div>

                        <div className="flex gap-3">
                            <Button onClick={() => setVerificationComplete(null)} variant="outline" className="flex-1">
                                Verify Another
                            </Button>
                        </div>
                    </Card>
                ) : (
                    <Card className="p-8">
                        <form onSubmit={handleVerify} className="space-y-6">
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
                                    disabled={isVerifying}
                                    className="mt-2"
                                    required
                                />
                                <p className="text-sm text-muted-foreground mt-2">
                                    The unique identifier for the event you attended
                                </p>
                            </div>

                            <div>
                                <Label htmlFor="code">
                                    Verification Code <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="code"
                                    type="text"
                                    placeholder="e.g., ethcc-2025-day1-A1B2C3D4"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value)}
                                    disabled={isVerifying}
                                    className="mt-2 font-mono"
                                    required
                                />
                                <p className="text-sm text-muted-foreground mt-2">
                                    The code you received from the event organizer
                                </p>
                            </div>

                            <div className="bg-muted/30 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <Shield className="w-5 h-5 text-primary mt-0.5" />
                                    <div>
                                        <h4 className="font-medium mb-1">How Verification Works</h4>
                                        <ul className="text-sm text-muted-foreground space-y-1">
                                            <li>• Code is validated against event's Merkle tree</li>
                                            <li>• KRNL generates cryptographic proof</li>
                                            <li>• Proof is submitted to smart contract</li>
                                            <li>• Your attendance is recorded on-chain</li>
                                            <li>• Code becomes permanently used</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <QrCode className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                                    <div>
                                        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                                            Got a QR Code?
                                        </h4>
                                        <p className="text-sm text-blue-700 dark:text-blue-300">
                                            If you scanned a QR code, the event ID and code should be pre-filled above.
                                            If not, enter them manually.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={isVerifying || !eventId || !verificationCode}
                                className="w-full"
                                size="lg"
                            >
                                {isVerifying ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Verifying Attendance...
                                    </>
                                ) : (
                                    <>
                                        <Shield className="w-4 h-4 mr-2" />
                                        Verify Attendance
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

export default function VerifyPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background py-20 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        }>
            <VerifyPageContent />
        </Suspense>
    );
}
