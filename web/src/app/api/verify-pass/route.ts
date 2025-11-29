import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";

const MODUPASS_ABI = [
  "function hasPass(string eventId, address attendee) view returns (bool)",
  "function getPass(string eventId, address attendee) view returns (tuple(bytes32 eventIdHash, address attendee, uint64 issuedAt, bytes32 workflowId, bytes32 receiptHash, uint256 tokenId))",
] as const;

const PASS_TOKEN_ABI = [
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
] as const;

function getConfig() {
  const rpcUrl = process.env.MODUPASS_RPC_URL;
  const contractAddress = process.env.MODUPASS_CONTRACT_ADDRESS;
  const passTokenAddress = process.env.PASS_TOKEN_CONTRACT_ADDRESS;

  if (!rpcUrl || !contractAddress) {
    throw new Error("Missing MODUPASS_RPC_URL or MODUPASS_CONTRACT_ADDRESS env vars");
  }

  return { rpcUrl, contractAddress, passTokenAddress };
}

export async function GET(req: NextRequest) {
  try {
    const { rpcUrl, contractAddress, passTokenAddress } = getConfig();
    
    const searchParams = req.nextUrl.searchParams;
    const eventId = searchParams.get("eventId");
    const attendee = searchParams.get("attendee");

    if (!eventId || !attendee) {
      return NextResponse.json(
        { ok: false, error: "eventId and attendee query parameters are required" },
        { status: 400 }
      );
    }

    if (!ethers.isAddress(attendee)) {
      return NextResponse.json(
        { ok: false, error: "attendee must be a valid Ethereum address" },
        { status: 400 }
      );
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(contractAddress, MODUPASS_ABI, provider);

    // Check if pass exists
    const hasPass = await contract.hasPass(eventId, attendee);

    if (!hasPass) {
      return NextResponse.json(
        {
          ok: true,
          verified: false,
          message: "No pass found for this event and attendee",
        },
        { status: 200 }
      );
    }

    // Get full pass details
    const pass = await contract.getPass(eventId, attendee);

    // Get NFT details if PassToken contract is configured
    let nftDetails = null;
    if (passTokenAddress && pass.tokenId !== undefined) {
      try {
        const passTokenContract = new ethers.Contract(
          passTokenAddress,
          PASS_TOKEN_ABI,
          provider
        );
        
        const owner = await passTokenContract.ownerOf(pass.tokenId);
        const tokenURI = await passTokenContract.tokenURI(pass.tokenId);

        nftDetails = {
          tokenId: pass.tokenId.toString(),
          owner,
          tokenURI,
        };
      } catch (error) {
        console.warn("Failed to fetch NFT details:", error);
      }
    }

    return NextResponse.json(
      {
        ok: true,
        verified: true,
        pass: {
          eventId,
          attendee: pass.attendee,
          issuedAt: new Date(Number(pass.issuedAt) * 1000).toISOString(),
          workflowId: pass.workflowId,
          receiptHash: pass.receiptHash,
          tokenId: pass.tokenId?.toString(),
        },
        nft: nftDetails,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("verify-pass GET error", error);
    const message =
      error instanceof Error ? error.message : "Unexpected error while verifying pass";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}