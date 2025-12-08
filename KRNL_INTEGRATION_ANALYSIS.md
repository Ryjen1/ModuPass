# KRNL Integration Analysis & Action Plan
**ModuPass Project**  
*Analysis Date: December 7, 2025*

---

## 📊 Executive Summary

**Integration Status**: ~60% Complete  
**Smart Contracts**: ✅ Excellent (90% complete)  
**Backend Services**: ⚠️ Partial (40% complete)  
**Frontend Integration**: ❌ Not Started (10% complete)  

**Critical Path**: Need to switch from Reown/WalletConnect to Privy + KRNL SDK integration

---

## ✅ What You've Accomplished

### 1. Smart Contract Implementation (Excellent ✨)

#### TargetBase.sol
Your `TargetBase.sol` implementation is **production-ready** and follows KRNL specifications perfectly:

**✅ Core Features Implemented:**
- **Master Key Authorization**: Cryptographic signature verification using ECDSA
- **Smart Account Enforcement**: `extcodehash` validation for DelegatedAccount
- **Replay Protection**: 
  - Sequential nonces per user
  - Authorization hash tracking (`usedAuthorizations` mapping)
- **Temporal Validation**: Expiry timestamp checks
- **Emergency Recovery**: Recovery key for master key rotation
- **Nonce Reset**: Owner can reset stuck accounts

**✅ Authorization Flow:**
```solidity
modifier requireAuth(AuthData calldata authData) {
    _verifyAuthorization(authData);
    _;
}
```

The `_verifyAuthorization` function implements all 8 required steps:
1. Implementation check (DelegatedAccount validation)
2. Nonce check
3. Expiry check
4. Hash generation
5. Replay check
6. Signature verification
7. State update
8. Event emission

#### ModuPassTargetBase.sol
Your domain-specific contract extends TargetBase correctly:

**✅ Proper Structure:**
- `AuthData` as first parameter in protected functions ✓
- Uses `requireAuth` modifier correctly ✓
- Decodes `authData.result` properly ✓
- Domain-specific validation after authorization ✓

**✅ Functions:**
```solidity
function createEvent(AuthData calldata authData) external requireAuth(authData)
function verifyAttendance(AuthData calldata authData) external requireAuth(authData)
```

**✅ Data Structures:**
- `Event` struct with Merkle root storage
- `AttendanceData` struct matching KRNL workflow output
- Proper mappings for event and attendance tracking

### 2. Backend Services (Partial Implementation)

**✅ What Exists:**
- `krnl-service.ts`: Service layer structure
- `/api/krnl/verify/route.ts`: Mock KRNL Node simulator
- `modupass-workflow.json`: Workflow definition
- `workflow-client.ts`: Client utilities

**✅ Good Patterns:**
- Merkle proof verification logic
- AuthData structure definition
- Validation functions

### 3. Dependencies Installed

**✅ Key Packages:**
```json
{
  "@krnl-dev/sdk-react-7702": "^0.1.4",
  "@privy-io/react-auth": "^3.8.0",
  "@privy-io/wagmi": "^2.0.3",
  "wagmi": "^2.19.4",
  "viem": "^2.39.0"
}
```

---

## ❌ Critical Issues to Address

### 🔴 Issue #1: KRNL SDK Not Integrated

**Problem**: You have `@krnl-dev/sdk-react-7702` installed but it's **completely unused**.

**Current State** (`web/src/app/web3-provider.tsx`):
```typescript
// ❌ Using Reown/WalletConnect only
<WagmiProvider config={wagmiAdapter.wagmiConfig}>
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
</WagmiProvider>
```

**Required State**:
```typescript
// ✅ Must use Privy + KRNL
<PrivyProvider appId="your-privy-app-id">
  <KRNLProvider config={krnlConfig}>
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  </KRNLProvider>
</PrivyProvider>
```

**Why This Matters**:
- KRNL requires Privy for EIP-7702 support
- EIP-7702 enables temporary account delegation
- Without this, smart account features won't work

---

### 🔴 Issue #2: Missing Privy Configuration

**Problem**: Privy is installed but never configured.

