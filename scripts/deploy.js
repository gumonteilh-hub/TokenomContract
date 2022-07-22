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
  const Pokemon = await hre.ethers.getContractFactory("Pokemon");
  const pokemon = await Pokemon.deploy("TokeNom", "TKM", 60);

  await pokemon.deployed();


  [owner, user1, user2, user3] = await ethers.getSigners();

  await pokemon.connect(user1).mint("User1-Toke1");
  await pokemon.connect(user1).mint("User1-Toke2");
  await pokemon.connect(user1).mint("User1-Toke3");

  await pokemon.connect(user2).mint("User2-Toke1");
  await pokemon.connect(user2).mint("User2-Toke2");
  await pokemon.connect(user2).mint("User2-Toke3");

  await pokemon.connect(user3).mint("User3-Toke1");
  await pokemon.connect(user3).mint("User3-Toke2");
  await pokemon.connect(user3).mint("User3-Toke3");

  console.log("pokemon deployed to:", pokemon.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
