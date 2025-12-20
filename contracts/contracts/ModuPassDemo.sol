// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ModuPassDemo
 * @notice A PERMISSIVE version of ModuPassTargetBase for DEMONSTRATION.
 * @dev This contract maintains the AuthData signature to simulate KRNL flows.
 */

struct AuthData {
    uint256 nonce;
    uint256 expiry;
    bytes32 id;
    bytes32[] executions;
    bytes result;
    bool sponsorExecutionFee;
    bytes signature;
}

contract ModuPassDemo {
    
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
        bool verified;
    }
    
    mapping(string => Event) public events;
    mapping(string => mapping(address => AttendanceProof)) public attendanceRecords;
    mapping(string => address[]) public eventAttendees;
    string[] public allEventIds;
    
    event EventCreated(string indexed eventId, string eventName, address indexed organizer, uint256 timestamp);
    event AttendanceVerified(string indexed eventId, address indexed attendee, uint256 timestamp);

    /**
     * @notice Create Event (Permissive)
     * @dev Decodes params from result field to simulate KRNL behavior.
     */
    function createEvent(AuthData calldata authData) external {
        (string memory eventId, string memory eventName, bytes32 codesMerkleRoot, uint256 maxAttendees) = 
            abi.decode(authData.result, (string, string, bytes32, uint256));

        require(bytes(eventId).length > 0, "Empty ID");
        require(events[eventId].createdAt == 0, "Exists");

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
     * @notice Verify Attendance (Permissive)
     */
    function verifyAttendance(AuthData calldata authData) external {
        (string memory eventId, address attendee, string memory code) = 
            abi.decode(authData.result, (string, address, string));

        require(events[eventId].createdAt > 0, "No event");
        require(!attendanceRecords[eventId][attendee].verified, "Already verified");

        attendanceRecords[eventId][attendee] = AttendanceProof({
            attendee: attendee,
            timestamp: block.timestamp,
            verified: true
        });
        
        eventAttendees[eventId].push(attendee);
        emit AttendanceVerified(eventId, attendee, block.timestamp);
    }

    // View functions (Standard)
    function getEvent(string memory eventId) external view returns (string memory, string memory, address, uint256, bool) {
        Event memory e = events[eventId];
        return (e.eventId, e.eventName, e.organizer, e.createdAt, e.isActive);
    }
    function isAttendanceVerified(string memory eventId, address attendee) external view returns (bool) {
        return attendanceRecords[eventId][attendee].verified;
    }
    function getEventAttendees(string memory eventId) external view returns (address[] memory) {
        return eventAttendees[eventId];
    }
    function getTotalEvents() external view returns (uint256) {
        return allEventIds.length;
    }
    function getEventIdByIndex(uint256 index) external view returns (string memory) {
        return allEventIds[index];
    }
}
