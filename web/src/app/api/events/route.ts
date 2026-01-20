import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";

const EVENTS_ABI = [
  "function createOrUpdateEvent(string id,string name,string description,uint64 startTime,uint64 endTime)",
  "function listEvents() view returns (tuple(string id,string name,string description,uint64 startTime,uint64 endTime,address organizer,uint64 createdAt)[])",
] as const;

function getConfig() {
  const rpcUrl = process.env.MODUPASS_RPC_URL;
  const contractAddress = process.env.MODUPASS_EVENTS_CONTRACT_ADDRESS;
  const executorKey = process.env.MODUPASS_EXECUTOR_PRIVATE_KEY;

  if (!rpcUrl || !contractAddress) {
    throw new Error("Missing MODUPASS_RPC_URL or MODUPASS_EVENTS_CONTRACT_ADDRESS env vars");
  }

  return { rpcUrl, contractAddress, executorKey };
}

export async function GET() {
  try {
    const { rpcUrl, contractAddress } = getConfig();
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(contractAddress, EVENTS_ABI, provider);

    const rawEvents = await contract.listEvents();

    const events = (rawEvents as any[]).map((e) => {
      const start = e.startTime as bigint;
      const end = e.endTime as bigint;
      const created = e.createdAt as bigint;

      const toIso = (value: bigint) =>
        value === BigInt(0) ? null : new Date(Number(value) * 1000).toISOString();

      return {
        id: e.id as string,
        name: e.name as string,
        description: e.description as string,
        startTime: toIso(start),
        endTime: toIso(end),
        createdAt: toIso(created),
        organizer: e.organizer as string,
      };
    });

    return NextResponse.json({ ok: true, events }, { status: 200 });
  } catch (error: unknown) {
    console.error("events GET error", error);
    const message =
      error instanceof Error ? error.message : "Unexpected error while listing events";
    return NextResponse.json({ ok: false, events: [], error: message }, { status: 500 });
  }
}

// POST method removed to enforce KRNL workflow execution for state changes.
// Events should be created client-side using useKRNLWorkflow and the "create" workflow.
export async function POST() {
  return NextResponse.json(
    { ok: false, error: "Event creation via API is disabled. Use KRNL SDK in frontend." },
    { status: 405 }
  );
}
