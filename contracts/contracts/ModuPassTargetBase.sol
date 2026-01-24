// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./TargetBase.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/**
 * @title ModuPassTargetBase
 * @notice Event attendance verification system using KRNL's TargetBase authorization with NFT passes
 * @dev Extends TargetBase and ERC721 to provide secure, verifiable proof of attendance as NFTs
 */
contract ModuPassTargetBase is TargetBase, ERC721 {
    // Structs
    struct Event {
        string eventId;
        string eventName;
        address organizer;
        bytes32 codesMerkleRoot;
        uint256 maxAttendees;
        uint256 createdAt;
        bool isActive;
    }

    struct AttendanceData {
        string eventId;
        address attendee;
        string code;
        uint256 timestamp;
        bool isValid;
    }

    // State variables
    mapping(string => Event) public events;
    mapping(string => mapping(address => bool)) public attendees;
    mapping(string => address[]) private eventAttendeesList;
    mapping(string => uint256) public attendeeCounts;
    
    string[] private eventIds;
    uint256 private totalEvents;

    uint256 private _nextTokenId = 1;
    mapping(uint256 => string) public tokenToEventId;
    mapping(uint256 => address) public tokenToAttendee;
    mapping(uint256 => uint256) public tokenToTimestamp;
    string private _baseTokenURI;

    // Events
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
        uint256 timestamp
    );

    event PassMinted(
        uint256 indexed tokenId,
        string indexed eventId,
        address indexed attendee,
        uint256 timestamp
    );

    // Errors
    error EventAlreadyExists();
    error EventNotFound();
    error EventInactive();
    error AlreadyAttended();
    error MaxAttendeesReached();
    error InvalidVerificationCode();

    constructor(
        address _masterKey,
        address _recoveryKey,
        bytes32 _delegatedAccountCodeHash
    ) TargetBase(_masterKey, _recoveryKey, _delegatedAccountCodeHash) ERC721("ModuPass", "MPASS") {}

    /**
     * @notice Create a new event (KRNL-authorized)
     * @param authData KRNL authorization data containing encoded event details
     * @dev authData.result should contain: (string eventId, string eventName, bytes32 codesMerkleRoot, uint256 maxAttendees)
     */
    function createEvent(AuthData calldata authData) 
        external 
        requireAuth(authData) 
    {
        // Decode event data from authData.result
        (
            string memory eventId,
            string memory eventName,
            bytes32 codesMerkleRoot,
            uint256 maxAttendees
        ) = abi.decode(authData.result, (string, string, bytes32, uint256));

        // Validate
        require(bytes(eventId).length > 0, "Event ID cannot be empty");
        require(bytes(eventName).length > 0, "Event name cannot be empty");
        require(bytes(events[eventId].eventId).length == 0, "Event already exists");
        require(codesMerkleRoot != bytes32(0), "Invalid Merkle root");

        // Create event
        events[eventId] = Event({
            eventId: eventId,
            eventName: eventName,
            organizer: msg.sender,
            codesMerkleRoot: codesMerkleRoot,
            maxAttendees: maxAttendees,
            createdAt: block.timestamp,
            isActive: true
        });

        eventIds.push(eventId);
        totalEvents++;

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
     * @notice Verify attendance for an event (KRNL-authorized)
     * @param authData KRNL authorization data containing encoded attendance verification
     * @dev authData.result should contain: (string eventId, address attendee, string code, uint256 timestamp, bool isValid)
     *      The KRNL workflow performs off-chain Merkle verification and sets isValid accordingly
     */
    function verifyAttendance(AuthData calldata authData) 
        external 
        requireAuth(authData) 
    {
        // Decode attendance data from authData.result
        AttendanceData memory data = abi.decode(authData.result, (AttendanceData));

        // Validate event exists and is active
        Event storage eventData = events[data.eventId];
        if (bytes(eventData.eventId).length == 0) revert EventNotFound();
        if (!eventData.isActive) revert EventInactive();

        // Validate attendance
        if (attendees[data.eventId][data.attendee]) revert AlreadyAttended();
        if (attendeeCounts[data.eventId] >= eventData.maxAttendees) revert MaxAttendeesReached();
        
        // Verify the KRNL workflow confirmed the code is valid
        if (!data.isValid) revert InvalidVerificationCode();

        // Record attendance
        attendees[data.eventId][data.attendee] = true;
        eventAttendeesList[data.eventId].push(data.attendee);
        attendeeCounts[data.eventId]++;

        emit AttendanceVerified(data.eventId, data.attendee, data.timestamp);

        // Mint NFT pass
        uint256 tokenId = _nextTokenId++;
        _mint(data.attendee, tokenId);
        tokenToEventId[tokenId] = data.eventId;
        tokenToAttendee[tokenId] = data.attendee;
        tokenToTimestamp[tokenId] = data.timestamp;

        emit PassMinted(tokenId, data.eventId, data.attendee, data.timestamp);
    }

    /**
     * @notice Get event details
     * @param eventId The event ID
     * @return Event struct
     */
    function getEvent(string memory eventId) 
        external 
        view 
        returns (Event memory) 
    {
        return events[eventId];
    }

    /**
     * @notice Get list of attendees for an event
     * @param eventId The event ID
     * @return Array of attendee addresses
     */
    function getEventAttendees(string memory eventId) 
        external 
        view 
        returns (address[] memory) 
    {
        return eventAttendeesList[eventId];
    }

    /**
     * @notice Get total number of events
     * @return Total events count
     */
    function getTotalEvents() external view returns (uint256) {
        return totalEvents;
    }

    /**
     * @notice Get event ID by index
     * @param index The index
     * @return Event ID string
     */
    function getEventIdByIndex(uint256 index) external view returns (string memory) {
        require(index < totalEvents, "Index out of bounds");
        return eventIds[index];
    }

    /**
     * @notice Check if an address has attended an event
     * @param eventId The event ID
     * @param attendee The attendee address
     * @return True if attended
     */
    function hasAttended(string memory eventId, address attendee) 
        external 
        view 
        returns (bool) 
    {
        return attendees[eventId][attendee];
    }

    /**
     * @notice Toggle event active status (only organizer)
     * @param eventId The event ID
     */
    function toggleEventStatus(string memory eventId) external {
        Event storage eventData = events[eventId];
        require(bytes(eventData.eventId).length > 0, "Event not found");
        require(msg.sender == eventData.organizer, "Only organizer can toggle status");

        eventData.isActive = !eventData.isActive;
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function setBaseURI(string memory baseURI) external {
        _baseTokenURI = baseURI;
    }

    function getTokenDetails(uint256 tokenId) external view returns (string memory eventId, address attendee, uint256 timestamp) {
        return (tokenToEventId[tokenId], tokenToAttendee[tokenId], tokenToTimestamp[tokenId]);
    }
}
