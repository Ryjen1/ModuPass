// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ModuPassVerification
 * @notice Event verification and attendance proof system for ModuPass
 * @dev Designed to work with KRNL workflow orchestration
 */
contract ModuPassVerification {
    
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
        uint256 timestamp
    );
    
    event AttendanceVerified(
        string indexed eventId,
        address indexed attendee,
        bytes32 proofHash,
        uint256 timestamp
    );
    
    event EventDeactivated(
        string indexed eventId,
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
    
    // ============ Core Functions ============
    
    /**
     * @notice Create a new event
     * @param eventId Unique identifier for the event
     * @param eventName Human-readable name of the event
     */
    function createEvent(
        string memory eventId,
        string memory eventName
    ) external {
        require(bytes(eventId).length > 0, "Event ID cannot be empty");
        require(bytes(eventName).length > 0, "Event name cannot be empty");
        require(bytes(events[eventId].eventId).length == 0, "Event already exists");
        
        events[eventId] = Event({
            eventId: eventId,
            eventName: eventName,
            organizer: msg.sender,
            createdAt: block.timestamp,
            isActive: true
        });
        
        allEventIds.push(eventId);
        
        emit EventCreated(eventId, eventName, msg.sender, block.timestamp);
    }
    
    /**
     * @notice Verify attendance for an event
     * @dev This function is called by KRNL workflow after validation
     * @param eventId The event identifier
     * @param attendee Address of the attendee
     * @param proofData Proof data from KRNL workflow
     */
    function verifyAttendance(
        string memory eventId,
        address attendee,
        bytes memory proofData
    ) external eventExists(eventId) eventActive(eventId) {
        require(attendee != address(0), "Invalid attendee address");
        require(!attendanceRecords[eventId][attendee].verified, "Already verified");
        
        bytes32 proofHash = keccak256(abi.encodePacked(
            eventId,
            attendee,
            block.timestamp,
            proofData
        ));
        
        attendanceRecords[eventId][attendee] = AttendanceProof({
            attendee: attendee,
            timestamp: block.timestamp,
            proofHash: proofHash,
            verified: true
        });
        
        eventAttendees[eventId].push(attendee);
        
        emit AttendanceVerified(eventId, attendee, proofHash, block.timestamp);
    }
    
    /**
     * @notice Deactivate an event (only organizer)
     * @param eventId The event to deactivate
     */
    function deactivateEvent(
        string memory eventId
    ) external eventExists(eventId) onlyOrganizer(eventId) {
        events[eventId].isActive = false;
        emit EventDeactivated(eventId, block.timestamp);
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get event details
     * @param eventId The event identifier
     */
    function getEvent(string memory eventId) 
        external 
        view 
        eventExists(eventId)
        returns (
            string memory,
            string memory,
            address,
            uint256,
            bool
        ) 
    {
        Event memory e = events[eventId];
        return (e.eventId, e.eventName, e.organizer, e.createdAt, e.isActive);
    }
    
    /**
     * @notice Check if attendance is verified
     * @param eventId The event identifier
     * @param attendee The attendee address
     */
    function isAttendanceVerified(
        string memory eventId,
        address attendee
    ) external view returns (bool) {
        return attendanceRecords[eventId][attendee].verified;
    }
    
    /**
     * @notice Get attendance proof details
     * @param eventId The event identifier
     * @param attendee The attendee address
     */
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
    
    /**
     * @notice Get all attendees for an event
     * @param eventId The event identifier
     */
    function getEventAttendees(
        string memory eventId
    ) external view eventExists(eventId) returns (address[] memory) {
        return eventAttendees[eventId];
    }
    
    /**
     * @notice Get total number of events
     */
    function getTotalEvents() external view returns (uint256) {
        return allEventIds.length;
    }
    
    /**
     * @notice Get event ID by index
     * @param index The index in the events array
     */
    function getEventIdByIndex(uint256 index) external view returns (string memory) {
        require(index < allEventIds.length, "Index out of bounds");
        return allEventIds[index];
    }
}
