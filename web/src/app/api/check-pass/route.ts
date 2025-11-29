import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";

const MODUPASS_ABI = [
  "function hasPass(string eventId,address attendee) view returns (bool)",
  "function getPass(string eventId,address attendee) view returns (tuple(bytes32 eventIdHash,address attendee,uint64 issuedAt,bytes32 workflowId,bytes32 receiptHash))",
] as const;

function getConfig() {
  const rpcUrl = process.env.MODUPASS_RPC_URL;
  const contractAddress = process.env.MODUPASS_CONTRACT_ADDRESS;

  if (!rpcUrl || !contractAddress) {
    throw new Error("Missing MODUPASS_RPC_URL or MODUPASS_CONTRACT_ADDRESS env vars");
  }

  return { rpcUrl, contractAddress };
}

interface CheckPassResponseBody {
  ok: boolean;
  hasPass: boolean;
  issuedAt?: string;
  workflowId?: string;
  error?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse<CheckPassResponseBody>> {
  try {
    const { rpcUrl, contractAddress } = getConfig();
    const body = (await req.json()) as {
      eventId?: string;
      attendeeAddress?: string;
    };

    const eventId = body.eventId?.trim();
    const attendeeAddress = body.attendeeAddress?.trim();

    if (!eventId || !attendeeAddress) {
      return NextResponse.json(
        { ok: false, hasPass: false, error: "eventId and attendeeAddress are required" },
        { status: 400 },
      );
    }

    if (!ethers.isAddress(attendeeAddress)) {
      return NextResponse.json(
        { ok: false, hasPass: false, error: "attendeeAddress must be a valid EVM address" },
        { status: 400 },
      );
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(contractAddress, MODUPASS_ABI, provider);

    const hasPass: boolean = await contract.hasPass(eventId, attendeeAddress);

    if (!hasPass) {
      return NextResponse.json({ ok: true, hasPass: false }, { status: 200 });
    }

    const pass = await contract.getPass(eventId, attendeeAddress);

    const issuedAtSeconds: bigint = pass.issuedAt as bigint;
    const issuedAtIso = new Date(Number(issuedAtSeconds) * 1000).toISOString();

    let workflowId: string | undefined;
    try {
      workflowId = ethers.decodeBytes32String(pass.workflowId as string);
    } catch {
      workflowId = undefined;
    }

    return NextResponse.json(
      {
        ok: true,
        hasPass: true,
        issuedAt: issuedAtIso,
        workflowId,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("check-pass error", error);
    const message =
      error instanceof Error ? error.message : "Unexpected error while checking pass";
    return NextResponse.json({ ok: false, hasPass: false, error: message }, { status: 500 });
  }
}
