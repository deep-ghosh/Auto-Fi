// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "./AgentRegistry.sol";

contract AttendanceNFT is ERC721, ERC721URIStorage, Ownable, Pausable, ReentrancyGuard {
    struct NFTMetadata {
        string name;
        string description;
        string image;
        string eventName;
        uint256 eventDate;
        bool soulbound;
        uint256 mintedAt;
    }

    AgentRegistry public immutable agentRegistry;
    
    mapping(uint256 => NFTMetadata) public tokenMetadata;
    mapping(uint256 => bool) public authorizedMinters;
    mapping(address => uint256[]) public ownerTokens;
    mapping(string => bool) public usedMetadataURIs;
    
    uint256 public nextTokenId = 1;
    uint256 public constant MAX_BATCH_SIZE = 100;
    string public baseURI;

    event NFTMinted(
        uint256 indexed tokenId,
        address indexed recipient,
        string metadataURI,
        bool soulbound
    );
    
    event BatchMinted(
        uint256[] tokenIds,
        address[] recipients,
        string[] metadataURIs
    );
    
    event MinterAuthorized(
        uint256 indexed agentId,
        bool authorized
    );
    
    event MetadataUpdated(
        uint256 indexed tokenId,
        string metadataURI
    );

    constructor(
        string memory _name,
        string memory _symbol,
        address _agentRegistry
    ) ERC721(_name, _symbol) Ownable() {
        agentRegistry = AgentRegistry(_agentRegistry);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function mintAttendanceNFT(
        uint256 _agentId,
        address _recipient,
        string memory _metadataURI,
        bool _soulbound
    ) external whenNotPaused nonReentrant returns (uint256) {
        (,,,,,,,,bool isActive) = agentRegistry.agents(_agentId);
        require(isActive, "Agent not active");
        (,,,address agentWallet,,,,,) = agentRegistry.agents(_agentId);
        require(agentWallet == msg.sender, "Not agent wallet");
        require(authorizedMinters[_agentId], "Agent not authorized to mint");
        require(_recipient != address(0), "Invalid recipient");
        require(bytes(_metadataURI).length > 0, "Metadata URI cannot be empty");
        require(!usedMetadataURIs[_metadataURI], "Metadata URI already used");

        require(
            agentRegistry.isOperationAllowed(_agentId, "MINT_NFT", 0, _recipient),
            "Mint operation not allowed"
        );

        uint256 tokenId = nextTokenId++;
        
        _safeMint(_recipient, tokenId);
        _setTokenURI(tokenId, _metadataURI);

        tokenMetadata[tokenId] = NFTMetadata({
            name: "",
            description: "",
            image: "",
            eventName: "",
            eventDate: 0,
            soulbound: _soulbound,
            mintedAt: block.timestamp
        });

        ownerTokens[_recipient].push(tokenId);
        
        usedMetadataURIs[_metadataURI] = true;

        agentRegistry.recordAgentAction(_agentId, "MINT_NFT", 1, _recipient);

        emit NFTMinted(tokenId, _recipient, _metadataURI, _soulbound);
        return tokenId;
    }

    function batchMint(
        uint256 _agentId,
        address[] memory _recipients,
        string[] memory _metadataURIs
    ) external whenNotPaused nonReentrant returns (uint256[] memory) {
        (,,,,,,,,bool isActive) = agentRegistry.agents(_agentId);
        require(isActive, "Agent not active");
        (,,,address agentWallet,,,,,) = agentRegistry.agents(_agentId);
        require(agentWallet == msg.sender, "Not agent wallet");
        require(authorizedMinters[_agentId], "Agent not authorized to mint");
        require(_recipients.length == _metadataURIs.length, "Array length mismatch");
        require(_recipients.length > 0 && _recipients.length <= MAX_BATCH_SIZE, "Invalid batch size");

        require(
            agentRegistry.isOperationAllowed(_agentId, "MINT_NFT", _recipients.length, address(0)),
            "Batch mint operation not allowed"
        );

        uint256[] memory tokenIds = new uint256[](_recipients.length);

        for (uint256 i = 0; i < _recipients.length; i++) {
            require(_recipients[i] != address(0), "Invalid recipient");
            require(bytes(_metadataURIs[i]).length > 0, "Metadata URI cannot be empty");
            require(!usedMetadataURIs[_metadataURIs[i]], "Metadata URI already used");

            uint256 tokenId = nextTokenId++;
            
            _safeMint(_recipients[i], tokenId);
            _setTokenURI(tokenId, _metadataURIs[i]);

            tokenMetadata[tokenId] = NFTMetadata({
                name: "",
                description: "",
                image: "",
                eventName: "",
                eventDate: 0,
                soulbound: false,
                mintedAt: block.timestamp
            });

            ownerTokens[_recipients[i]].push(tokenId);
            
            usedMetadataURIs[_metadataURIs[i]] = true;

            tokenIds[i] = tokenId;
        }

        agentRegistry.recordAgentAction(_agentId, "MINT_NFT", _recipients.length, address(0));

        emit BatchMinted(tokenIds, _recipients, _metadataURIs);
        return tokenIds;
    }

    function setMinterAgent(uint256 _agentId, bool _authorized) external onlyOwner {
        authorizedMinters[_agentId] = _authorized;
        emit MinterAuthorized(_agentId, _authorized);
    }

    function updateTokenMetadata(
        uint256 _tokenId,
        string memory _name,
        string memory _description,
        string memory _image,
        string memory _eventName,
        uint256 _eventDate
    ) external {
        require(_exists(_tokenId), "Token does not exist");
        require(ownerOf(_tokenId) == msg.sender || msg.sender == owner(), "Not authorized");

        tokenMetadata[_tokenId].name = _name;
        tokenMetadata[_tokenId].description = _description;
        tokenMetadata[_tokenId].image = _image;
        tokenMetadata[_tokenId].eventName = _eventName;
        tokenMetadata[_tokenId].eventDate = _eventDate;
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
        
        if (from != address(0) && to != address(0) && tokenMetadata[tokenId].soulbound) {
            revert("Soulbound NFT cannot be transferred");
        }
    }

    function getTokenMetadata(uint256 _tokenId) external view returns (
        string memory name,
        string memory description,
        string memory image,
        string memory eventName,
        uint256 eventDate,
        bool soulbound,
        uint256 mintedAt
    ) {
        require(_exists(_tokenId), "Token does not exist");
        NFTMetadata storage metadata = tokenMetadata[_tokenId];
        return (
            metadata.name,
            metadata.description,
            metadata.image,
            metadata.eventName,
            metadata.eventDate,
            metadata.soulbound,
            metadata.mintedAt
        );
    }

    function getOwnerTokens(address _owner) external view returns (uint256[] memory) {
        return ownerTokens[_owner];
    }

    function getOwnerTokenCount(address _owner) external view returns (uint256) {
        return ownerTokens[_owner].length;
    }

    function isAuthorizedMinter(uint256 _agentId) external view returns (bool) {
        return authorizedMinters[_agentId];
    }

    function setBaseURI(string memory _baseURI) external onlyOwner {
        baseURI = _baseURI;
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function emergencyPause() external onlyOwner {
        _pause();
    }

    function emergencyUnpause() external onlyOwner {
        _unpause();
    }
}