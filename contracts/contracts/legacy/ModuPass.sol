// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title ModuPass
/// @notice Minimal on-chain anchor for KRNL-issued participation passes.
/// @dev Business logic (eligibility, de-duplication, cross-chain checks) lives in KRNL workflows.
contract ModuPass {
    /// @notice Address allowed to finalize passes on-chain (KRNL executor / attestor).
    address public immutable krnlExecutor;

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

    error NotKrnlExecutor();
    error PassAlreadyIssued();

    constructor(address _krnlExecutor) {
        require(_krnlExecutor != address(0), "INVALID_EXECUTOR");
        krnlExecutor = _krnlExecutor;
    }

    /// @notice Issue a participation pass for an attendee of a specific event.
    /// @dev Must only be called by a trusted KRNL executor / attestor.
    /// @param eventId Human-readable event identifier used off-chain (e.g. "ethcc-2025-day1").
    /// @param attendee Wallet address that should receive the pass.
    /// @param workflowId Identifier of the KRNL workflow that produced this result.
    /// @param receiptHash Hash of the KRNL verifiable receipt for this issuance.
    function issuePass(
        string calldata eventId,
        address attendee,
        bytes32 workflowId,
        bytes32 receiptHash
    ) external {
        if (msg.sender != krnlExecutor) {
            revert NotKrnlExecutor();
        }
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
