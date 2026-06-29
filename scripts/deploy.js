const hre = require("hardhat");

async function main() {
  const UnstableAnimals = await hre.ethers.getContractFactory("UnstableAnimals");
  const unstableAnimals = await UnstableAnimals.deploy(
    "Unstable Animals",
    "UNSTBL",
    "https://parallelworlds.mypinata.cloud/ipfs/QmQDWG92prsc64fPoeVtKrSZhR3RM2PCaCBCJLdH7A1vaK/"
  );

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  await unstableAnimals.waitForDeployment();

  console.log("UnstableAnimals deployed to:", await unstableAnimals.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
