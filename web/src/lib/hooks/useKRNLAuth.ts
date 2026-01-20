'use client';

import { useKRNL } from '@krnl-dev/sdk-react-7702';
import { useCallback } from 'react';

/**
 * Hook for authorizing KRNL Delegated Account
 * 
 * Handles the authorization flow for enabling smart account capabilities
 * via EIP-7702 delegation without deploying a new contract.
 */
export function useKRNLAuth() {
  const { isAuthorized, enableSmartAccount, embeddedWallet } = useKRNL();

  /**
   * Authorize the account for KRNL workflow execution
   * 
   * What happens during authorization:
   * - User signs an EIP-7702 authorization message via Privy
   * - The authorization delegates specific permissions to the KRNL contract
   * - Your account gains smart account capabilities without deploying a new contract
   * - The delegation is temporary and can be revoked at any time
   */
  const authorizeAccount = useCallback(async () => {
    try {
      console.log('🔍 Authorization Check:');
      console.log('  - embeddedWallet exists:', !!embeddedWallet);
      console.log('  - isAuthorized:', isAuthorized);
      
      if (!embeddedWallet) {
        console.error('❌ No embedded wallet found. User needs to connect wallet via Privy first.');
        return false;
      }

      if (!isAuthorized) {
        console.log('⏳ Calling enableSmartAccount...');
        const success = await enableSmartAccount();
        console.log('✅ enableSmartAccount result:', success);
        
        if (success) {
          console.log('✅ Account is now authorized for KRNL workflows');
        } else {
          console.error('❌ enableSmartAccount returned false - check wallet balance');
        }
        return success;
      }

      console.log('✅ Already authorized');
      return true;
    } catch (error: any) {
      console.error('❌ Failed to authorize account:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        error: error
      });
      return false;
    }
  }, [embeddedWallet, isAuthorized, enableSmartAccount]);

  return {
    authorizeAccount,
    isAuthorized,
    hasEmbeddedWallet: !!embeddedWallet,
  };
}

export default useKRNLAuth;
