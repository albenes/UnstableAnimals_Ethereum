const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("UnstableAnimals", function () {
  const URI = "ipfs://QmQDWG92prsc64fPoeVtKrSZhR3RM2PCaCBCJLdH7A1vaK";
  const price = ethers.parseEther("0.05");

  let unstableAnimals;
  let owner;
  let buyer;

  beforeEach(async function () {
    [owner, buyer] = await ethers.getSigners();
    const UnstableAnimals = await ethers.getContractFactory("UnstableAnimals");
    unstableAnimals = await UnstableAnimals.deploy("Unstable Animals", "UA", URI);
    await unstableAnimals.waitForDeployment();
  });

  it("sets the deployer as owner", async function () {
    expect(await unstableAnimals.owner()).to.equal(owner.address);
  });

  it("starts with sale disabled", async function () {
    expect(await unstableAnimals.saleEnabled()).to.equal(false);
  });

  describe("mintUnstableAnimalsGroup", function () {
    it("allows the owner to mint specific token ids", async function () {
      await unstableAnimals.mintUnstableAnimalsGroup([1, 2, 3]);
      expect(await unstableAnimals.UnstableAnimalsMinted()).to.equal(3n);
      expect(await unstableAnimals.ownerOf(1)).to.equal(owner.address);
      expect(await unstableAnimals.ownerOf(2)).to.equal(owner.address);
      expect(await unstableAnimals.ownerOf(3)).to.equal(owner.address);
    });

    it("reverts when a non-owner tries to mint", async function () {
      await expect(
        unstableAnimals.connect(buyer).mintUnstableAnimalsGroup([1])
      ).to.be.revertedWith("Used for giveaways and promotion purposes by Owner");
    });

    it("reverts for invalid token ids", async function () {
      await expect(unstableAnimals.mintUnstableAnimalsGroup([0])).to.be.revertedWith(
        "Invalid tokenId"
      );
      await expect(unstableAnimals.mintUnstableAnimalsGroup([10001])).to.be.revertedWith(
        "Invalid tokenId"
      );
    });
  });

  describe("buy", function () {
    beforeEach(async function () {
      await unstableAnimals.setSaleEnabled(true);
    });

    it("mints tokens when sale is enabled and payment is correct", async function () {
      await unstableAnimals.connect(buyer).buy(2, { value: price * 2n });
      expect(await unstableAnimals.UnstableAnimalsMinted()).to.equal(2n);
      expect(await unstableAnimals.ownerOf(1)).to.equal(buyer.address);
      expect(await unstableAnimals.ownerOf(2)).to.equal(buyer.address);
    });

    it("reverts when sale is disabled", async function () {
      await unstableAnimals.setSaleEnabled(false);
      await expect(
        unstableAnimals.connect(buyer).buy(1, { value: price })
      ).to.be.revertedWith("Sale has ended");
    });

    it("reverts when payment is incorrect", async function () {
      await expect(
        unstableAnimals.connect(buyer).buy(1, { value: price / 2n })
      ).to.be.revertedWith("Invalid amount of ether for amount to buy");
    });

    it("reverts when buying zero or more than ten tokens", async function () {
      await expect(unstableAnimals.connect(buyer).buy(0, { value: 0 })).to.be.revertedWith(
        "Invalid amount"
      );
      await expect(
        unstableAnimals.connect(buyer).buy(11, { value: price * 11n })
      ).to.be.revertedWith("Invalid amount");
    });
  });

  describe("owner controls", function () {
    it("allows the owner to toggle sale state", async function () {
      await unstableAnimals.setSaleEnabled(true);
      expect(await unstableAnimals.saleEnabled()).to.equal(true);
      await unstableAnimals.setSaleEnabled(false);
      expect(await unstableAnimals.saleEnabled()).to.equal(false);
    });

    it("allows the owner to update price and counter", async function () {
      const newPrice = ethers.parseEther("0.1");
      await unstableAnimals.setPrice(newPrice);
      expect(await unstableAnimals.price()).to.equal(newPrice);

      await unstableAnimals.setCounter(100);
      await unstableAnimals.setSaleEnabled(true);
      await unstableAnimals.connect(buyer).buy(1, { value: newPrice });
      expect(await unstableAnimals.ownerOf(100)).to.equal(buyer.address);
    });

    it("allows the owner to withdraw contract balance", async function () {
      await unstableAnimals.setSaleEnabled(true);
      await unstableAnimals.connect(buyer).buy(1, { value: price });

      const contractAddress = await unstableAnimals.getAddress();
      expect(await ethers.provider.getBalance(contractAddress)).to.equal(price);
      await unstableAnimals.withdraw();
      expect(await ethers.provider.getBalance(contractAddress)).to.equal(0n);
    });

    it("reverts when a non-owner calls owner-only functions", async function () {
      await expect(
        unstableAnimals.connect(buyer).setSaleEnabled(true)
      ).to.be.revertedWith("Only owner can toggle sale state");
      await expect(unstableAnimals.connect(buyer).withdraw()).to.be.revertedWith(
        "Only owner can withdraw"
      );
    });
  });
});
