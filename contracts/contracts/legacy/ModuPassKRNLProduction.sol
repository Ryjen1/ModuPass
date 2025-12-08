// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./KRNLVerifier.sol";
import "./PassToken.sol";

/// @title ModuPassKRNLProduction
/// @notice Production-ready ModuPass with full KRNL integration and NFT minting
/// @dev Main contract for issuing verifiable event attendance passes
contract ModuPassKRNLProduction {
    
    /// @notice PassToken NFT contract
    PassToken public immutable passToken;
    
    /// @dev Mapping for nonce tracking
    mapping(address => mapping(uint256 => bool)) private _usedNonces;
    
    /// @notice Timestamp validation window (default 1 hour)
    uint256 public timestampWindow = 3600;
    
    /// @dev Represents a single pass issued for an event to a wallet
    struct Pass {
        bytes32 eventIdHash;   // keccak256(eventId string)
        address attendee;      // wallet that owns the pass
        uint64 issuedAt;       // block timestamp when pass was anchored
        bytes32 workflowId;    // identifier of the KRNL workflow definition
        bytes32 receiptHash;   // hash of the KRNL off-chain receipt / transcript
        uint256 tokenId;       // NFT token ID
    }
    
    /// @dev Mapping: event hash => attendee => pass
    mapping(bytes32 => mapping(address => Pass)) private _passes;
    
    /// @dev Total passes issued per event (for analytics / UX)
    mapping(bytes32 => uint256) public passesCountByEvent;
    
    /// @notice Base URI for token metadata
    string public baseTokenURI;
    
    event PassIssued(
        bytes32 indexed eventIdHash,
        address indexed attendee,
        bytes32 indexed workflowId,
        bytes32 receiptHash,
        uint64 issuedAt,
        uint256 tokenId
    );
    
    event BaseURIUpdated(string newBaseURI);
    
    error PassAlreadyIssued();
    error InvalidEventId();
    error InvalidAttendee();
    
    constructor(
        bool isSoulbound,
        string memory _baseTokenURI
    ) {
        passToken = new PassToken(isSoulbound);
        baseTokenURI = _baseTokenURI;
    }
    
    /// @notice Issue a participation pass with KRNL authentication
    /// @param authData KRNL authentication data containing proof
    /// @param eventId Human-readable event identifier
    /// @param attendee Wallet address that should receive the pass
    function issuePass(
        KRNLVerifier.AuthData calldata authData,
        string calldata eventId,
        address attendee
    ) external returns (uint256) {
        // Verify KRNL authentication
        _verifyAuth(authData);
        
        // Validate inputs
        if (bytes(eventId).length == 0) {
            revert InvalidEventId();
        }
        if (attendee == address(0)) {
            revert InvalidAttendee();
        }
        
        bytes32 eventIdHash = keccak256(bytes(eventId));
        Pass storage existing = _passes[eventIdHash][attendee];
        
        if (existing.issuedAt != 0) {
            revert PassAlreadyIssued();
        }
        
        // Generate token URI
        string memory tokenURI_ = string(
            abi.encodePacked(
                baseTokenURI,
                "/",
                eventId,
                "/",
                _addressToString(attendee)
            )
        );
        
        // Mint NFT
        uint256 tokenId = passToken.mint(attendee, eventId, tokenURI_);
        
        // Store pass data
        uint64 issuedAt = uint64(block.timestamp);
        _passes[eventIdHash][attendee] = Pass({
            eventIdHash: eventIdHash,
            attendee: attendee,
            issuedAt: issuedAt,
            workflowId: authData.workflowId,
            receiptHash: authData.receiptHash,
            tokenId: tokenId
        });
        
        passesCountByEvent[eventIdHash] += 1;
        
        emit PassIssued(
            eventIdHash,
            attendee,
            authData.workflowId,
            authData.receiptHash,
            issuedAt,
            tokenId
        );
        
        return tokenId;
    }
    
    /// @notice Returns true if a pass exists for the given event and attendee
    function hasPass(string calldata eventId, address attendee) external view returns (bool) {
        bytes32 eventIdHash = keccak256(bytes(eventId));
        return _passes[eventIdHash][attendee].issuedAt != 0;
    }
    
    /// @notice Get full pass details for a given event and attendee
    function getPass(string calldata eventId, address attendee) external view returns (Pass memory) {
        bytes32 eventIdHash = keccak256(bytes(eventId));
        return _passes[eventIdHash][attendee];
    }
    
    /// @notice Check if a nonce has been used
    function isNonceUsed(address user, uint256 nonce) external view returns (bool) {
        return _usedNonces[user][nonce];
    }
    
    /// @notice Update base token URI (only owner of PassToken can call)
    function setBaseTokenURI(string memory newBaseURI) external {
        require(msg.sender == passToken.owner(), "NOT_AUTHORIZED");
        baseTokenURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }
    
    /// @notice Set timestamp validation window
    function setTimestampWindow(uint256 window) external {
        require(msg.sender == passToken.owner(), "NOT_AUTHORIZED");
        timestampWindow = window;
    }
    
    /// @notice Internal function to verify KRNL authentication
    function _verifyAuth(KRNLVerifier.AuthData calldata authData) private {
        // Validate user address
        if (authData.user == address(0)) {
            revert KRNLVerifier.InvalidUser();
        }
        
        // Validate workflow ID
        if (authData.workflowId == bytes32(0)) {
            revert KRNLVerifier.InvalidWorkflowId();
        }
        
        // Validate receipt hash
        if (authData.receiptHash == bytes32(0)) {
            revert KRNLVerifier.InvalidReceiptHash();
        }
        
        // Check nonce hasn't been used
        if (_usedNonces[authData.user][authData.nonce]) {
            revert KRNLVerifier.NonceAlreadyUsed();
        }
        
        // Validate timestamp (within window)
        if (block.timestamp > authData.timestamp + timestampWindow) {
            revert KRNLVerifier.TimestampExpired();
        }
        
        // Prevent timestamps too far in future (allow 5 min clock skew)
        if (authData.timestamp > block.timestamp + 300) {
            revert KRNLVerifier.TimestampTooFarInFuture();
        }
        
        // Mark nonce as used
        _usedNonces[authData.user][authData.nonce] = true;
    }
    
    /// @notice Helper to convert address to string
    function _addressToString(address addr) private pure returns (string memory) {
        bytes memory alphabet = "0123456789abcdef";
        bytes20 value = bytes20(addr);
        bytes memory str = new bytes(42);
        str[0] = '0';
        str[1] = 'x';
        for (uint256 i = 0; i < 20; i++) {
            str[2 + i * 2] = alphabet[uint8(value[i] >> 4)];
            str[3 + i * 2] = alphabet[uint8(value[i] & 0x0f)];
        }
        return string(str);
    }
}