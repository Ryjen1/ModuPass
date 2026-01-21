/**
 * KRNL Studio Client
 * Wrapper for interacting with KRNL Studio workflows
 */

import { createHash } from "crypto";
import { getKernelConfig } from "./config";

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

  constructor(config?: Partial<KRNLClientConfig>) {
    const kernelConfig = getKernelConfig();
    this.config = {
      workflowId: config?.workflowId || "modupass-workflow",
      apiKey: config?.apiKey || kernelConfig.KRNL_API_KEY,
      apiEndpoint: config?.apiEndpoint || kernelConfig.KRNL_API_ENDPOINT,
    };

    if (!this.config.apiKey || !this.config.apiEndpoint) {
      console.warn("⚠️  KRNL API credentials not found. Running in DEVELOPMENT mode with mock responses.");
      console.warn("Set KRNL_API_KEY and KRNL_API_ENDPOINT environment variables for production.");
    }
  }

  /**
   * Execute KRNL workflow
   * 
   * @param input Workflow input parameters
   * @returns KRNL authentication data for on-chain submission
   */
  async executeWorkflow(input: KRNLWorkflowInput): Promise<KRNLWorkflowResult> {
    try {
      // Check if we have real API credentials
      if (this.config.apiKey && this.config.apiEndpoint) {
        // Production: Call real KRNL API
        return await this.executeRealKRNLWorkflow(input);
      } else {
        // Development: Fall back to mock for localhost testing
        console.log('[KRNL Client] Running in DEVELOPMENT mode - using mock responses');
        const authData = await this.simulateKRNLWorkflow(input);

        return {
          success: true,
          authData,
          metadata: {
            processedAt: new Date().toISOString(),
            workflowId: this.config.workflowId,
            mode: 'development-mock',
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
   * Simulate KRNL workflow execution (for development only)
   */
  private async simulateKRNLWorkflow(
    input: KRNLWorkflowInput
  ): Promise<KRNLAuthData> {
    // Generate unique nonce
    const nonce = Date.now();

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
    // For development, we use empty signature
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
   * Calls KRNL API to verify the proof, or uses mock verification in development
   */
  async verifyProof(authData: KRNLAuthData): Promise<boolean> {
    if (this.config.apiKey && this.config.apiEndpoint) {
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
    } else {
      // Development mode: basic validation
      if (!authData.user || !authData.workflowId || !authData.receiptHash) {
        return false;
      }

      // Check timestamp is recent (within 1 hour)
      const now = Math.floor(Date.now() / 1000);
      if (now > authData.timestamp + 3600) {
        return false;
      }

      return true;
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
export function createKRNLClient(config?: Partial<KRNLClientConfig>): KRNLClient {
  return new KRNLClient(config);
}