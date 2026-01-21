/**
 * KRNL Studio Client
 * Wrapper for interacting with KRNL Studio workflows
 */

import { createHash } from "crypto";

export interface KRNLWorkflowInput {
  eventId: string;
  attendeeAddress: string;
  claimData?: Record<string, unknown>;
}

export interface KRNLAuthData {
  user: string;
  nonce: number;
  timestamp: number;
  workflowId: string;
  receiptHash: string;
  signature: string;
}

export interface KRNLWorkflowResult {
  success: boolean;
  authData?: KRNLAuthData;
  error?: string;
  metadata?: Record<string, unknown>;
}

/**
 * KRNL Studio Client Configuration
 */
export interface KRNLClientConfig {
  workflowId: string;
  apiKey: string;
  apiEndpoint: string;
}

/**
 * KRNL Studio Client
 * 
 * For MVP, this simulates KRNL workflow execution.
 * In production, this would make actual API calls to KRNL Studio.
 */
export class KRNLClient {
  private config: KRNLClientConfig;

  constructor(config: KRNLClientConfig) {
    if (!config.apiKey || !config.apiEndpoint) {
      throw new Error("KRNL API key and endpoint are required for real KRNL integration");
    }
    this.config = config;
  }

  /**
   * Execute KRNL workflow
   * 
   * @param input Workflow input parameters
   * @returns KRNL authentication data for on-chain submission
   */
  async executeWorkflow(input: KRNLWorkflowInput): Promise<KRNLWorkflowResult> {
    try {
      // Production: Call real KRNL API
      return await this.executeRealKRNLWorkflow(input);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Execute real KRNL Studio workflow via API
   */
  private async executeRealKRNLWorkflow(
    input: KRNLWorkflowInput
  ): Promise<KRNLWorkflowResult> {
    const endpoint = this.config.apiEndpoint!;
    const apiKey = this.config.apiKey!;

    console.log('[KRNL Client] Calling KRNL Studio API:', endpoint);

    const response = await fetch(`${endpoint}/workflows/${this.config.workflowId}/execute`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventId: input.eventId,
        attendeeAddress: input.attendeeAddress,
        claimData: input.claimData,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`KRNL API error (${response.status}): ${errorText}`);
    }

    const result = await response.json();

    // Map KRNL API response to our AuthData format
    // Note: Adjust this based on actual KRNL API response structure
    return {
      success: true,
      authData: {
        user: result.authData?.user || input.attendeeAddress,
        nonce: result.authData?.nonce || Date.now(),
        timestamp: result.authData?.timestamp || Math.floor(Date.now() / 1000),
        workflowId: result.authData?.workflowId || this.hashString(this.config.workflowId),
        receiptHash: result.authData?.receiptHash || result.receiptHash,
        signature: result.authData?.signature || result.signature || "0x",
      },
      metadata: {
        processedAt: new Date().toISOString(),
        workflowId: this.config.workflowId,
        mode: 'production',
        krnlResponse: result,
      },
    };
  }


  /**
   * Verify KRNL proof
   * Calls KRNL API to verify the proof
   */
  async verifyProof(authData: KRNLAuthData): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.apiEndpoint}/workflows/${this.config.workflowId}/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(authData),
      });

      if (!response.ok) {
        console.error(`KRNL verification failed: ${response.status}`);
        return false;
      }

      const result = await response.json();
      return result.valid === true;
    } catch (error) {
      console.error('Error verifying proof:', error);
      return false;
    }
  }

  /**
   * Helper: Hash a string to bytes32 format
   */
  private hashString(str: string): string {
    const hash = createHash("sha256").update(str).digest("hex");
    return "0x" + hash;
  }

  /**
   * Helper: Hash an object to bytes32 format
   */
  private hashObject(obj: Record<string, unknown>): string {
    const hash = createHash("sha256")
      .update(JSON.stringify(obj))
      .digest("hex");
    return "0x" + hash;
  }

  /**
   * Get workflow configuration
   */
  getConfig(): KRNLClientConfig {
    return { ...this.config };
  }
}

/**
 * Create a KRNL client instance
 */
export function createKRNLClient(config: KRNLClientConfig): KRNLClient {
  return new KRNLClient(config);
}