**What's Needed**:
1. Sign up at [privy.io](https://privy.io)
2. Create new app
3. Enable embedded wallets
4. Configure for Sepolia testnet
5. Get App ID

**Environment Variable**:
```bash
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id_here
```

**Why Privy is Required**:
> "Privy is currently one of the few wallet providers that fully supports EIP-7702 account abstraction, which is essential for KRNL Protocol's delegated account functionality."
> 
> — KRNL SDK Documentation

---

### 🔴 Issue #3: No KRNL Configuration

**Problem**: No KRNL config object exists.

**What's Missing** (`web/src/lib/krnl-config.ts`):
```typescript
import { createConfig } from '@krnl-dev/sdk-react-7702';
import { sepolia } from 'viem/chains';

export const krnlConfig = createConfig({
  chain: sepolia,
  delegatedContractAddress: process.env.NEXT_PUBLIC_DELEGATED_ACCOUNT_ADDRESS!,
  privyAppId: process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  krnlNodeUrl: 'https://v0-1-0.node.lat/',
  // rpcUrl is optional – uses KRNL-optimized Privy RPC if not provided
});
```

**Required Environment Variables**:
```bash
NEXT_PUBLIC_DELEGATED_ACCOUNT_ADDRESS=0x... # From KRNL deployment
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
NEXT_PUBLIC_KRNL_NODE_URL=https://v0-1-0.node.lat/
```

---

### 🔴 Issue #4: Delegated Account Contract Not Deployed

**Problem**: KRNL requires a specific DelegatedAccount contract to be deployed.

**What You Need**:
1. KRNL's DelegatedAccount contract bytecode
2. Deploy to Sepolia
3. Get contract address
4. Get contract code hash (using `extcodehash`)

**Update Your Constructor**:
```solidity
constructor() TargetBase(
  0x..., // masterKey - KRNL master key address
  0x..., // recoveryKey - Your recovery address
  0x...  // delegatedAccountCodeHash - From deployed contract
) {}
```

**Current State**:
```solidity
// contracts/contracts/ModuPassTargetBase.sol:64-68
constructor(
    address _masterKey,
    address _recoveryKey,
    bytes32 _delegatedAccountCodeHash
) TargetBase(_masterKey, _recoveryKey, _delegatedAccountCodeHash) {}
```

You have the structure, but need the actual values.

---

### 🔴 Issue #5: Workflow Not in KRNL Studio

**Problem**: Your `modupass-workflow.json` exists locally but hasn't been uploaded to KRNL Studio.

**Current Workflow** (local only):
```json
{
  "name": "ModuPass Attendance Verification",
  "description": "Verifies Merkle proof for event attendance codes off-chain",
  "version": "1.0.0",
  "network": "sepolia",
  "logic": {
    "type": "merkle_verification",
    "steps": [...]
  }
}
```

**What You Need to Do**:
1. Go to [studio.krnl.xyz](https://studio.krnl.xyz)
2. Click "Start Building"
3. Configure workflow with these steps:

#### Step 1: Get Merkle Proof
```javascript
{
  "name": "get-merkle-proof",
  "type": "HTTP GET",
  "url": "https://your-api.com/merkle-proof?eventId=${eventId}&code=${code}",
  "outputs": {
    "proof": "response.body.proof",
    "root": "response.body.root"
  }
}
```

#### Step 2: Verify Merkle Proof
```javascript
{
  "name": "verify-merkle",
  "type": "merkle_verification",
  "inputs": {
    "leaf": "${keccak256(code)}",
    "proof": "${get-merkle-proof.proof}",
    "root": "${get-merkle-proof.root}"
  },
  "outputs": {
    "isValid": "result.isValid"
  }
}
```

#### Step 3: Construct AuthData
```javascript
{
  "name": "construct-authdata-evm",
  "type": "construct_authdata",
  "inputs": {
    "result": {
      "eventId": "${eventId}",
      "attendee": "${attendeeAddress}",
      "code": "${code}",
      "timestamp": "${timestamp}",
      "isValid": "${verify-merkle.isValid}"
    }
  }
}
```

#### Step 4: Submit to Contract
```javascript
{
  "name": "submit-verification",
  "type": "evm_transaction",
  "contract": "YOUR_MODUPASS_CONTRACT_ADDRESS",
  "function": "verifyAttendance((uint256,uint256,bytes32,bytes32[],bytes,bool,bytes))",
  "authData_result": "${construct-authdata-evm.result}"
}
```

4. Export workflow and save Workflow ID

---

### 🔴 Issue #6: No Smart Account Authorization Flow

**Problem**: No UI or logic for users to authorize their accounts.

**What's Missing**:
```typescript
// Before any KRNL operation
const { isAuthorized, enableSmartAccount, embeddedWallet } = useKRNL();

if (!embeddedWallet) {
  // User needs to connect wallet via Privy first
  return;
}

if (!isAuthorized) {
  // User needs to sign EIP-7702 authorization
  await enableSmartAccount();
}
```

**Authorization Process**:
1. User connects wallet via Privy
2. User signs EIP-7702 authorization message
3. Delegates specific permissions to KRNL contract
4. Account gains smart account capabilities
5. Can now execute KRNL workflows

---

### 🔴 Issue #7: Mock API Instead of Real KRNL SDK

**Problem**: Current implementation uses mock endpoint instead of KRNL SDK.

**Current Code** (`web/src/lib/services/krnl-service.ts:56-69`):
```typescript
// ❌ Calling mock API
const response = await fetch(KRNL_NODE_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    workflowId: WORKFLOW_ID,
    inputs: { code: verificationCode, proof, root }
  })
});
```

**Should Be**:
```typescript
// ✅ Using KRNL SDK
import { useKRNL } from '@krnl-dev/sdk-react-7702';

const { executeWorkflow, statusCode, steps } = useKRNL();

const result = await executeWorkflow({
  workflowId: WORKFLOW_ID,
  inputs: {
    eventId,
    code: verificationCode,
    attendeeAddress
  }
});
```

---

### 🔴 Issue #8: AuthData Structure Mismatch

**Problem**: Mock AuthData doesn't match real KRNL structure.

**Current Mock** (`web/src/app/api/krnl/verify/route.ts:74-82`):
```typescript
const authData = {
  nonce: timestamp,              // ❌ Wrong - should be user's nonce
  expiry: timestamp + 300,       // ✅ Correct
  id: executionId,               // ✅ Correct
  executions: [executionId],     // ✅ Correct
  result: encodeVerificationResult(...), // ❌ Wrong encoding
  sponsorExecutionFee: false,    // ✅ Correct
  signature: generateKRNLSignature(...) // ❌ Fake signature
};
```

**Real KRNL AuthData**:
```typescript
interface AuthData {
  nonce: number;           // User's current nonce from contract
  expiry: number;          // Unix timestamp
  id: bytes32;            // Workflow execution ID
  executions: bytes32[];  // Array of execution step IDs
  result: bytes;          // ABI-encoded AttendanceData struct
  sponsorExecutionFee: boolean;
  signature: bytes;       // ECDSA signature from KRNL master key
}
```

**Correct Result Encoding**:
```typescript
// Must ABI-encode the AttendanceData struct
const result = ethers.AbiCoder.defaultAbiCoder().encode(
  ['tuple(string,address,string,uint256,bool)'],
  [[eventId, attendeeAddress, code, timestamp, isValid]]
);
```

---

### 🔴 Issue #9: Missing Environment Variables

**Problem**: No comprehensive `.env.local` file.

**Create** `.env.local`:
```bash
# ============================================
# PRIVY CONFIGURATION
# ============================================
# Get from: https://privy.io
NEXT_PUBLIC_PRIVY_APP_ID=

# ============================================
# KRNL CONFIGURATION
# ============================================
# KRNL Node endpoint
NEXT_PUBLIC_KRNL_NODE_URL=https://v0-1-0.node.lat/

# Workflow ID from KRNL Studio
NEXT_PUBLIC_KRNL_WORKFLOW_ID=

# KRNL DelegatedAccount contract address
NEXT_PUBLIC_DELEGATED_ACCOUNT_ADDRESS=

# ============================================
# CONTRACT ADDRESSES (After Deployment)
# ============================================
# Your deployed ModuPassTargetBase contract
NEXT_PUBLIC_MODUPASS_CONTRACT_ADDRESS=

# KRNL Master Key address
NEXT_PUBLIC_MASTER_KEY_ADDRESS=

# Recovery Key address
NEXT_PUBLIC_RECOVERY_KEY_ADDRESS=

# ============================================
# WALLET CONNECT (Optional - for Reown)
# ============================================
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=5802b7fddf9247042eeecefe520d1df5

# ============================================
# SUPABASE (Your existing config)
# ============================================
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

---

## 🎯 Step-by-Step Action Plan

### Phase 1: Setup KRNL Infrastructure (1-2 hours)

#### Step 1.1: Get Privy App ID
- [ ] Go to [privy.io](https://privy.io)
- [ ] Sign up / Log in
- [ ] Create new app
- [ ] Configure:
  - Name: "ModuPass"
  - Network: Sepolia Testnet
  - Enable: Embedded Wallets
  - Enable: EIP-7702 Support
- [ ] Copy App ID
- [ ] Add to `.env.local`: `NEXT_PUBLIC_PRIVY_APP_ID=...`

#### Step 1.2: Get KRNL DelegatedAccount Contract
- [ ] Contact KRNL team or check docs for DelegatedAccount bytecode
- [ ] Alternative: Use KRNL's deployed contract if available

#### Step 1.3: Deploy DelegatedAccount (if needed)
```bash
cd contracts
# Create deployment script
npx hardhat run scripts/deploy-delegated-account.ts --network sepolia
```

- [ ] Note the deployed address
- [ ] Get code hash:
```solidity
bytes32 codeHash;
assembly {
  codeHash := extcodehash(deployedAddress)
}
```
- [ ] Add to `.env.local`: `NEXT_PUBLIC_DELEGATED_ACCOUNT_ADDRESS=...`

#### Step 1.4: Update and Deploy ModuPassTargetBase
```solidity
// Update constructor call in deployment script
const moduPass = await ModuPassTargetBase.deploy(
  "0x...", // KRNL master key address (get from KRNL team)
  "0x...", // Your recovery key address
  "0x..."  // DelegatedAccount code hash from step 1.3
);
```

```bash
npx hardhat run scripts/deploy-targetbase.ts --network sepolia
```

- [ ] Note deployed address
- [ ] Add to `.env.local`: `NEXT_PUBLIC_MODUPASS_CONTRACT_ADDRESS=...`
- [ ] Verify on Etherscan

---

### Phase 2: Configure KRNL SDK (30 minutes)

#### Step 2.1: Create KRNL Config File

Create `web/src/lib/krnl-config.ts`:
```typescript
import { createConfig } from '@krnl-dev/sdk-react-7702';
import { sepolia } from 'viem/chains';

if (!process.env.NEXT_PUBLIC_DELEGATED_ACCOUNT_ADDRESS) {
  throw new Error('NEXT_PUBLIC_DELEGATED_ACCOUNT_ADDRESS is required');
}

if (!process.env.NEXT_PUBLIC_PRIVY_APP_ID) {
  throw new Error('NEXT_PUBLIC_PRIVY_APP_ID is required');
}

export const krnlConfig = createConfig({
  chain: sepolia,
  delegatedContractAddress: process.env.NEXT_PUBLIC_DELEGATED_ACCOUNT_ADDRESS as `0x${string}`,
  privyAppId: process.env.NEXT_PUBLIC_PRIVY_APP_ID,
  krnlNodeUrl: process.env.NEXT_PUBLIC_KRNL_NODE_URL || 'https://v0-1-0.node.lat/',
});
```

#### Step 2.2: Update Web3Provider

Update `web/src/app/web3-provider.tsx`:
```typescript
'use client';

import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PrivyProvider } from '@privy-io/react-auth';
import { KRNLProvider } from '@krnl-dev/sdk-react-7702';
import { WagmiProvider } from 'wagmi';
import { sepolia } from '@reown/appkit/networks';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { krnlConfig } from '@/lib/krnl-config';

const queryClient = new QueryClient();

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '5802b7fddf9247042eeecefe520d1df5';

const wagmiAdapter = new WagmiAdapter({
  networks: [sepolia],
  projectId,
});

export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <PrivyProvider 
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        appearance: {
          theme: 'light',
          accentColor: '#10b981',
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
        defaultChain: sepolia,
      }}
    >
      <KRNLProvider config={krnlConfig}>
        <WagmiProvider config={wagmiAdapter.wagmiConfig} reconnectOnMount={false}>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </WagmiProvider>
      </KRNLProvider>
    </PrivyProvider>
  );
}
```

---

### Phase 3: Build KRNL Workflow (1 hour)

#### Step 3.1: Design Workflow in KRNL Studio

1. Go to [studio.krnl.xyz](https://studio.krnl.xyz)
2. Click "Start Building"
3. Fill in Basic Info:
   - Name: `ModuPass Attendance Verification`
   - Network: `Sepolia Testnet`
   - Target Contract: `YOUR_MODUPASS_CONTRACT_ADDRESS`
   - Function: `verifyAttendance((uint256,uint256,bytes32,bytes32[],bytes,bool,bytes))`

#### Step 3.2: Add Workflow Steps

**Step 1: Fetch Merkle Proof**
```
Type: HTTP GET
Name: get-merkle-proof
URL: https://your-api.com/api/merkle-proof
Query Params:
  - eventId: ${eventId}
  - code: ${code}
