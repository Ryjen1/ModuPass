// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title ModuPassKRNLv2
/// @notice KRNL-compatible version matching expected authData structure.
contract ModuPassKRNLv2 {
    /// @notice KRNL authentication data structure with expected field names
    struct AuthData {
        address sender;         // Sender address
        uint256 blockNumber;    // Block number
        uint256 blockTimestamp; // Block timestamp
        bytes32 txHash;         // Transaction hash
        bytes proof;            // KRNL proof data
    }

    /// @dev Represents a single pass issued for an event to a wallet.
    struct Pass {
        bytes32 eventIdHash;   // keccak256(eventId string)
        address attendee;      // wallet that owns the pass
        uint64 issuedAt;       // block timestamp when pass was anchored
        bytes32 workflowId;    // identifier of the KRNL workflow definition
        bytes32 receiptHash;   // hash of the KRNL off-chain receipt / transcript
    }

    /// @dev Mapping: event hash => attendee => pass.
    mapping(bytes32 => mapping(address => Pass)) private _passes;

    /// @dev Total passes issued per event (for analytics / UX).
    mapping(bytes32 => uint256) public passesCountByEvent;

    event PassIssued(
        bytes32 indexed eventIdHash,
        address indexed attendee,
        bytes32 indexed workflowId,
        bytes32 receiptHash,
        uint64 issuedAt
    );

    error PassAlreadyIssued();
    error InvalidAuthData();

    /// @notice Issue a participation pass with KRNL authentication.
    /// @param authData KRNL authentication data.
    /// @param eventId Human-readable event identifier.
    /// @param attendee Wallet address that should receive the pass.
    /// @param workflowId Identifier of the KRNL workflow.
    /// @param receiptHash Hash of the KRNL verifiable receipt.
    function issuePass(
        AuthData calldata authData,
        string calldata eventId,
        address attendee,
        bytes32 workflowId,
        bytes32 receiptHash
    ) external {
        // Validate authData
        require(authData.sender != address(0), "INVALID_SENDER");
        require(attendee != address(0), "INVALID_ATTENDEE");

        bytes32 eventIdHash = keccak256(bytes(eventId));
        Pass storage existing = _passes[eventIdHash][attendee];
        if (existing.issuedAt != 0) {
            revert PassAlreadyIssued();
        }

        uint64 issuedAt = uint64(block.timestamp);
        _passes[eventIdHash][attendee] = Pass({
            eventIdHash: eventIdHash,
            attendee: attendee,
            issuedAt: issuedAt,
            workflowId: workflowId,
            receiptHash: receiptHash
        });

        passesCountByEvent[eventIdHash] += 1;

        emit PassIssued(eventIdHash, attendee, workflowId, receiptHash, issuedAt);
    }

    /// @notice Returns true if a pass exists for the given event and attendee.
    function hasPass(string calldata eventId, address attendee) external view returns (bool) {
        bytes32 eventIdHash = keccak256(bytes(eventId));
        return _passes[eventIdHash][attendee].issuedAt != 0;
    }

    /// @notice Get full pass details for a given event and attendee.
    function getPass(string calldata eventId, address attendee) external view returns (Pass memory) {
        bytes32 eventIdHash = keccak256(bytes(eventId));
        return _passes[eventIdHash][attendee];
    }
}