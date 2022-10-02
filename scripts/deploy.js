// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const Tokenom = await hre.ethers.getContractFactory("Tokenom");
  const tokenom = await Tokenom.deploy("TokeNom", "TKM", 60, 5);

  await tokenom.deployed();

  tokenom.setBaseURI("");

  [owner, user1, user2, user3] = await ethers.getSigners();

  await tokenom.connect(user1).mint("User1-Toke1");
  await tokenom.connect(user1).mint("User1-Toke2");
  await tokenom.connect(user1).mint("User1-Toke3");

  await tokenom.connect(user2).mint("User2-Toke1");
  await tokenom.connect(user2).mint("User2-Toke2");
  await tokenom.connect(user2).mint("User2-Toke3");

  await tokenom.connect(user3).mint("User3-Toke1");
  await tokenom.connect(user3).mint("User3-Toke2");
  await tokenom.connect(user3).mint("User3-Toke3");

  console.log("tokenom deployed to:", tokenom.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
