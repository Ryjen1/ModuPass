"use client";

import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Download, ExternalLink, Loader2, Wallet as WalletIcon, Share } from "lucide-react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { toast } from "sonner";
import Link from "next/link";
import { publicClient, CONTRACT_ADDRESS } from '@/lib/viem-client';
import abi from '@/lib/ModuPassTargetBase.json';

interface Pass {
  eventId: string;
  eventName: string;
  tokenId: string;
  timestamp: string;
}

export default function MyPasses() {
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [passes, setPasses] = useState<Pass[]>([]);
  const [loading, setLoading] = useState(false);
  const [transferTo, setTransferTo] = useState('');
  const [transferTokenId, setTransferTokenId] = useState('');

  const { writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function fetchPasses() {
      setLoading(true);
      try {
        const tokenIds = await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi,
          functionName: 'getTokensByOwner',
          args: [address]
        }) as bigint[];

        const passesData: Pass[] = [];
        for (const tokenId of tokenIds) {
          const details = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi,
            functionName: 'getTokenDetails',
            args: [tokenId]
          }) as [string, `0x${string}`, bigint];

          const eventData = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi,
            functionName: 'getEvent',
            args: [details[0]]
          }) as any; // Assuming Event struct

          passesData.push({
            eventId: details[0],
            eventName: eventData.eventName,
            tokenId: tokenId.toString(),
            timestamp: new Date(Number(details[2]) * 1000).toISOString()
          });
        }
        setPasses(passesData);
      } catch (error) {
        console.error('Error fetching passes:', error);
        toast.error('Failed to load passes');
      } finally {
        setLoading(false);
      }
    }

    if (mounted && isConnected && address) {
      fetchPasses();
    }
  }, [mounted, isConnected, address]);

  const handleTransfer = async (tokenId: string) => {
    if (!transferTo) {
      toast.error('Please enter recipient address');
      return;
    }
    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: 'transferPass',
        args: [transferTo as `0x${string}`, BigInt(tokenId)]
      });
      toast.success('Transfer initiated');
      setTransferTo('');
      setTransferTokenId('');
    } catch (error) {
      toast.error('Transfer failed');
    }
  };

  if (!mounted || !isConnected) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              My <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">Passes</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8">Your verified attendance proofs and event credentials</p>

            <Card className="p-12 text-center">
              <WalletIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
              <p className="text-muted-foreground mb-6">
                Connect your wallet to view your on-chain attendance passes
              </p>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            My <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">Passes</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8">Your verified attendance proofs and event credentials</p>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : passes.length === 0 ? (
            <Card className="p-12 text-center">
              <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No passes yet</h3>
              <p className="text-muted-foreground mb-6">
                Attend events to collect verified on-chain passes
              </p>
              <Link href="/events">
                <Button className="bg-gradient-to-r from-primary to-emerald-400 hover:opacity-90 transition">
                  Explore Events
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {passes.map((pass) => (
                <Card key={pass.tokenId} className="overflow-hidden group hover:shadow-lg transition">
                  <div className="h-40 bg-gradient-to-br from-primary/20 to-emerald-500/20 relative">
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-accent">Verified</Badge>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold mb-1">{pass.eventName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(pass.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                      <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                      <span>Token #{pass.tokenId}</span>
                      <span>•</span>
                      <span>Ethereum Sepolia</span>
                    </div>
                    <div className="flex gap-2 mb-4">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                      <a
                        href={`https://sepolia.etherscan.io/nft/${CONTRACT_ADDRESS}/${pass.tokenId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1"
                      >
                        <Button variant="outline" size="sm" className="w-full">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </a>
                    </div>
                    {transferTokenId === pass.tokenId && (
                      <div className="flex gap-2 mb-4">
                        <Input
                          placeholder="Recipient address"
                          value={transferTo}
                          onChange={(e) => setTransferTo(e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleTransfer(pass.tokenId)}
                          disabled={isPending || isConfirming}
                        >
                          {isPending || isConfirming ? <Loader2 className="h-3 w-3 animate-spin" /> : <Share className="h-3 w-3 mr-1" />}
                          Transfer
                        </Button>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTransferTokenId(transferTokenId === pass.tokenId ? '' : pass.tokenId)}
                      className="w-full"
                    >
                      <Share className="h-3 w-3 mr-1" />
                      {transferTokenId === pass.tokenId ? 'Cancel Transfer' : 'Transfer Pass'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {isConnected && (
            <Card className="mt-8 p-6 bg-accent/50">
              <div className="flex items-start gap-4">
                <Shield className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold mb-2">Your Passes are On-Chain</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    All your attendance passes are stored as NFTs on Ethereum Sepolia. 
                    They are permanently verifiable and owned by your wallet.
                  </p>
                  <a
                    href={`https://sepolia.etherscan.io/address/${address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                  >
                    View on Etherscan
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}