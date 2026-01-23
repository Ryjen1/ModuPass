// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title TargetBase
 * @notice Foundational contract providing signature-based authorization for smart contracts
 * @dev Implements master key authorization, smart account enforcement, replay protection, and temporal validation
 */
abstract contract TargetBase is Ownable {
    using ECDSA for bytes32;

    // Execution struct for KRNL workflow steps
    struct Execution {
        bytes32 id;
        bytes data;
        bytes result;
    }

    // AuthData struct for KRNL authorization
    struct AuthData {
        uint256 nonce;
        uint256 expiry;
        bytes32 id;
        Execution[] executions;
        bytes result;
        bool sponsorExecutionFee;
        bytes signature;
    }

    // State variables
    address public masterKey;
    address public recoveryKey;
    bytes32 public delegatedAccountCodeHash;
    
    mapping(address => uint256) public nonces;
    mapping(bytes32 => bool) public usedAuthorizations;

    // Events
    event AuthorizationVerified(address indexed sender, bytes32 indexed authHash, uint256 nonce);
    event MasterKeyUpdated(address indexed oldKey, address indexed newKey);
    event RecoveryKeyUpdated(address indexed oldKey, address indexed newKey);
    event DelegatedAccountCodeHashUpdated(bytes32 indexed oldHash, bytes32 indexed newHash);
    event NonceReset(address indexed user, uint256 newNonce);

    // Errors
    error InvalidImplementation();
    error InvalidNonce();
    error AuthorizationExpired();
    error AuthorizationAlreadyUsed();
    error InvalidSignature();

    constructor(address _masterKey, address _recoveryKey, bytes32 _delegatedAccountCodeHash) Ownable(msg.sender) {
        masterKey = _masterKey;
        recoveryKey = _recoveryKey;
        delegatedAccountCodeHash = _delegatedAccountCodeHash;
    }

    /**
     * @notice Modifier to enforce authorization requirements
     * @param authData The authorization data containing signature and metadata
     */
    modifier requireAuth(AuthData calldata authData) {
        _verifyAuthorization(authData);
        _;
    }

    /**
     * @notice Internal function to verify authorization
     * @param authData The authorization data to verify
     */
    function _verifyAuthorization(AuthData calldata authData) internal {
        // 1. Implementation Check - Caller must be approved DelegatedAccount
        if (msg.sender.code.length > 0) {
            bytes32 callerCodeHash;
            assembly {
                callerCodeHash := extcodehash(caller())
            }
            if (callerCodeHash != delegatedAccountCodeHash && delegatedAccountCodeHash != bytes32(0)) {
                revert InvalidImplementation();
            }
        }

        // 2. Nonce Check
        if (authData.nonce != nonces[msg.sender]) {
            revert InvalidNonce();
        }

        // 3. Expiry Check
        if (block.timestamp > authData.expiry) {
            revert AuthorizationExpired();
        }

        // 4. Hash Generation
        bytes32 authHash = keccak256(
            abi.encodePacked(
                msg.sender,
                authData.nonce,
                authData.expiry,
                authData.result,
                msg.sig
            )
        );

        // 5. Replay Check
        if (usedAuthorizations[authHash]) {
            revert AuthorizationAlreadyUsed();
        }

        // 6. Signature Check
        bytes32 messageHash = MessageHashUtils.toEthSignedMessageHash(authHash);
        address signer = ECDSA.recover(messageHash, authData.signature);
        
        if (signer != masterKey) {
            revert InvalidSignature();
        }

        // 7. State Update
        nonces[msg.sender]++;
        usedAuthorizations[authHash] = true;

        // 8. Event Emitted
        emit AuthorizationVerified(msg.sender, authHash, authData.nonce);
    }

    /**
     * @notice Update the master key (only owner or recovery key)
     * @param newMasterKey The new master key address
     */
    function updateMasterKey(address newMasterKey) external {
        require(msg.sender == owner() || msg.sender == recoveryKey, "Unauthorized");
        address oldKey = masterKey;
        masterKey = newMasterKey;
        emit MasterKeyUpdated(oldKey, newMasterKey);
    }

    /**
     * @notice Update the recovery key (only owner)
     * @param newRecoveryKey The new recovery key address
     */
    function updateRecoveryKey(address newRecoveryKey) external onlyOwner {
        address oldKey = recoveryKey;
        recoveryKey = newRecoveryKey;
        emit RecoveryKeyUpdated(oldKey, newRecoveryKey);
    }

    /**
     * @notice Update the delegated account code hash (only owner)
     * @param newCodeHash The new code hash
     */
    function updateDelegatedAccountCodeHash(bytes32 newCodeHash) external onlyOwner {
        bytes32 oldHash = delegatedAccountCodeHash;
        delegatedAccountCodeHash = newCodeHash;
        emit DelegatedAccountCodeHashUpdated(oldHash, newCodeHash);
    }

    /**
     * @notice Reset nonce for a user (only owner, for emergency recovery)
     * @param user The user address
     * @param newNonce The new nonce value
     */
    function resetNonce(address user, uint256 newNonce) external onlyOwner {
        nonces[user] = newNonce;
        emit NonceReset(user, newNonce);
    }

    /**
     * @notice Get the current nonce for an address
     * @param user The user address
     * @return The current nonce
     */
    function getNonce(address user) external view returns (uint256) {
        return nonces[user];
    }
}
