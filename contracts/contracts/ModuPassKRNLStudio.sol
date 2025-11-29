// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ModuPassKRNLStudio
 * @notice KRNL Studio compatible version of ModuPass
 * @dev This contract is designed to work with KRNL Studio workflows
 * 
 * Key difference: Functions accept authData as first parameter
 * This allows KRNL Studio to inject authentication and proof data
 */
contract ModuPassKRNLStudio {
    
    // ============ Structs ============
    
    struct Event {
        string eventId;
        string eventName;
        address organizer;
        uint256 createdAt;
        bool isActive;
    }
    
    struct AttendanceProof {
        address attendee;
        uint256 timestamp;
        bytes32 proofHash;
        bool verified;
    }
    
    // authData tuple structure expected by KRNL
    struct AuthData {
        uint256 timestamp;
        uint256 nonce;
        bytes32 workflowId;
        bytes signature;
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
        uint256 timestamp,
        bytes32 workflowId
    );
    
    event AttendanceVerified(
        string indexed eventId,
        address indexed attendee,
        bytes32 proofHash,
        uint256 timestamp,
        bytes32 workflowId
    );
    
    // ============ KRNL Studio Compatible Functions ============
    
    /**
     * @notice Create a new event (KRNL Studio compatible)
     * @param authData Authentication data from KRNL workflow
     * @param eventId Unique identifier for the event
     * @param eventName Human-readable name of the event
     */
    function createEventWithAuth(
        AuthData calldata authData,
        string memory eventId,
        string memory eventName
    ) external {
        require(bytes(eventId).length > 0, "Event ID cannot be empty");
        require(bytes(eventName).length > 0, "Event name cannot be empty");
        require(bytes(events[eventId].eventId).length == 0, "Event already exists");
        
        // Verify authData timestamp is recent (within 5 minutes)
        require(block.timestamp - authData.timestamp < 300, "AuthData expired");
        
        events[eventId] = Event({
            eventId: eventId,
            eventName: eventName,
            organizer: msg.sender,
            createdAt: block.timestamp,
            isActive: true
        });
        
        allEventIds.push(eventId);
        
        emit EventCreated(eventId, eventName, msg.sender, block.timestamp, authData.workflowId);
    }
    
    /**
     * @notice Verify attendance for an event (KRNL Studio compatible)
     * @param authData Authentication data from KRNL workflow
     * @param eventId The event identifier
     * @param attendee Address of the attendee
     * @param proofData Proof data from KRNL workflow
     */
    function verifyAttendanceWithAuth(
        AuthData calldata authData,
        string memory eventId,
        address attendee,
        bytes memory proofData
    ) external {
        require(bytes(events[eventId].eventId).length > 0, "Event does not exist");
        require(events[eventId].isActive, "Event is not active");
        require(attendee != address(0), "Invalid attendee address");
        require(!attendanceRecords[eventId][attendee].verified, "Already verified");
        
        // Verify authData timestamp is recent
        require(block.timestamp - authData.timestamp < 300, "AuthData expired");
        
        bytes32 proofHash = keccak256(abi.encodePacked(
            eventId,
            attendee,
            block.timestamp,
            proofData,
            authData.workflowId
        ));
        
        attendanceRecords[eventId][attendee] = AttendanceProof({
            attendee: attendee,
            timestamp: block.timestamp,
            proofHash: proofHash,
            verified: true
        });
        
        eventAttendees[eventId].push(attendee);
        
        emit AttendanceVerified(eventId, attendee, proofHash, block.timestamp, authData.workflowId);
    }
    
    // ============ Standard Functions (for compatibility) ============
    
    /**
     * @notice Create event without authData (fallback)
     */
    function createEvent(
        string memory eventId,
        string memory eventName
    ) external {
        AuthData memory authData = AuthData({
            timestamp: block.timestamp,
            nonce: 0,
            workflowId: bytes32(0),
            signature: ""
        });
        
        this.createEventWithAuth(authData, eventId, eventName);
    }
    
    /**
     * @notice Verify attendance without authData (fallback)
     */
    function verifyAttendance(
        string memory eventId,
        address attendee,
        bytes memory proofData
    ) external {
        AuthData memory authData = AuthData({
            timestamp: block.timestamp,
            nonce: 0,
            workflowId: bytes32(0),
            signature: ""
        });
        
        this.verifyAttendanceWithAuth(authData, eventId, attendee, proofData);
    }
    
    /**
     * @notice Deactivate an event
     */
    function deactivateEvent(string memory eventId) external {
        require(bytes(events[eventId].eventId).length > 0, "Event does not exist");
        require(events[eventId].organizer == msg.sender, "Not event organizer");
        
        events[eventId].isActive = false;
    }
    
    // ============ View Functions ============
    
    function getEvent(string memory eventId) 
        external 
        view 
        returns (
            string memory,
            string memory,
            address,
            uint256,
            bool
        ) 
    {
        require(bytes(events[eventId].eventId).length > 0, "Event does not exist");
        Event memory e = events[eventId];
        return (e.eventId, e.eventName, e.organizer, e.createdAt, e.isActive);
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
        return (proof.attendee, proof.timestamp, proof.proofHash, proof.verified);
    }
    
    function getEventAttendees(
        string memory eventId
    ) external view returns (address[] memory) {
        require(bytes(events[eventId].eventId).length > 0, "Event does not exist");
        return eventAttendees[eventId];
    }
    
    function getTotalEvents() external view returns (uint256) {
        return allEventIds.length;
    }
    
    function getEventIdByIndex(uint256 index) external view returns (string memory) {
        require(index < allEventIds.length, "Index out of bounds");
        return allEventIds[index];
    }
}