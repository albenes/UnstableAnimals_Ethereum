const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SpaceShibas", function () {
  const URI = "ipfs://QmYcsZAmYo19UNzZa1knTb8JahT2ymgvyTYszvtzieYerK";
  const price = ethers.parseEther("0.05");

  let spaceShibas;
  let owner;
  let buyer;

  beforeEach(async function () {
    [owner, buyer] = await ethers.getSigners();
    const SpaceShibas = await ethers.getContractFactory("SpaceShibas");
    spaceShibas = await SpaceShibas.deploy("Unstable Animals", "UA", URI);
    await spaceShibas.waitForDeployment();
  });

  it("sets the deployer as owner", async function () {
    expect(await spaceShibas.owner()).to.equal(owner.address);
  });

  it("starts with sale disabled", async function () {
    expect(await spaceShibas.saleEnabled()).to.equal(false);
  });

  describe("mintBunch", function () {
    it("allows the owner to mint specific token ids", async function () {
      await spaceShibas.mintBunch([1, 2, 3]);
      expect(await spaceShibas.shibasMinted()).to.equal(3n);
      expect(await spaceShibas.ownerOf(1)).to.equal(owner.address);
      expect(await spaceShibas.ownerOf(2)).to.equal(owner.address);
      expect(await spaceShibas.ownerOf(3)).to.equal(owner.address);
    });

    it("reverts when a non-owner tries to mint", async function () {
      await expect(
        spaceShibas.connect(buyer).mintBunch([1])
      ).to.be.revertedWith("Only owner can mint before sale");
    });

    it("reverts for invalid token ids", async function () {
      await expect(spaceShibas.mintBunch([0])).to.be.revertedWith("Invalid tokenId");
      await expect(spaceShibas.mintBunch([10001])).to.be.revertedWith("Invalid tokenId");
    });
  });

  describe("buy", function () {
    beforeEach(async function () {
      await spaceShibas.setSaleEnabled(true);
    });

    it("mints tokens when sale is enabled and payment is correct", async function () {
      await spaceShibas.connect(buyer).buy(2, { value: price * 2n });
      expect(await spaceShibas.shibasMinted()).to.equal(2n);
      expect(await spaceShibas.ownerOf(1)).to.equal(buyer.address);
      expect(await spaceShibas.ownerOf(2)).to.equal(buyer.address);
    });

    it("reverts when sale is disabled", async function () {
      await spaceShibas.setSaleEnabled(false);
      await expect(
        spaceShibas.connect(buyer).buy(1, { value: price })
      ).to.be.revertedWith("Sale has ended");
    });

    it("reverts when payment is incorrect", async function () {
      await expect(
        spaceShibas.connect(buyer).buy(1, { value: price / 2n })
      ).to.be.revertedWith("Invalid amount of ether for amount to buy");
    });

    it("reverts when buying zero or more than ten tokens", async function () {
      await expect(
        spaceShibas.connect(buyer).buy(0, { value: 0 })
      ).to.be.revertedWith("Invalid amount");
      await expect(
        spaceShibas.connect(buyer).buy(11, { value: price * 11n })
      ).to.be.revertedWith("Invalid amount");
    });
  });

  describe("owner controls", function () {
    it("allows the owner to toggle sale state", async function () {
      await spaceShibas.setSaleEnabled(true);
      expect(await spaceShibas.saleEnabled()).to.equal(true);
      await spaceShibas.setSaleEnabled(false);
      expect(await spaceShibas.saleEnabled()).to.equal(false);
    });

    it("allows the owner to update price and counter", async function () {
      const newPrice = ethers.parseEther("0.1");
      await spaceShibas.setPrice(newPrice);
      expect(await spaceShibas.price()).to.equal(newPrice);

      await spaceShibas.setCounter(100);
      await spaceShibas.setSaleEnabled(true);
      await spaceShibas.connect(buyer).buy(1, { value: newPrice });
      expect(await spaceShibas.ownerOf(100)).to.equal(buyer.address);
    });

    it("allows the owner to withdraw contract balance", async function () {
      await spaceShibas.setSaleEnabled(true);
      await spaceShibas.connect(buyer).buy(1, { value: price });

      const contractAddress = await spaceShibas.getAddress();
      expect(await ethers.provider.getBalance(contractAddress)).to.equal(price);
      await spaceShibas.withdraw();
      expect(await ethers.provider.getBalance(contractAddress)).to.equal(0n);
    });

    it("reverts when a non-owner calls owner-only functions", async function () {
      await expect(
        spaceShibas.connect(buyer).setSaleEnabled(true)
      ).to.be.revertedWith("Only owner can toggle sale state");
      await expect(
        spaceShibas.connect(buyer).withdraw()
      ).to.be.revertedWith("Only owner can withdraw");
    });
  });
});
