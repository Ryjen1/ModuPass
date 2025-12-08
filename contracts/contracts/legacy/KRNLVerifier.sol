// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title KRNLVerifier
/// @notice Library for verifying KRNL proofs and authentication data
/// @dev Handles nonce tracking, timestamp validation, and proof verification
library KRNLVerifier {
    /// @notice KRNL authentication data structure
    struct AuthData {
        address user;           // User being authenticated
        uint256 nonce;          // Nonce for replay protection
        uint256 timestamp;      // Timestamp of the authentication
        bytes32 workflowId;     // KRNL workflow identifier
        bytes32 receiptHash;    // Hash of KRNL execution receipt
        bytes signature;        // Signature from KRNL (optional for MVP)
    }
    
    /// @notice Storage for nonce tracking
    struct VerifierStorage {
        mapping(address => mapping(uint256 => bool)) usedNonces;
        uint256 timestampWindow; // Max age of timestamp in seconds
    }
    
    error NonceAlreadyUsed();
    error TimestampExpired();
    error TimestampTooFarInFuture();
    error InvalidUser();
    error InvalidWorkflowId();
    error InvalidReceiptHash();
    
    /// @notice Verify KRNL authentication data
    /// @param authData The authentication data from KRNL workflow
    /// @param storage_ Storage reference for nonce tracking
    function verifyAuth(
        AuthData calldata authData,
        VerifierStorage storage storage_
    ) internal {
        // Validate user address
        if (authData.user == address(0)) {
            revert InvalidUser();
        }
        
        // Validate workflow ID
        if (authData.workflowId == bytes32(0)) {
            revert InvalidWorkflowId();
        }
        
        // Validate receipt hash
        if (authData.receiptHash == bytes32(0)) {
            revert InvalidReceiptHash();
        }
        
        // Check nonce hasn't been used
        if (storage_.usedNonces[authData.user][authData.nonce]) {
            revert NonceAlreadyUsed();
        }
        
        // Validate timestamp (within window)
        uint256 window = storage_.timestampWindow > 0 ? storage_.timestampWindow : 3600; // Default 1 hour
        
        if (block.timestamp > authData.timestamp + window) {
            revert TimestampExpired();
        }
        
        // Prevent timestamps too far in future (allow 5 min clock skew)
        if (authData.timestamp > block.timestamp + 300) {
            revert TimestampTooFarInFuture();
        }
        
        // Mark nonce as used
        storage_.usedNonces[authData.user][authData.nonce] = true;
    }
    
    /// @notice Check if a nonce has been used
    function isNonceUsed(
        VerifierStorage storage storage_,
        address user,
        uint256 nonce
    ) internal view returns (bool) {
        return storage_.usedNonces[user][nonce];
    }
    
    /// @notice Set the timestamp validation window
    function setTimestampWindow(
        VerifierStorage storage storage_,
        uint256 window
    ) internal {
        storage_.timestampWindow = window;
    }
}