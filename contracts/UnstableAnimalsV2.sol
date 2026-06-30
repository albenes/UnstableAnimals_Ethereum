// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title UnstableAnimalsV2
 * @notice Reference / simulation only — NOT deployed. Explores a modernized mint contract.
 * @dev Differences from V1: OZ imports, ERC2981, Pausable, ReentrancyGuard, Ownable2Step,
 *      no setCounter backdoor, safeMint, pull payments via call.
 */
contract UnstableAnimalsV2 is
    ERC721Enumerable,
    ERC2981,
    Ownable2Step,
    Pausable,
    ReentrancyGuard
{
    uint256 public constant MAX_SUPPLY = 10_000;
    uint256 public price;
    bool public saleEnabled;

    uint256 private _nextTokenId = 1;
    uint256 public totalMinted;

    string private _baseTokenURI;

    event UnstableAnimalsBought(
        address indexed buyer,
        uint256 amountMinted,
        uint256[] tokenIds
    );

    constructor(
        string memory name_,
        string memory symbol_,
        string memory baseURI_,
        uint256 priceWei,
        address royaltyReceiver,
        uint96 royaltyBps
    ) ERC721(name_, symbol_) Ownable(msg.sender) {
        _baseTokenURI = baseURI_;
        price = priceWei;
        _setDefaultRoyalty(royaltyReceiver, royaltyBps);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Enumerable, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function setBaseURI(string calldata newBaseURI) external onlyOwner {
        _baseTokenURI = newBaseURI;
    }

    function setPrice(uint256 newPrice) external onlyOwner {
        price = newPrice;
    }

    function setSaleEnabled(bool enabled) external onlyOwner {
        saleEnabled = enabled;
    }

    function setDefaultRoyalty(address receiver, uint96 feeNumerator) external onlyOwner {
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /// @notice Owner mint for giveaways — explicit token IDs (same idea as V1).
    function mintGroup(uint256[] calldata tokenIds) external onlyOwner {
        totalMinted += tokenIds.length;
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 id = tokenIds[i];
            require(id != 0 && id <= MAX_SUPPLY, "Invalid tokenId");
            _safeMint(owner(), id);
        }
    }

    /// @notice Public mint — sequential IDs from _nextTokenId (simpler than V1 gap-filling).
    function buy(uint256 amount) external payable whenNotPaused nonReentrant {
        require(saleEnabled, "Sale has ended");
        require(amount > 0 && amount <= 10, "Invalid amount");
        require(msg.value == price * amount, "Invalid payment");
        require(totalMinted + amount <= MAX_SUPPLY, "Exceeds max supply");

        uint256[] memory mintedIds = new uint256[](amount);
        for (uint256 i = 0; i < amount; i++) {
            uint256 tokenId = _nextTokenId;
            require(tokenId <= MAX_SUPPLY, "Sold out");
            _nextTokenId++;
            mintedIds[i] = tokenId;
            _safeMint(msg.sender, tokenId);
        }

        totalMinted += amount;
        emit UnstableAnimalsBought(msg.sender, amount, mintedIds);
    }

    function withdraw() external onlyOwner nonReentrant {
        (bool ok, ) = payable(owner()).call{value: address(this).balance}("");
        require(ok, "Withdraw failed");
    }
}
