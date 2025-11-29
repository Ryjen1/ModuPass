import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { createKRNLClient } from "kernel";
import type { KRNLWorkflowInput } from "kernel";

const MODUPASS_ABI = [
  "function issuePass(tuple(address user, uint256 nonce, uint256 timestamp, bytes32 workflowId, bytes32 receiptHash, bytes signature) authData, string eventId, address attendee) returns (uint256)",
  "function hasPass(string eventId, address attendee) view returns (bool)",
] as const;

function getConfig() {
  const rpcUrl = process.env.MODUPASS_RPC_URL;
  const contractAddress = process.env.MODUPASS_CONTRACT_ADDRESS;
  const executorKey = process.env.MODUPASS_EXECUTOR_PRIVATE_KEY;
  const krnlWorkflowId = process.env.KRNL_WORKFLOW_ID || "modupass-production-v1";

  if (!rpcUrl || !contractAddress || !executorKey) {
    throw new Error(
      "Missing required environment variables: MODUPASS_RPC_URL, MODUPASS_CONTRACT_ADDRESS, or MODUPASS_EXECUTOR_PRIVATE_KEY"
    );
  }

  return { rpcUrl, contractAddress, executorKey, krnlWorkflowId };
}

export async function POST(req: NextRequest) {
  try {
    const { rpcUrl, contractAddress, executorKey, krnlWorkflowId } = getConfig();

    // Parse request body
    const body = (await req.json()) as {
      eventId?: string;
      attendeeAddress?: string;
      claimData?: Record<string, unknown>;
    };

    const eventId = body.eventId?.trim();
    const attendeeAddress = body.attendeeAddress?.trim();

    // Validate inputs
    if (!eventId) {
      return NextResponse.json(
        { ok: false, error: "eventId is required" },
        { status: 400 }
      );
    }

    if (!attendeeAddress || !ethers.isAddress(attendeeAddress)) {
      return NextResponse.json(
        { ok: false, error: "Valid attendeeAddress is required" },
        { status: 400 }
      );
    }

    // Check if pass already exists
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(contractAddress, MODUPASS_ABI, provider);
    
    const hasExistingPass = await contract.hasPass(eventId, attendeeAddress);
    if (hasExistingPass) {
      return NextResponse.json(
        { ok: false, error: "Pass already issued for this event and attendee" },
        { status: 409 }
      );
    }

    // Execute KRNL workflow
    const krnlClient = createKRNLClient({
      workflowId: krnlWorkflowId,
    });

    const workflowInput: KRNLWorkflowInput = {
      eventId,
      attendeeAddress,
      claimData: body.claimData,
    };

    const workflowResult = await krnlClient.executeWorkflow(workflowInput);

    if (!workflowResult.success || !workflowResult.authData) {
      return NextResponse.json(
        {
          ok: false,
          error: workflowResult.error || "KRNL workflow execution failed",
        },
        { status: 500 }
      );
    }

    // Submit transaction to blockchain
    const wallet = new ethers.Wallet(executorKey, provider);
    const contractWithSigner = new ethers.Contract(
      contractAddress,
      MODUPASS_ABI,
      wallet
    );

    const authData = {
      user: workflowResult.authData.user,
      nonce: workflowResult.authData.nonce,
      timestamp: workflowResult.authData.timestamp,
      workflowId: workflowResult.authData.workflowId,
      receiptHash: workflowResult.authData.receiptHash,
      signature: workflowResult.authData.signature || "0x",
    };

    const tx = await contractWithSigner.issuePass(
      authData,
      eventId,
      attendeeAddress
    );

    const receipt = await tx.wait();

    // Extract tokenId from events
    let tokenId: string | undefined;
    for (const log of receipt.logs) {
      try {
        const parsed = contractWithSigner.interface.parseLog(log as any);
        if (parsed?.name === "PassIssued") {
          tokenId = parsed.args.tokenId?.toString();
          break;
        }
      } catch {
        // Skip logs that don't match our ABI
      }
    }

    return NextResponse.json(
      {
        ok: true,
        txHash: receipt.hash,
        tokenId,
        authData: workflowResult.authData,
        metadata: workflowResult.metadata,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("issue-pass POST error", error);
    
    let errorMessage = "Unexpected error while issuing pass";
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Handle specific error cases
      if (errorMessage.includes("PassAlreadyIssued")) {
        errorMessage = "Pass already issued for this event and attendee";
        statusCode = 409;
      } else if (errorMessage.includes("NonceAlreadyUsed")) {
        errorMessage = "Nonce already used. Please try again.";
        statusCode = 400;
      } else if (errorMessage.includes("TimestampExpired")) {
        errorMessage = "Request expired. Please try again.";
        statusCode = 400;
      } else if (errorMessage.includes("insufficient funds")) {
        errorMessage = "Insufficient funds for transaction";
        statusCode = 500;
      }
    }

    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: statusCode }
    );
  }
}
