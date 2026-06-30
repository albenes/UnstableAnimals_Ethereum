const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("UnstableAnimalsV2 (simulation)", function () {
  const URI = "ipfs://QmQDWG92prsc64fPoeVtKrSZhR3RM2PCaCBCJLdH7A1vaK";
  const price = ethers.parseEther("0.03");

  let v2;
  let owner;
  let buyer;

  beforeEach(async function () {
    [owner, buyer] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("UnstableAnimalsV2");
    v2 = await Factory.deploy(
      "Unstable Animals V2",
      "UAV2",
      URI,
      price,
      owner.address,
      500 // 5% royalty
    );
    await v2.waitForDeployment();
  });

  it("deploys with Ownable2Step and ERC2981 royalty", async function () {
    expect(await v2.owner()).to.equal(owner.address);
    expect(await v2.price()).to.equal(price);
    expect(await v2.saleEnabled()).to.equal(false);
  });

  it("mints via buy with safeMint semantics", async function () {
    await v2.setSaleEnabled(true);
    await v2.connect(buyer).buy(2, { value: price * 2n });
    expect(await v2.totalMinted()).to.equal(2n);
    expect(await v2.ownerOf(1)).to.equal(buyer.address);
    expect(await v2.ownerOf(2)).to.equal(buyer.address);
  });

  it("respects pause", async function () {
    await v2.setSaleEnabled(true);
    await v2.pause();
    await expect(
      v2.connect(buyer).buy(1, { value: price })
    ).to.be.revertedWithCustomError(v2, "EnforcedPause");
  });

  it("owner can mint specific ids via mintGroup", async function () {
    await v2.mintGroup([100, 200]);
    expect(await v2.ownerOf(100)).to.equal(owner.address);
    expect(await v2.totalMinted()).to.equal(2n);
  });
});
