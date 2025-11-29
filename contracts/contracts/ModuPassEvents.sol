// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title ModuPassEvents
/// @notice Minimal on-chain registry of events for ModuPass.
/// @dev This is intentionally simple: it stores human-readable event IDs and
///      organizer-defined metadata so frontends and kernels can reference
///      events in a chain-agnostic way.
contract ModuPassEvents {
    struct EventData {
        string id;           // Human-readable identifier, e.g. "ethcc-2025-day1"
        string name;         // Display name
        string description;  // Short description for UIs
        uint64 startTime;    // Optional start time (unix seconds)
        uint64 endTime;      // Optional end time (unix seconds)
        address organizer;   // Creator / owner of the event
        uint64 createdAt;    // Block timestamp when first created
    }

    mapping(bytes32 => EventData) private _eventsByKey;
    bytes32[] private _eventKeys;

    event EventUpserted(string indexed id, address indexed organizer, bool isNew);

    error EventNotOwned();
    error EventNotFound();
    error InvalidId();

    /// @notice Create a new event or update an existing one.
    /// @dev The caller becomes the organizer on first creation and is the only
    ///      address allowed to perform subsequent updates.
    function createOrUpdateEvent(
        string memory id,
        string memory name,
        string memory description,
        uint64 startTime,
        uint64 endTime
    ) external {
        if (bytes(id).length == 0) {
            revert InvalidId();
        }

        bytes32 key = keccak256(bytes(id));
        EventData storage stored = _eventsByKey[key];
        bool isNew = stored.organizer == address(0);

        if (!isNew && stored.organizer != msg.sender) {
            revert EventNotOwned();
        }

        if (isNew) {
            stored.id = id;
            stored.organizer = msg.sender;
            stored.createdAt = uint64(block.timestamp);
            _eventKeys.push(key);
        }

        stored.name = name;
        stored.description = description;
        stored.startTime = startTime;
        stored.endTime = endTime;

        emit EventUpserted(id, msg.sender, isNew);
    }

    /// @notice Returns the event data for a given identifier.
    function getEventById(string memory id) external view returns (EventData memory) {
        bytes32 key = keccak256(bytes(id));
        EventData memory stored = _eventsByKey[key];
        if (stored.organizer == address(0)) {
            revert EventNotFound();
        }
        return stored;
    }

    /// @notice Returns the total number of stored events.
    function getEventCount() external view returns (uint256) {
        return _eventKeys.length;
    }

    /// @notice Returns the event at a particular index.
    function getEventByIndex(uint256 index) external view returns (EventData memory) {
        require(index < _eventKeys.length, "INDEX_OUT_OF_BOUNDS");
        return _eventsByKey[_eventKeys[index]];
    }

    /// @notice Returns all stored events. Intended for off-chain reads.
    function listEvents() external view returns (EventData[] memory) {
        uint256 length = _eventKeys.length;
        EventData[] memory events = new EventData[](length);
        for (uint256 i = 0; i < length; i++) {
            events[i] = _eventsByKey[_eventKeys[i]];
        }
        return events;
    }
}
