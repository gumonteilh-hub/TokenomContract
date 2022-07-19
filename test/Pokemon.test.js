const { expect } = require("chai");
const { ethers } = require("hardhat");
const { constants, utils } = require("ethers");


describe("Pokemon", function () {

  let pokemon;
  let owner;
  let user1;

  before(async function () {
    [owner, user1] = await ethers.getSigners();
    let Pokemon = await ethers.getContractFactory("Pokemon");
    pokemon = await Pokemon.deploy("TokeNom", "TKM", 1);
  });

  describe('owner', async function () {
    it("Should be the owner of the contract", async function () {
      expect(await pokemon.owner()).to.equal(owner.address);
    });
  });

  describe('mint', async function () {
    it('Should send a transfert event to the user', async function () {
      await expect(pokemon.mint("Guigui"))//id 1
        .to.emit(pokemon, "Transfer")
        .withArgs(constants.AddressZero, owner.address, 1);
    });

    it('revert when user mint more than 6', async function () {
      await pokemon.mint("Guigui2")//id 2
      await pokemon.mint("Guigui3")//id 3
      await pokemon.mint("Guigui4")//id 4
      await pokemon.mint("Guigui5")//id 5
      await pokemon.mint("Guigui6")//id 6
      await expect(pokemon.mint("Guigui7"))
        .to.be.revertedWith("Cant have more than 6 Pokemon");
    });
  });

  describe('startBattle', async function () {
    it('revert when the sender is not the owner of the pokemon', async function () {
      await expect(pokemon.connect(user1).startBattle(1, 2))
        .to.be.revertedWith("Must be the owner");
    });

    it('revert when the sender is the owwner of the ennemy', async function () {
      await expect(pokemon.startBattle(1, 2))
        .to.be.revertedWith("Can't be the owner of the ennemy");
    });

    it('revert when the pokemon of the sender is already fighting', async function () {
      await pokemon.connect(user1).mint("user1");//id 7
      await pokemon.connect(user1).mint("user2");//id 8
      await pokemon.startBattle(1, 7);
      await expect(pokemon.startBattle(1, 8))
        .to.be.revertedWith("Your pokemon is already fighting");
    });

    it('revert when the pokemon target is already fighting', async function () {
      await expect(pokemon.startBattle(2, 7))
        .to.be.revertedWith("Your target is already fighting");
    });

    it('revert when the target does not exist', async function () {
      await expect(pokemon.startBattle(1, 100))
        .to.be.revertedWith("Wrong versusId : Your target does not exist");
    });

    it('Should emit a StartBattle Event to the user', async function () {
      await expect(pokemon.startBattle(3, 8))
        .to.emit(pokemon, "BattleBegin")
        .withArgs(8);
    });
  });

  describe('attack', async function () {
    it('revert when the sender is not the owner of the pokemon', async function () {
      await expect(pokemon.connect(user1).attack(1, 0))
        .to.be.revertedWith("Must be the owner");
    });

    it('revert when the pokemon is not in a fight', async function () {
      await expect(pokemon.attack(2, 0))
        .to.be.revertedWith("Not in a fight");
    });

    it('revert if the attacks does not exist', async function () {
      await expect(pokemon.connect(user1).attack(8, 26))
        .to.be.revertedWith("This attack does not exist or have not be learned yet by your pokemon");
    });

    it('Should emit an  Event to the user', async function () {
      var pokemonstats = await pokemon.pokemonStats(3);
      await expect(pokemon.connect(user1).attack(8, 0))
        .to.emit(pokemon, "AttackSuccess")
        .withArgs(3, 5, pokemonstats.lifePoint - 5);
    });

    it('revert when the pokemon is in cooldown', async function () {
      await expect(pokemon.connect(user1).attack(8, 0))
        .to.be.revertedWith("It's your oponent's turn");
    });

    it('Should emit an  Event to the user after waiting for cooldown', async function () {
      var pokemonstats = await pokemon.pokemonStats(3);
      await new Promise(r => setTimeout(r, 1000));
      if (pokemonstats.lifePoint > 5) {
        await expect(pokemon.connect(user1).attack(8, 0))
          .to.emit(pokemon, "AttackSuccess")
          .withArgs(3, 5, pokemonstats.lifePoint - 5);
      }
      else {
        await expect(pokemon.connect(user1).attack(8, 0))
          .to.emit(pokemon, "BattleWin")
          .withArgs(3, 2);
      }
    });

    it('Should emit an  Event when the fight is over', async function () {
      await pokemon.connect(user1).mint("user3");//id 9
      await pokemon.startBattle(4,9);
      var pokemonstats = [await pokemon.pokemonStats(4), await pokemon.pokemonStats(9)];
      var turn = 1;
      var nextTurn = [owner, user1];
      var allyId = [4, 9]
      var ennemyId = [9, 4];

      
      while(true){
        //console.log("pokemon id :" + ennemyId[turn] + "\n lifepoint : "+ pokemonstats[(turn+1)%2].lifePoint );
        if(pokemonstats[(turn+1)%2].lifePoint <= 5){
          await expect(pokemon.connect(nextTurn[turn]).attack(allyId[turn],0))
            .to.emit(pokemon, "BattleWin")
            .withArgs(ennemyId[turn], pokemonstats[turn].level + 1);
            break;
        }
        await pokemon.connect(nextTurn[turn]).attack(allyId[turn], 0);
        pokemonstats[turn] = await pokemon.pokemonStats(allyId[turn]);
        pokemonstats[!turn] = await pokemon.pokemonStats(ennemyId[turn]);
        turn == 0 ? turn=1 : turn=0;
      }
    });
  });




});
