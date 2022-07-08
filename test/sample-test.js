const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Pokemon", function () {

  let pokemon;

  before(async function () {
    owner = await ethers.getSigners();
    let Pokemon = await ethers.getContractFactory("USDC");
    pokemon = await Pokemon.deploy();
  });

  it("Should be the owner of the contract", async function () {
    expect(await pokemon.owner()).to.equal(owner.address);
  });


});
