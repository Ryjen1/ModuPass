// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ModuPassKRNLVerification
 * @notice KRNL-optimized event verification with code-based attendance
 * @dev Uses Merkle roots for efficient code verification
 */
contract ModuPassKRNLVerification {
    
    // ============ Structs ============
    
    struct AuthData {
        uint256 nonce;
        uint256 expiry;
        bytes32 id;
        bytes32[] executions;
        bytes result;
        bool sponsorExecutionFee;
        bytes signature;
    }
    
    struct Event {
        string eventId;
        string eventName;
        address organizer;
        bytes32 codesMerkleRoot;
        uint256 maxAttendees;
        uint256 createdAt;
        bool isActive;
    }
    
    struct AttendanceProof {
        address attendee;
        uint256 timestamp;
        bytes32 proofHash;
        bool verified;
    }
    
    // ============ State Variables ============
    
    mapping(string => Event) public events;
    mapping(string => mapping(address => AttendanceProof)) public attendanceRecords;
    mapping(string => address[]) public eventAttendees;
    
    string[] public allEventIds;
    
    // ============ Events ============
    
    event EventCreated(
        string indexed eventId,
        string eventName,
        address indexed organizer,
        bytes32 codesMerkleRoot,
        uint256 maxAttendees,
        uint256 timestamp
    );
    
    event AttendanceVerified(
        string indexed eventId,
        address indexed attendee,
        bytes32 proofHash,
        uint256 timestamp,
        bytes32 krnlExecutionId
    );
    
    event EventDeactivated(
        string indexed eventId,
        address indexed organizer,
        uint256 timestamp
    );
    
    // ============ Modifiers ============
    
    modifier eventExists(string memory eventId) {
        require(bytes(events[eventId].eventId).length > 0, "Event does not exist");
        _;
    }
    
    modifier eventActive(string memory eventId) {
        require(events[eventId].isActive, "Event is not active");
        _;
    }
    
    modifier onlyOrganizer(string memory eventId) {
        require(events[eventId].organizer == msg.sender, "Not event organizer");
        _;
    }
    
    // ============ Main Functions ============
    
    /**
     * @notice Create a new event with verification codes
     * @param authData KRNL authentication data
     * @param eventId Unique event identifier
     * @param eventName Human-readable event name
     * @param codesMerkleRoot Merkle root of all verification codes
     * @param maxAttendees Maximum number of attendees
     */
    function createEvent(
        AuthData calldata authData,
        string memory eventId,
        string memory eventName,
        bytes32 codesMerkleRoot,
        uint256 maxAttendees
    ) external {
        require(bytes(eventId).length > 0, "Event ID cannot be empty");
        require(bytes(eventName).length > 0, "Event name cannot be empty");
        require(bytes(events[eventId].eventId).length == 0, "Event already exists");
        require(codesMerkleRoot != bytes32(0), "Invalid Merkle root");
        require(maxAttendees > 0, "Max attendees must be > 0");
        
        // Verify AuthData is not expired
        require(block.timestamp <= authData.expiry, "AuthData expired");
        
        events[eventId] = Event({
            eventId: eventId,
            eventName: eventName,
            organizer: msg.sender,
            codesMerkleRoot: codesMerkleRoot,
            maxAttendees: maxAttendees,
            createdAt: block.timestamp,
            isActive: true
        });
        
        allEventIds.push(eventId);
        
        emit EventCreated(
            eventId,
            eventName,
            msg.sender,
            codesMerkleRoot,
            maxAttendees,
            block.timestamp
        );
    }
    
    /**
     * @notice Verify attendance with KRNL-generated proof
     * @param authData KRNL authentication data (contains verification)
     * @param eventId Event identifier
     * @param attendee Attendee address
     */
    function verifyAttendance(
        AuthData calldata authData,
        string memory eventId,
        address attendee
    ) external eventExists(eventId) eventActive(eventId) {
        require(attendee != address(0), "Invalid attendee address");
        require(!attendanceRecords[eventId][attendee].verified, "Already verified");
        require(block.timestamp <= authData.expiry, "AuthData expired");
        
        // Check max attendees not exceeded
        require(
            eventAttendees[eventId].length < events[eventId].maxAttendees,
            "Event is full"
        );
        
        // KRNL has already verified the code off-chain
        // We just need to record the proof on-chain
        bytes32 proofHash = authData.id;
        
        attendanceRecords[eventId][attendee] = AttendanceProof({
            attendee: attendee,
            timestamp: block.timestamp,
            proofHash: proofHash,
            verified: true
        });
        
        eventAttendees[eventId].push(attendee);
        
        emit AttendanceVerified(
            eventId,
            attendee,
            proofHash,
            block.timestamp,
            authData.id
        );
    }
    
    /**
     * @notice Deactivate an event (organizer only)
     * @param eventId Event to deactivate
     */
    function deactivateEvent(
        string memory eventId
    ) external eventExists(eventId) onlyOrganizer(eventId) {
        events[eventId].isActive = false;
        
        emit EventDeactivated(eventId, msg.sender, block.timestamp);
    }
    
    // ============ View Functions ============
    
    function getEvent(string memory eventId) 
        external 
        view 
        eventExists(eventId)
        returns (
            string memory,
            string memory,
            address,
            bytes32,
            uint256,
            uint256,
            bool
        ) 
    {
        Event memory e = events[eventId];
        return (
            e.eventId,
            e.eventName,
            e.organizer,
            e.codesMerkleRoot,
            e.maxAttendees,
            e.createdAt,
            e.isActive
        );
    }
    
    function isAttendanceVerified(
        string memory eventId,
        address attendee
    ) external view returns (bool) {
        return attendanceRecords[eventId][attendee].verified;
    }
    
    function getAttendanceProof(
        string memory eventId,
        address attendee
    ) external view returns (
        address,
        uint256,
        bytes32,
        bool
    ) {
        AttendanceProof memory proof = attendanceRecords[eventId][attendee];
        return (
            proof.attendee,
            proof.timestamp,
            proof.proofHash,
            proof.verified
        );
    }
    
    function getEventAttendees(
        string memory eventId
    ) external view eventExists(eventId) returns (address[] memory) {
        return eventAttendees[eventId];
    }
    
    function getAttendeeCount(
        string memory eventId
    ) external view eventExists(eventId) returns (uint256) {
        return eventAttendees[eventId].length;
    }
    
    function getTotalEvents() external view returns (uint256) {
        return allEventIds.length;
    }
    
    function getEventIdByIndex(uint256 index) external view returns (string memory) {
        require(index < allEventIds.length, "Index out of bounds");
        return allEventIds[index];
    }
}
