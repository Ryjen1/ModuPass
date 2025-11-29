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
  apiKey?: string;
  apiEndpoint?: string;
}

/**
 * KRNL Studio Client
 * 
 * For MVP, this simulates KRNL workflow execution.
 * In production, this would make actual API calls to KRNL Studio.
 */
export class KRNLClient {
  private config: KRNLClientConfig;
  private nonceCounter: number = 0;

  constructor(config: KRNLClientConfig) {
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
      // Check if we should use real KRNL API or mock mode
      const useRealAPI = this.config.apiEndpoint && this.config.apiKey;

      if (useRealAPI) {
        // Production: Call real KRNL Studio API
        return await this.executeRealKRNLWorkflow(input);
      } else {
        // Development/Testing: Simulate KRNL workflow execution
        console.log('[KRNL Client] Running in MOCK mode - using simulated workflow');
        const authData = await this.simulateKRNLWorkflow(input);

        return {
          success: true,
          authData,
          metadata: {
            processedAt: new Date().toISOString(),
            workflowId: this.config.workflowId,
            mode: 'mock',
          },
        };
      }
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
   * Simulate KRNL workflow execution
   * This generates valid AuthData that matches the smart contract expectations
   * 
   * In production, KRNL Studio would:
   * 1. Run eligibility checks
   * 2. Generate cryptographic proof
   * 3. Sign the result
   * 4. Return AuthData
   */
  private async simulateKRNLWorkflow(
    input: KRNLWorkflowInput
  ): Promise<KRNLAuthData> {
    // Generate unique nonce
    const nonce = ++this.nonceCounter + Date.now();

    // Current timestamp
    const timestamp = Math.floor(Date.now() / 1000);

    // Generate workflow ID hash
    const workflowId = this.hashString(this.config.workflowId);

    // Generate receipt hash (deterministic based on input)
    const receipt = {
      version: "1.0.0",
      eventId: input.eventId,
      attendeeAddress: input.attendeeAddress.toLowerCase(),
      claimData: input.claimData || {},
      timestamp,
      workflowId: this.config.workflowId,
      nonce,
    };
    const receiptHash = this.hashObject(receipt);

    // In production, KRNL would generate a cryptographic signature
    // For MVP, we use empty signature (contract doesn't verify it yet)
    const signature = "0x";

    return {
      user: input.attendeeAddress,
      nonce,
      timestamp,
      workflowId,
      receiptHash,
      signature,
    };
  }

  /**
   * Verify KRNL proof
   * In production, this would verify the cryptographic signature
   */
  async verifyProof(authData: KRNLAuthData): Promise<boolean> {
    // Basic validation
    if (!authData.user || !authData.workflowId || !authData.receiptHash) {
      return false;
    }

    // Check timestamp is recent (within 1 hour)
    const now = Math.floor(Date.now() / 1000);
    if (now > authData.timestamp + 3600) {
      return false;
    }

    // In production, verify cryptographic signature
    // For MVP, we accept all valid-looking data
    return true;
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