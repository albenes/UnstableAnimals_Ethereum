const hre = require("hardhat");

async function main() {
  const SpaceShibas = await hre.ethers.getContractFactory("SpaceShibas");
  const spaceShibas = await SpaceShibas.deploy("Unstable Animals", "UA", "ipfs://QmYcsZAmYo19UNzZa1knTb8JahT2ymgvyTYszvtzieYerK");

  await spaceShibas.deployed();

  console.log("Unstable Animals (SpaceShibas) deployed to:", spaceShibas.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