Outputs:
  - proof: response.body.proof
  - root: response.body.root
```

**Step 2: Verify Merkle Proof**
```
Type: Merkle Verification
Name: verify-merkle
Inputs:
  - leaf: keccak256(${code})
  - proof: ${get-merkle-proof.proof}
  - root: ${get-merkle-proof.root}
Outputs:
  - isValid: result.isValid
```

**Step 3: Construct AuthData**
```
Type: Construct AuthData EVM
Name: construct-authdata
Inputs (AttendanceData struct):
  - eventId: ${eventId}
  - attendee: ${attendeeAddress}
  - code: ${code}
  - timestamp: ${timestamp}
  - isValid: ${verify-merkle.isValid}
```

**Step 4: Submit to Contract**
```
Type: EVM Transaction
Contract: YOUR_MODUPASS_CONTRACT_ADDRESS
Function: verifyAttendance
AuthData: ${construct-authdata.result}
```

#### Step 3.3: Export Workflow
- [ ] Preview workflow
- [ ] Test with sample data
- [ ] Export workflow JSON
- [ ] Save Workflow ID
- [ ] Add to `.env.local`: `NEXT_PUBLIC_KRNL_WORKFLOW_ID=...`

---

### Phase 4: Integrate in Frontend (1-2 hours)

#### Step 4.1: Create KRNL Hook

Create `web/src/hooks/useAttendanceVerification.ts`:
```typescript
import { useKRNL } from '@krnl-dev/sdk-react-7702';
import { useState } from 'react';

