// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title PassToken
/// @notice ERC721 NFT representing event attendance passes
/// @dev Minted by ModuPassKRNL contract after KRNL verification
contract PassToken is ERC721, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;
    
    /// @dev Mapping from tokenId to event ID
    mapping(uint256 => string) public tokenEventId;
    
    /// @dev Mapping from eventId + attendee to tokenId
    mapping(bytes32 => uint256) public passTokenId;
    
    /// @notice Whether passes are soulbound (non-transferable)
    bool public isSoulbound;
    
    event PassMinted(
        uint256 indexed tokenId,
        string indexed eventId,
        address indexed attendee
    );
    
    error SoulboundToken();
    error PassAlreadyMinted();
    
    constructor(
        bool _isSoulbound
    ) ERC721("ModuPass", "MPASS") Ownable(msg.sender) {
        isSoulbound = _isSoulbound;
    }
    
    /// @notice Mint a new pass token
    /// @dev Only callable by owner (ModuPassKRNL contract)
    function mint(
        address attendee,
        string memory eventId,
        string memory tokenURI_
    ) external onlyOwner returns (uint256) {
        bytes32 passKey = keccak256(abi.encodePacked(eventId, attendee));
        
        if (passTokenId[passKey] != 0) {
            revert PassAlreadyMinted();
        }
        
        uint256 tokenId = _nextTokenId++;
        _safeMint(attendee, tokenId);
        _setTokenURI(tokenId, tokenURI_);
        
        tokenEventId[tokenId] = eventId;
        passTokenId[passKey] = tokenId;
        
        emit PassMinted(tokenId, eventId, attendee);
        
        return tokenId;
    }
    
    /// @notice Check if a pass exists for an event and attendee
    function hasPass(string memory eventId, address attendee) external view returns (bool) {
        bytes32 passKey = keccak256(abi.encodePacked(eventId, attendee));
        return passTokenId[passKey] != 0;
    }
    
    /// @notice Get token ID for an event and attendee
    function getTokenId(string memory eventId, address attendee) external view returns (uint256) {
        bytes32 passKey = keccak256(abi.encodePacked(eventId, attendee));
        return passTokenId[passKey];
    }
    
    /// @notice Override transfer functions to implement soulbound if enabled
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal virtual override returns (address) {
        address from = _ownerOf(tokenId);
        
        // Allow minting (from == address(0))
        // Block transfers if soulbound (from != address(0) && to != address(0))
        if (isSoulbound && from != address(0) && to != address(0)) {
            revert SoulboundToken();
        }
        
        return super._update(to, tokenId, auth);
    }
    
    /// @notice Toggle soulbound status (only owner)
    function setSoulbound(bool _isSoulbound) external onlyOwner {
        isSoulbound = _isSoulbound;
    }
    
    // Override required functions
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}