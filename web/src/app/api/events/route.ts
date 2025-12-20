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

export async function POST(req: NextRequest) {
  try {
    const { rpcUrl, contractAddress, executorKey } = getConfig();
    if (!executorKey) {
      return NextResponse.json(
        { ok: false, error: "MODUPASS_EXECUTOR_PRIVATE_KEY is required to create events" },
        { status: 500 },
      );
    }

    const body = (await req.json()) as {
      id?: string;
      name?: string;
      description?: string;
      startTimeIso?: string | null;
      endTimeIso?: string | null;
    };

    const id = body.id?.trim();
    const name = body.name?.trim() ?? "";
    const description = body.description?.trim() ?? "";

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "id is required" },
        { status: 400 },
      );
    }

    const parseIsoToSeconds = (value: string | null | undefined): bigint => {
      if (!value) return BigInt(0);
      const ms = Date.parse(value);
      if (Number.isNaN(ms)) return BigInt(0);
      return BigInt(Math.floor(ms / 1000));
    };

    const startTime = parseIsoToSeconds(body.startTimeIso ?? null);
    const endTime = parseIsoToSeconds(body.endTimeIso ?? null);

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(executorKey, provider);
    const contract = new ethers.Contract(contractAddress, EVENTS_ABI, wallet);

    const tx = await contract.createOrUpdateEvent(id, name, description, startTime, endTime);
    const receipt = await tx.wait();

    return NextResponse.json({ ok: true, txHash: receipt.hash }, { status: 200 });
  } catch (error: unknown) {
    console.error("events POST error", error);
    const message =
      error instanceof Error ? error.message : "Unexpected error while creating/updating event";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