export interface AttendanceVerificationInput {
  eventId: string;
  code: string;
}

export function useAttendanceVerification() {
  const { 
    executeWorkflow, 
    isAuthorized, 
    enableSmartAccount,
    embeddedWallet,
    steps,
    currentStep,
    statusCode,
    error: krnlError,
    resetSteps
  } = useKRNL();

  const [isVerifying, setIsVerifying] = useState(false);

  const verifyAttendance = async ({ eventId, code }: AttendanceVerificationInput) => {
    try {
      setIsVerifying(true);
      resetSteps();

      // Check wallet connection
      if (!embeddedWallet) {
        throw new Error('Please connect your wallet first');
      }

      // Check authorization
      if (!isAuthorized) {
        console.log('Authorizing smart account...');
        const authorized = await enableSmartAccount();
        if (!authorized) {
          throw new Error('Failed to authorize smart account');
        }
      }

      // Execute workflow
      const workflowDSL = {
        workflowId: process.env.NEXT_PUBLIC_KRNL_WORKFLOW_ID!,
        inputs: {
          eventId,
          code,
          attendeeAddress: embeddedWallet.address,
          timestamp: Math.floor(Date.now() / 1000)
        }
      };

      console.log('Executing workflow...', workflowDSL);
      const result = await executeWorkflow(workflowDSL);

      return {
        success: true,
        result
      };
    } catch (error) {
      console.error('Verification error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      setIsVerifying(false);
    }
  };

  return {
    verifyAttendance,
    isVerifying,
    isAuthorized,
    embeddedWallet,
    steps,
    currentStep,
    statusCode,
    error: krnlError
  };
}
```

#### Step 4.2: Create Authorization Component

Create `web/src/components/KRNLAuthorization.tsx`:
```typescript
'use client';

import { useKRNL } from '@krnl-dev/sdk-react-7702';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Shield, Check } from 'lucide-react';

export function KRNLAuthorization() {
  const { isAuthorized, enableSmartAccount, embeddedWallet } = useKRNL();

  if (!embeddedWallet) {
    return null;
  }

  if (isAuthorized) {
    return (
      <Card className="p-4 bg-emerald-50 border-emerald-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
            <Check className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="font-medium text-emerald-900">Smart Account Authorized</p>
            <p className="text-sm text-emerald-700">Ready to verify attendance</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Shield className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold mb-2">Authorize Smart Account</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Enable KRNL's smart account features to verify attendance. 
            This is a one-time authorization using EIP-7702.
          </p>
          <Button onClick={enableSmartAccount}>
            Authorize Account
          </Button>
        </div>
      </div>
    </Card>
  );
}
```

#### Step 4.3: Create Workflow Progress Component

Create `web/src/components/WorkflowProgress.tsx`:
```typescript
'use client';

import { useKRNL, WorkflowStatusCode } from '@krnl-dev/sdk-react-7702';
import { Card } from '@/components/ui/card';
import { Loader2, Check, X } from 'lucide-react';

export function WorkflowProgress() {
  const { steps, currentStep, statusCode } = useKRNL();

  if (currentStep === 0) {
    return null;
  }

  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4">Verification Progress</h3>
      <div className="space-y-3">
        {steps.map((step) => (
          <div key={step.id} className="flex items-center gap-3">
            {step.status === 'running' && (
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            )}
            {step.status === 'completed' && (
              <Check className="w-5 h-5 text-emerald-600" />
            )}
            {step.status === 'error' && (
              <X className="w-5 h-5 text-red-600" />
            )}
            {step.status === 'pending' && (
              <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
            )}
            <div className="flex-1">
              <p className="font-medium">{step.title}</p>
              {step.error && (
                <p className="text-sm text-red-600">{step.error}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {statusCode === WorkflowStatusCode.SUCCESS && (
        <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <p className="text-sm text-emerald-800 font-medium">
            ✅ Attendance verified successfully!
          </p>
        </div>
      )}

      {statusCode === WorkflowStatusCode.FAILED && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800 font-medium">
            ❌ Verification failed. Please try again.
          </p>
        </div>
      )}
    </Card>
  );
}
```

#### Step 4.4: Update Verification Page

Update `web/src/app/events/verify/page.tsx` to use KRNL:
```typescript
'use client';

import { useState } from 'react';
import { useAttendanceVerification } from '@/hooks/useAttendanceVerification';
import { KRNLAuthorization } from '@/components/KRNLAuthorization';
import { WorkflowProgress } from '@/components/WorkflowProgress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function VerifyPage() {
  const [eventId, setEventId] = useState('');
  const [code, setCode] = useState('');
  
  const { 
    verifyAttendance, 
    isVerifying, 
    isAuthorized 
  } = useAttendanceVerification();

  const handleVerify = async () => {
    const result = await verifyAttendance({ eventId, code });
    if (result.success) {
      // Show success message
    } else {
      // Show error message
    }
  };

  return (
    <div className="container mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">Verify Attendance</h1>

      <div className="max-w-2xl space-y-6">
        <KRNLAuthorization />

        <div className="space-y-4">
          <Input
            placeholder="Event ID"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
          />
          <Input
            placeholder="Verification Code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <Button
            onClick={handleVerify}
            disabled={!isAuthorized || isVerifying || !eventId || !code}
            className="w-full"
          >
            {isVerifying ? 'Verifying...' : 'Verify Attendance'}
          </Button>
        </div>

        <WorkflowProgress />
      </div>
    </div>
  );
}
```

---

### Phase 5: Testing (1 hour)

#### Step 5.1: Local Testing Checklist
- [ ] Start dev server: `npm run dev`
- [ ] Connect wallet via Privy
- [ ] Authorize smart account
- [ ] Create test event
- [ ] Generate verification code
- [ ] Test attendance verification
- [ ] Check workflow progress display
- [ ] Verify on-chain data on Etherscan

#### Step 5.2: Test Scenarios
1. **Happy Path**
   - [ ] User connects wallet
   - [ ] User authorizes smart account
   - [ ] User submits valid code
   - [ ] Workflow executes successfully
   - [ ] On-chain verification recorded

2. **Error Cases**
   - [ ] Invalid verification code
   - [ ] Expired code
   - [ ] Already verified code
   - [ ] Network errors
   - [ ] Signature failures

3. **Edge Cases**
   - [ ] Wallet disconnection during workflow
   - [ ] Multiple verification attempts
   - [ ] Concurrent verifications

---

## 📋 Complete Checklist

### Setup Phase
- [ ] Get Privy App ID from privy.io
- [ ] Deploy or get KRNL DelegatedAccount contract address
- [ ] Get DelegatedAccount code hash
- [ ] Deploy ModuPassTargetBase with correct parameters
- [ ] Verify contracts on Etherscan

### Configuration Phase
- [ ] Create `.env.local` with all required variables
- [ ] Create `krnl-config.ts`
- [ ] Update `web3-provider.tsx` with Privy + KRNL
- [ ] Install any missing dependencies

### Workflow Phase
- [ ] Design workflow in KRNL Studio
- [ ] Add all workflow steps (Merkle proof, verification, AuthData)
- [ ] Test workflow with sample data
- [ ] Export and save Workflow ID
- [ ] Update environment variables

### Frontend Phase
- [ ] Create `useAttendanceVerification` hook
- [ ] Create `KRNLAuthorization` component
- [ ] Create `WorkflowProgress` component
- [ ] Update verification page
- [ ] Remove mock KRNL API calls
- [ ] Update all components to use KRNL SDK

### Testing Phase
- [ ] Test wallet connection
- [ ] Test smart account authorization
- [ ] Test event creation
- [ ] Test attendance verification
- [ ] Test error handling
- [ ] Test workflow progress display
- [ ] Verify on-chain data

---

## 🔍 Key Differences: Mock vs Real KRNL

### Current Mock Implementation
```typescript
// ❌ Mock - Simulates KRNL locally
fetch('/api/krnl/verify', {
  method: 'POST',
  body: JSON.stringify({ workflowId, inputs })
})

// Returns fake AuthData with:
// - Fake signature
// - Incorrect nonce
// - Mock verification
```

### Real KRNL Implementation
```typescript
// ✅ Real - Uses KRNL Protocol
const { executeWorkflow } = useKRNL();

await executeWorkflow({
  workflowId: WORKFLOW_ID,
  inputs: { eventId, code, attendeeAddress }
})

// Returns real AuthData with:
// - KRNL master key signature
// - User's actual nonce from contract
// - Real off-chain verification
// - On-chain settlement
```

---

## 💡 Important Notes

### Why Privy is Required
KRNL requires **EIP-7702** for temporary account delegation. Privy is one of the few wallet providers that fully supports this standard. Without EIP-7702:
- ❌ Smart account features won't work
- ❌ Delegated authority can't be granted
- ❌ Gasless transactions unavailable
- ❌ KRNL workflows can't execute

### Why You Can't Use Just Reown/WalletConnect
While Reown/WalletConnect is great for standard wallet connections, it doesn't support EIP-7702. KRNL's architecture requires:
1. **Temporary delegation** of account authority
2. **Smart account capabilities** on existing EOAs
3. **Gasless transactions** via delegation

These features are only available through EIP-7702, which Privy supports.

### Development vs Production
**Development** (Current):
- Mock KRNL Node API
- Fake signatures
- Local Merkle verification
- No real AuthData

**Production** (Target):
- Real KRNL Node
- KRNL master key signatures
- Off-chain verification by KRNL
- Cryptographically valid AuthData
- On-chain settlement

---

## 🚀 Next Steps

### Immediate (Today)
1. Get Privy App ID
2. Create `.env.local` file
3. Update `web3-provider.tsx`

### Short Term (This Week)
1. Deploy contracts with correct parameters
2. Build workflow in KRNL Studio
3. Integrate KRNL SDK in frontend

### Medium Term (Next Week)
1. Complete testing
2. Remove all mock implementations
3. Deploy to production

---

## 📚 Resources

### Documentation
- [KRNL SDK Usage](https://docs.krnl.xyz/krnl-sdk/usage)
- [KRNL Studio Guide](https://docs.krnl.xyz/krnl-studio/how-to-construct-a-workflow)
- [Target Base Contract](https://docs.krnl.xyz/smart-contract/how-to-integrate-your-smart-contract-with-kos)
- [Privy Documentation](https://docs.privy.io)

### Tools
- [KRNL Studio](https://studio.krnl.xyz)
- [Privy Dashboard](https://privy.io)
- [Sepolia Etherscan](https://sepolia.etherscan.io)

### Support
- KRNL Discord: [Join here]
- Privy Support: support@privy.io

---

## 🎯 Success Criteria

Your KRNL integration will be complete when:
- ✅ Users can authorize smart accounts via Privy
- ✅ Workflows execute through real KRNL Node
- ✅ AuthData is signed by KRNL master key
- ✅ Attendance verification is recorded on-chain
- ✅ Workflow progress is visible to users
- ✅ All mock implementations are removed

---

**Last Updated**: December 7, 2025  
**Status**: 60% Complete  
**Next Milestone**: KRNL SDK Integration (Phase 2)